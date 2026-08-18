/**
 * Database persistence for scraped listings, images, and job tracking.
 */
import { getPrisma } from "@/lib/sell/server/listingRepo";
import type { ScrapedListing } from "./scrapedListing.types";
import type {
  CreateAggregatedImageInput,
  ScrapingJobRecord,
  ScrapingJobStatus,
  UpdateScrapingJobInput,
  UpsertListingsResult,
} from "./persistence.types";

const LISTING_TTL_DAYS = 30;
const BATCH_SIZE = 1000;
const DEFAULT_IMAGE_QUALITY = 80;

function expiresAt(): Date {
  return new Date(Date.now() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export class ScrapingDatabaseService {
  /**
   * Upsert listings in batches of 1000 within a transaction.
   * Rolls back the entire batch on failure.
   */
  async upsertListings(listings: ScrapedListing[], scraper: string): Promise<UpsertListingsResult> {
    const prisma = getPrisma();
    const listingIds = new Map<string, string>();
    let created = 0;
    let updated = 0;
    let errors = 0;
    const expiry = expiresAt();

    for (let offset = 0; offset < listings.length; offset += BATCH_SIZE) {
      const batch = listings.slice(offset, offset + BATCH_SIZE);

      try {
        await prisma.$transaction(async (tx) => {
          for (const item of batch) {
            const sourceWebsite = item.sourceWebsite || scraper;

            const existing = await tx.aggregatedListing.findUnique({
              where: {
                sourceWebsite_externalId: {
                  sourceWebsite,
                  externalId: item.externalId,
                },
              },
              select: { id: true },
            });

            if (existing) {
              await tx.aggregatedListing.update({
                where: { id: existing.id },
                data: {
                  title: item.title,
                  priceInr: BigInt(item.priceInr),
                  location: item.location,
                  mileage: item.mileage ?? null,
                  condition: item.condition ?? null,
                  sellerName: item.sellerName ?? null,
                  listingUrl: item.listingUrl,
                  city: item.city,
                  category: item.category,
                  lastScrapedAt: new Date(),
                  expiresAt: expiry,
                },
              });
              listingIds.set(item.externalId, existing.id);
              updated++;
            } else {
              const row = await tx.aggregatedListing.create({
                data: {
                  sourceWebsite,
                  externalId: item.externalId,
                  title: item.title,
                  priceInr: BigInt(item.priceInr),
                  location: item.location,
                  mileage: item.mileage ?? null,
                  condition: item.condition ?? null,
                  sellerName: item.sellerName ?? null,
                  listingUrl: item.listingUrl,
                  city: item.city,
                  category: item.category,
                  lastScrapedAt: new Date(),
                  expiresAt: expiry,
                },
              });
              listingIds.set(item.externalId, row.id);
              created++;
            }
          }
        });
      } catch (err) {
        errors += batch.length;
        await this.logError("upsertListings batch failed — rolled back", {
          scraper,
          offset,
          batchSize: batch.length,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }

    return { created, updated, errors, listingIds };
  }

  /**
   * Replace image records for a listing with ordered AggregatedImage rows.
   */
  async createImages(
    listingId: string,
    images: CreateAggregatedImageInput[] | string[]
  ): Promise<number> {
    if (!images.length) return 0;

    const prisma = getPrisma();
    const rows: CreateAggregatedImageInput[] = images.map((img, order) =>
      typeof img === "string"
        ? { url: img, order, quality: DEFAULT_IMAGE_QUALITY }
        : { ...img, order: img.order ?? order, quality: img.quality ?? DEFAULT_IMAGE_QUALITY }
    );

    await prisma.$transaction(async (tx) => {
      await tx.aggregatedImage.deleteMany({ where: { listingId } });
      await tx.aggregatedImage.createMany({
        data: rows.map((img) => ({
          listingId,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl ?? null,
          order: img.order,
          quality: img.quality ?? DEFAULT_IMAGE_QUALITY,
        })),
      });
    });

    return rows.length;
  }

  /**
   * Persist listings and their images in one coordinated flow.
   */
  async persistListingsWithImages(
    listings: ScrapedListing[],
    scraper: string,
    imagesByExternalId: Map<string, CreateAggregatedImageInput[]>
  ): Promise<UpsertListingsResult & { imagesCreated: number }> {
    const upsert = await this.upsertListings(listings, scraper);
    let imagesCreated = 0;

    for (const listing of listings) {
      const dbId = upsert.listingIds.get(listing.externalId);
      const images = imagesByExternalId.get(listing.externalId);
      if (!dbId || !images?.length) continue;

      try {
        imagesCreated += await this.createImages(dbId, images);
      } catch (err) {
        upsert.errors++;
        await this.logError("createImages failed", {
          listingId: dbId,
          externalId: listing.externalId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { ...upsert, imagesCreated };
  }

  /**
   * Create or update a scraping job record (keyed by Bull job id).
   */
  async updateScrapingJob(jobId: string, input: UpdateScrapingJobInput): Promise<ScrapingJobRecord> {
    const prisma = getPrisma();
    const now = new Date();
    const isTerminal = input.status === "SUCCESS" || input.status === "FAILED";

    const row = await prisma.scrapingJob.upsert({
      where: { bullJobId: jobId },
      create: {
        bullJobId: jobId,
        jobType: input.jobType ?? "olx_scrape",
        source: input.source ?? "olx",
        city: input.city ?? null,
        category: input.category ?? null,
        status: input.status ?? "RUNNING",
        listingsScraped: input.listingsScraped ?? 0,
        imagesDownloaded: input.imagesDownloaded ?? 0,
        errorsEncountered: input.errorsEncountered ?? 0,
        errorLog: input.errorLog ?? null,
        startedAt: input.status === "RUNNING" || !input.status ? now : null,
        completedAt: isTerminal ? now : null,
      },
      update: {
        ...(input.jobType !== undefined && { jobType: input.jobType }),
        ...(input.source !== undefined && { source: input.source }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.listingsScraped !== undefined && { listingsScraped: input.listingsScraped }),
        ...(input.imagesDownloaded !== undefined && { imagesDownloaded: input.imagesDownloaded }),
        ...(input.errorsEncountered !== undefined && { errorsEncountered: input.errorsEncountered }),
        ...(input.errorLog !== undefined && { errorLog: input.errorLog }),
        ...(input.status === "RUNNING" && { startedAt: now }),
        ...(isTerminal && { completedAt: now }),
      },
    });

    return {
      id: row.id,
      bullJobId: row.bullJobId,
      status: row.status as ScrapingJobStatus,
      listingsScraped: row.listingsScraped,
      imagesDownloaded: row.imagesDownloaded,
      errorsEncountered: row.errorsEncountered,
      completedAt: row.completedAt,
    };
  }

  private async logError(message: string, meta?: Record<string, unknown>) {
    console.error(`[ScrapingDatabaseService] ${message}`, meta ?? "");
    try {
      const prisma = getPrisma();
      await prisma.scrapeLog.create({
        data: {
          level: "error",
          source: "database",
          message,
          meta: meta ? JSON.stringify(meta) : null,
        },
      });
    } catch {
      /* non-fatal */
    }
  }
}

/** Singleton for queue workers and scrapers. */
export const scrapingDb = new ScrapingDatabaseService();

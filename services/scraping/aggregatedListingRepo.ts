import { scrapingDb } from "./databaseService";
import type { ScrapedListing } from "./scrapedListing.types";
import type { CreateAggregatedImageInput } from "./persistence.types";

const SCRAPER_USER_ID = "scraper-olx";

export async function writeScrapeLog(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
  source = "olx"
) {
  const line = `[scrape:${source}] ${message}`;
  if (level === "error") console.error(line, meta ?? "");
  else if (level === "warn") console.warn(line, meta ?? "");
  else console.info(line, meta ?? "");

  try {
    const { getPrisma } = await import("@/lib/sell/server/listingRepo");
    const prisma = getPrisma();
    await prisma.scrapeLog.create({
      data: {
        level,
        source,
        message,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    /* logging must not break scrape */
  }
}

export async function saveAggregatedListings(
  listings: ScrapedListing[],
  imageMap: Map<string, { url: string; thumbnailUrl?: string; quality?: number }[]>
): Promise<{ created: number; updated: number }> {
  const imagesByExternalId = new Map<string, CreateAggregatedImageInput[]>();

  for (const [externalId, imgs] of imageMap) {
    imagesByExternalId.set(
      externalId,
      imgs.map((img, order) => ({
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        order,
        quality: img.quality ?? 80,
      }))
    );
  }

  const result = await scrapingDb.persistListingsWithImages(
    listings,
    listings[0]?.sourceWebsite ?? "olx",
    imagesByExternalId
  );

  return { created: result.created, updated: result.updated };
}

export { SCRAPER_USER_ID };

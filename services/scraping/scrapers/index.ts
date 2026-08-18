import type { ScrapeCity, ScrapeJobType, ScrapeVehicleCategory } from "../types";
import type { ScraperContext, ScraperRunResult } from "./index.types";
import { OLXScraper } from "./olx.scraper";
import { BikeDekhoSpecScraper, type BikeSpecTarget } from "./bikedekho.scraper";
import { getFreshlyScrapedModelIds, saveBikeSpecs } from "../bikeSpecRepo";
import { writeScrapeLog } from "../aggregatedListingRepo";

export type { ScraperContext, ScraperRunResult } from "./index.types";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runScraper(
  jobType: ScrapeJobType,
  ctx: ScraperContext
): Promise<ScraperRunResult> {
  switch (jobType) {
    case "olx_scrape":
      return runOlxScraper(ctx);
    case "bikedekho_specs":
      return runBikeSpecScraper(ctx);
    default:
      return runStubScraper(jobType.replace("_scrape", ""), ctx, 50);
  }
}

/** Skip models refreshed within this window so re-runs resume rather than restart. */
const SPEC_REFRESH_DAYS = 7;

/**
 * Full catalog spec pass.
 *
 * Unlike the listing scrapers this is not city-scoped — it walks every
 * two-wheeler model in the catalog index. `listingsScraped` carries the model
 * count so the existing job progress UI stays meaningful.
 */
export async function runBikeSpecScraper(ctx: ScraperContext): Promise<ScraperRunResult> {
  const { getIndiaCatalogIndex } = await import("@/lib/catalog/indiaCatalog");
  const index = await getIndiaCatalogIndex();

  const twoWheelers = index.models.filter(
    (m) => m.category === "bike" || m.category === "scooter"
  );

  const fresh = await getFreshlyScrapedModelIds(SPEC_REFRESH_DAYS);
  const targets: BikeSpecTarget[] = twoWheelers
    .filter((m) => !fresh.has(m.id))
    .map((m) => ({
      modelId: m.id,
      brandSlug: m.brandSlug,
      modelSlug: m.modelSlug,
      modelName: m.modelName,
      sourceUrl: m.sourceUrl,
    }));

  await writeScrapeLog(
    "info",
    "Bike spec job starting",
    { twoWheelers: twoWheelers.length, skippedFresh: fresh.size, toScrape: targets.length },
    "bikedekho"
  );

  if (!targets.length) return { listingsScraped: 0, imagesDownloaded: 0 };

  const scraper = new BikeDekhoSpecScraper({
    onProgress: (p) => ctx.onProgress(p.completed, 0),
  });

  const { results, failures } = await scraper.scrapeMany(targets);
  const saved = await saveBikeSpecs(results);

  await ctx.onProgress(results.length, 0);

  await writeScrapeLog(
    failures.length > results.length ? "warn" : "info",
    "Bike spec job completed",
    {
      scraped: results.length,
      failed: failures.length,
      created: saved.created,
      updated: saved.updated,
      lowCompleteness: saved.lowCompleteness,
    },
    "bikedekho"
  );

  return { listingsScraped: results.length, imagesDownloaded: 0 };
}

async function runOlxScraper(ctx: ScraperContext): Promise<ScraperRunResult> {
  const scraper = new OLXScraper({ category: ctx.category });
  let listingsScraped = 0;
  let imagesDownloaded = 0;

  try {
    await scraper.initialize();
    const limit = ctx.category === "cars" ? 100 : 80;
    const listings = await scraper.scrapeListings(ctx.city, limit);

    listingsScraped = listings.length;
    await ctx.onProgress(Math.floor(listingsScraped / 2), 0);

    const saved = await scraper.saveToDatabase(listings);
    imagesDownloaded = saved.imagesDownloaded;

    await ctx.onProgress(listingsScraped, imagesDownloaded);

    await writeScrapeLog("info", "OLX scrape completed", {
      city: ctx.city,
      category: ctx.category,
      listingsScraped,
      imagesDownloaded,
      created: saved.created,
      updated: saved.updated,
    });

    return { listingsScraped, imagesDownloaded };
  } catch (err) {
    await writeScrapeLog("error", "OLX scrape failed", {
      city: ctx.city,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    await scraper.close();
  }
}

async function runStubScraper(
  source: string,
  ctx: ScraperContext,
  totalListings: number
): Promise<ScraperRunResult> {
  let listingsScraped = 0;
  let imagesDownloaded = 0;

  for (let i = 1; i <= totalListings; i++) {
    await sleep(50);
    listingsScraped += 1;
    imagesDownloaded += 5;
    if (i % 10 === 0) await ctx.onProgress(listingsScraped, imagesDownloaded);
  }

  console.info(`[scraper:${source}] stub ${ctx.category} in ${ctx.city} — ${listingsScraped} listings`);
  return { listingsScraped, imagesDownloaded };
}

export async function saveScrapedListings(
  source: string,
  city: ScrapeCity,
  count: number
): Promise<void> {
  if (source === "olx") return;
  console.info(`[scraper] saveScrapedListings stub — ${count} rows (${source}, ${city})`);
}

export async function downloadListingImages(imageCount: number): Promise<number> {
  return imageCount;
}

export { OLXScraper } from "./olx.scraper";
export { BikeDekhoSpecScraper } from "./bikedekho.scraper";
export type { BikeSpecTarget } from "./bikedekho.scraper";

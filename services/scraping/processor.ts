import type { Job } from "bull";
import Bull from "bull";
import { getScrapeQueue } from "@/lib/queue";
import type { ScrapeJobData, ScrapeJobResult } from "./types";
import { scrapingDb } from "./databaseService";
import { downloadListingImages, runScraper, saveScrapedListings } from "./scrapers";
import { alertJobFailed } from "../monitoring/alerts";

const MAX_CONCURRENT = 3;

let processorStarted = false;

async function handleScrapeJob(job: Job<ScrapeJobData>): Promise<ScrapeJobResult> {
  const started = Date.now();
  const { jobType, city, category, source } = job.data;
  const jobId = String(job.id);

  console.info(`[scrape-processor] START ${job.id} ${jobType} ${city} ${category}`);

  await scrapingDb.updateScrapingJob(jobId, {
    status: "RUNNING",
    jobType,
    source,
    city,
    category,
    listingsScraped: 0,
    imagesDownloaded: 0,
    errorsEncountered: 0,
  });

  try {
    const result = await runScraper(jobType, {
      city,
      category,
      onProgress: async (listingsDone, imagesDone) => {
        const pct = Math.min(99, Math.round((listingsDone / 500) * 100));
        await job.progress({ pct, listingsScraped: listingsDone, imagesDownloaded: imagesDone });
        await scrapingDb.updateScrapingJob(jobId, {
          status: "RUNNING",
          listingsScraped: listingsDone,
          imagesDownloaded: imagesDone,
        });
      },
    });

    await saveScrapedListings(source, city, result.listingsScraped);
    const imagesDownloaded = await downloadListingImages(result.imagesDownloaded);

    await job.progress(100);

    await scrapingDb.updateScrapingJob(jobId, {
      status: "SUCCESS",
      listingsScraped: result.listingsScraped,
      imagesDownloaded,
    });

    const payload: ScrapeJobResult = {
      listingsScraped: result.listingsScraped,
      imagesDownloaded,
      city,
      jobType,
      durationMs: Date.now() - started,
    };

    console.info(`[scrape-processor] DONE ${job.id}`, payload);
    return payload;
  } catch (err) {
    const errorLog = err instanceof Error ? err.stack ?? err.message : String(err);
    await scrapingDb.updateScrapingJob(jobId, {
      status: "FAILED",
      errorsEncountered: 1,
      errorLog,
    });
    await alertJobFailed({
      jobId,
      source,
      city,
      category,
      error: errorLog,
    }).catch((e) => console.error("[scrape-processor] alert failed", e));
    throw err;
  }
}

/** Register Bull processor — call once from the worker process only. */
export function startScrapeProcessor(): void {
  if (processorStarted) {
    console.warn("[scrape-processor] already running");
    return;
  }

  const queue = getScrapeQueue();

  queue.process(MAX_CONCURRENT, handleScrapeJob);

  queue.on("failed", (job: Bull.Job<ScrapeJobData> | undefined, err: Error) => {
    console.error(`[scrape-processor] FAILED ${job?.id}`, err.message);
  });

  queue.on("stalled", (job: Bull.Job<ScrapeJobData>) => {
    console.warn(`[scrape-processor] STALLED ${job.id}`);
  });

  processorStarted = true;
  console.info(`[scrape-processor] listening — concurrency=${MAX_CONCURRENT}`);
}

export async function stopScrapeProcessor(): Promise<void> {
  const queue = getScrapeQueue();
  await queue.close();
  processorStarted = false;
}

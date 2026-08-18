/** Lightweight request logging for vehicle API routes. */
export function logVehicleApi(
  event: string,
  meta: Record<string, string | number | boolean | undefined> = {}
) {
  const payload = {
    ts: new Date().toISOString(),
    scope: "vehicles-api",
    event,
    ...meta,
  };
  console.info(JSON.stringify(payload));
}

/**
 * Enqueue catalog enrichment when a listing is created/updated.
 * Requires REDIS_URL and a running scraping worker (npm run queue:worker).
 */
export async function maybeEnqueueScrapingJob(vehicleId: string, action: "create" | "update") {
  if (!process.env.REDIS_URL) {
    logVehicleApi("scraping_job_skipped", { vehicleId, action, reason: "REDIS_URL not set" });
    return;
  }

  try {
    const { getScrapeQueue } = await import("@/lib/queue");
    const queue = getScrapeQueue();
    await queue.add(
      {
        jobType: "cardekho_scrape",
        city: "delhi",
        category: "cars",
        startTime: new Date().toISOString(),
        source: "enrichment",
        vehicleId,
        action,
      } as import("@services/scraping/types").ScrapeJobData & {
        vehicleId?: string;
        action?: string;
      },
      {
        jobId: `enrich-${vehicleId}-${action}-${Date.now()}`,
        priority: 2,
      }
    );
    logVehicleApi("scraping_job_enqueued", { vehicleId, action });
  } catch (err) {
    logVehicleApi("scraping_job_failed", {
      vehicleId,
      action,
      reason: err instanceof Error ? err.message : "enqueue error",
    });
  }
}

import cron from "node-cron";
import { addJob } from "./queueService";
import type { ScrapeCity, ScrapeJobType, ScrapeVehicleCategory } from "./types";

/** Every 6 hours: 12 AM, 6 AM, 12 PM, 6 PM (server local time — set TZ=Asia/Kolkata). */
export const SCRAPE_CRON_EXPR = "0 */6 * * *";

interface ScheduledJob {
  jobType: ScrapeJobType;
  city: ScrapeCity;
  category: ScrapeVehicleCategory;
  label: string;
}

export const DEFAULT_SCHEDULED_JOBS: ScheduledJob[] = [
  { jobType: "olx_scrape", city: "delhi", category: "cars", label: "OLX Delhi cars" },
  { jobType: "olx_scrape", city: "mumbai", category: "cars", label: "OLX Mumbai cars" },
  { jobType: "olx_scrape", city: "bangalore", category: "bikes", label: "OLX Bangalore bikes" },
  { jobType: "olx_scrape", city: "chennai", category: "bikes", label: "OLX Chennai bikes" },
];

export async function enqueueScheduledJobs(jobs: ScheduledJob[] = DEFAULT_SCHEDULED_JOBS) {
  const results = [];
  for (const spec of jobs) {
    const { jobId } = await addJob({
      jobType: spec.jobType,
      city: spec.city,
      category: spec.category,
    });
    console.info(`[scheduler] enqueued ${spec.label} → ${jobId}`);
    results.push({ ...spec, jobId });
  }
  return results;
}

let cronTask: cron.ScheduledTask | null = null;

/** Start node-cron scheduler — run from worker process only. */
export function startScrapeScheduler(): void {
  if (cronTask) return;

  console.info(`[scheduler] cron "${SCRAPE_CRON_EXPR}" (TZ=${process.env.TZ ?? "system"})`);

  cronTask = cron.schedule(SCRAPE_CRON_EXPR, () => {
    enqueueScheduledJobs().catch((err) => {
      console.error("[scheduler] enqueue failed:", err);
    });
  });
}

export function stopScrapeScheduler(): void {
  cronTask?.stop();
  cronTask = null;
}

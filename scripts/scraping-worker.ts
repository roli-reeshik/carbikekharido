/**
 * Long-running scraping worker — Bull processor + node-cron scheduler.
 *
 * Usage:
 *   REDIS_URL=rediss://... CRON_SECRET=... npm run queue:worker
 *
 * Optional immediate schedule:
 *   npm run queue:worker -- --enqueue-now
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { startScrapeProcessor, stopScrapeProcessor } from "../services/scraping/processor";
import { enqueueScheduledJobs, startScrapeScheduler, stopScrapeScheduler } from "../services/scraping/scheduler";

async function main() {
  if (!process.env.REDIS_URL) {
    console.error("REDIS_URL is required (Upstash: rediss://default:token@host:6379)");
    process.exit(1);
  }

  startScrapeProcessor();
  startScrapeScheduler();

  if (process.argv.includes("--enqueue-now")) {
    const jobs = await enqueueScheduledJobs();
    console.info("[worker] enqueued", jobs.length, "jobs");
  }

  console.info("[worker] scraping worker running — Ctrl+C to stop");

  const shutdown = async () => {
    console.info("[worker] shutting down…");
    stopScrapeScheduler();
    await stopScrapeProcessor();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});

import Bull from "bull";
import type { ScrapeJobData, ScrapeJobResult } from "../../services/scraping/types";

export const SCRAPE_QUEUE_NAME = "carbikekharido-scrape";

const ONE_HOUR_MS = 60 * 60 * 1000;

type ScrapeQueue = Bull.Queue<ScrapeJobData>;

const DEFAULT_JOB_OPTIONS: Bull.JobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  timeout: ONE_HOUR_MS,
  removeOnComplete: 200,
  removeOnFail: 100,
};

function queueOptions(): Bull.QueueOptions {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not configured — set it in .env.local (Upstash rediss://…)");
  }

  return {
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
    createClient: (type) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require("ioredis");
      const client = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        ...(url.startsWith("rediss://") ? { tls: {} } : {}),
      });
      if (type === "bclient" || type === "subscriber") {
        client.options.maxRetriesPerRequest = null;
      }
      return client;
    },
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __scrapeQueue: ScrapeQueue | undefined;
}

/**
 * Singleton Bull queue — max 3 concurrent jobs configured on the processor.
 * Do not call `.process()` from Next.js API routes; use scripts/scraping-worker.ts.
 */
export function getScrapeQueue(): ScrapeQueue {
  if (global.__scrapeQueue) return global.__scrapeQueue;

  const queue = new Bull<ScrapeJobData>(SCRAPE_QUEUE_NAME, queueOptions());
  global.__scrapeQueue = queue;
  return queue;
}

export async function isRedisAvailable(): Promise<boolean> {
  if (!process.env.REDIS_URL) return false;
  try {
    const queue = getScrapeQueue();
    const client = await queue.client;
    const pong = await client.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export type { ScrapeJobData, ScrapeJobResult };

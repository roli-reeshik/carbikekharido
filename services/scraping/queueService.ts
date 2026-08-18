import type { Job } from "bull";
import { getScrapeQueue } from "@/lib/queue";
import type {
  QueueStats,
  ScrapeCity,
  ScrapeJobData,
  ScrapeJobStatus,
  ScrapeJobType,
  ScrapeVehicleCategory,
} from "./types";
import { jobTypeToSource, mapBullState } from "./types";

export interface AddJobInput {
  jobType: ScrapeJobType;
  city: ScrapeCity;
  category: ScrapeVehicleCategory;
}

export async function addJob(input: AddJobInput) {
  const queue = getScrapeQueue();
  const data: ScrapeJobData = {
    jobType: input.jobType,
    city: input.city,
    category: input.category,
    startTime: new Date().toISOString(),
    source: jobTypeToSource(input.jobType),
  };

  const job = await queue.add(data, {
    jobId: `${input.jobType}-${input.city}-${input.category}-${Date.now()}`,
  });

  return { jobId: String(job.id), data };
}

export async function getJobStatus(jobId: string): Promise<ScrapeJobStatus | null> {
  const queue = getScrapeQueue();
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progressRaw = await job.progress();
  const progress =
    typeof progressRaw === "number"
      ? progressRaw
      : typeof progressRaw === "object" && progressRaw && "pct" in progressRaw
        ? Number((progressRaw as { pct: number }).pct)
        : 0;
  const progressMeta =
    typeof progressRaw === "object" && progressRaw && "listingsScraped" in progressRaw
      ? (progressRaw as { listingsScraped?: number; imagesDownloaded?: number })
      : {};
  const result = job.returnvalue as { listingsScraped?: number; imagesDownloaded?: number } | undefined;

  return {
    jobId: String(job.id),
    status: mapBullState(state),
    jobType: job.data.jobType,
    city: job.data.city,
    category: job.data.category,
    startTime: job.data.startTime,
    progress,
    listingsScraped: result?.listingsScraped ?? progressMeta.listingsScraped,
    imagesDownloaded: result?.imagesDownloaded ?? progressMeta.imagesDownloaded,
    error: job.failedReason ?? undefined,
    finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
  };
}

export async function retryJob(jobId: string) {
  const queue = getScrapeQueue();
  const job = await queue.getJob(jobId);
  if (!job) throw new Error("Job not found");

  const state = await job.getState();
  if (state !== "failed") {
    throw new Error(`Only failed jobs can be retried (current: ${state})`);
  }

  await job.retry();
  return { jobId, status: "PENDING" as const };
}

export async function cancelJob(jobId: string) {
  const queue = getScrapeQueue();
  const job = await queue.getJob(jobId);
  if (!job) throw new Error("Job not found");

  const state = await job.getState();

  if (state === "active") {
    await job.discard();
  }

  if (state === "waiting" || state === "delayed" || state === "active") {
    await job.remove();
    return { jobId, status: "CANCELLED" as const };
  }

  throw new Error(`Cannot cancel job in state: ${state}`);
}

function avgProcessingTime(jobs: Job[]): number {
  const finished = jobs.filter((j) => j.finishedOn && j.processedOn);
  if (!finished.length) return 0;
  const total = finished.reduce((sum, j) => sum + ((j.finishedOn ?? 0) - (j.processedOn ?? 0)), 0);
  return Math.round(total / finished.length);
}

export async function getQueueStats(): Promise<QueueStats> {
  const queue = getScrapeQueue();
  const [active, waiting, completed, failed, delayed, completedJobs] = await Promise.all([
    queue.getActiveCount(),
    queue.getWaitingCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getCompleted(0, 50),
  ]);

  return {
    active,
    pending: waiting + delayed,
    completed,
    failed,
    delayed,
    avgTimeMs: avgProcessingTime(completedJobs),
  };
}

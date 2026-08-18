import type { Job } from "bull";
import { getScrapeQueue } from "@/lib/queue";
import { getPrisma } from "@/lib/sell/server/listingRepo";
import type { JobStatus, QueueStats, ScrapeJobStatus } from "./types";
import { getQueueStats, getJobStatus } from "./queueService";
import { mapBullState } from "./types";

export interface DailyMetric {
  date: string;
  successRate: number;
  successCount: number;
  failedCount: number;
  avgProcessingMinutes: number;
  listingsScraped: number;
  imagesDownloaded: number;
}

export interface DashboardJobRow {
  id: string;
  bullJobId: string | null;
  date: string;
  source: string;
  city: string | null;
  category: string | null;
  status: JobStatus;
  listingsScraped: number;
  imagesDownloaded: number;
  errorsEncountered: number;
  durationMs: number | null;
  errorLog: string | null;
  jobType: string;
}

export interface DashboardErrorLog {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  meta: string | null;
  level: string;
}

export interface CurrentJobSnapshot {
  jobId: string;
  source: string;
  city: string;
  category: string;
  progress: number;
  listingsScraped: number;
  imagesDownloaded: number;
  startedAt: string;
  estimatedRemainingMs: number | null;
}

export interface DashboardSnapshot {
  queue: QueueStats & { paused: boolean };
  currentJobs: CurrentJobSnapshot[];
  stats: {
    listingsToday: number;
    imagesDownloadedToday: number;
    storageUsedGb: number;
    successRatePercent: number;
    avgProcessingMinutes: number;
  };
  dailyMetrics: DailyMetric[];
  jobHistory: DashboardJobRow[];
  errorLogs: DashboardErrorLog[];
  fetchedAt: string;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function isQueuePaused(): Promise<boolean> {
  const queue = getScrapeQueue();
  return queue.isPaused();
}

export async function pauseQueue(): Promise<void> {
  const queue = getScrapeQueue();
  await queue.pause();
}

export async function resumeQueue(): Promise<void> {
  const queue = getScrapeQueue();
  await queue.resume();
}

export async function clearQueue(opts?: { includeFailed?: boolean; includeCompleted?: boolean }) {
  const queue = getScrapeQueue();
  await queue.empty();
  if (opts?.includeFailed) {
    await queue.clean(0, "failed");
  }
  if (opts?.includeCompleted) {
    await queue.clean(0, "completed");
  }
  return { cleared: true };
}

async function mapActiveJob(job: Job): Promise<CurrentJobSnapshot | null> {
  const status = await getJobStatus(String(job.id));
  if (!status) return null;

  const elapsed = job.processedOn ? Date.now() - job.processedOn : 0;
  const progress = status.progress || 0;
  let estimatedRemainingMs: number | null = null;
  if (progress > 5 && progress < 100 && elapsed > 0) {
    estimatedRemainingMs = Math.round((elapsed / progress) * (100 - progress));
  }

  return {
    jobId: status.jobId,
    source: job.data.source,
    city: status.city,
    category: status.category,
    progress,
    listingsScraped: status.listingsScraped ?? 0,
    imagesDownloaded: status.imagesDownloaded ?? 0,
    startedAt: status.startTime,
    estimatedRemainingMs,
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const prisma = getPrisma();
  const queue = getScrapeQueue();
  const today = startOfToday();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    queueStats,
    paused,
    activeJobs,
    dbJobs,
    errorLogs,
    listingsToday,
    imagesTodayAgg,
    imageCount,
  ] = await Promise.all([
    getQueueStats(),
    isQueuePaused(),
    queue.getActive(),
    prisma.scrapingJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.scrapeLog.findMany({
      where: { level: { in: ["error", "warn"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.aggregatedListing.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.scrapingJob.aggregate({
      where: { completedAt: { gte: today }, status: "SUCCESS" },
      _sum: { imagesDownloaded: true, listingsScraped: true },
    }),
    prisma.aggregatedImage.count(),
  ]);

  const currentJobs = (
    await Promise.all(activeJobs.map((j) => mapActiveJob(j)))
  ).filter((j): j is CurrentJobSnapshot => j !== null);

  const weekJobs = await prisma.scrapingJob.findMany({
    where: {
      OR: [{ completedAt: { gte: sevenDaysAgo } }, { createdAt: { gte: sevenDaysAgo } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const dailyMap = new Map<string, DailyMetric>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    dailyMap.set(key, {
      date: key,
      successRate: 0,
      successCount: 0,
      failedCount: 0,
      avgProcessingMinutes: 0,
      listingsScraped: 0,
      imagesDownloaded: 0,
    });
  }

  const durationByDay = new Map<string, number[]>();

  for (const job of weekJobs) {
    const key = dayKey(job.completedAt ?? job.createdAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;

    if (job.status === "SUCCESS") {
      bucket.successCount++;
      bucket.listingsScraped += job.listingsScraped;
      bucket.imagesDownloaded += job.imagesDownloaded;
      if (job.startedAt && job.completedAt) {
        const ms = job.completedAt.getTime() - job.startedAt.getTime();
        const arr = durationByDay.get(key) ?? [];
        arr.push(ms);
        durationByDay.set(key, arr);
      }
    } else if (job.status === "FAILED") {
      bucket.failedCount++;
    }
  }

  for (const [key, bucket] of dailyMap) {
    const total = bucket.successCount + bucket.failedCount;
    bucket.successRate = total > 0 ? Math.round((bucket.successCount / total) * 100) : 0;
    const durations = durationByDay.get(key) ?? [];
    bucket.avgProcessingMinutes =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000)
        : 0;
  }

  const jobHistory: DashboardJobRow[] = dbJobs.slice(0, 20).map((job) => ({
    id: job.id,
    bullJobId: job.bullJobId,
    date: (job.completedAt ?? job.createdAt).toISOString(),
    source: job.source,
    city: job.city,
    category: job.category,
    status: job.status as JobStatus,
    listingsScraped: job.listingsScraped,
    imagesDownloaded: job.imagesDownloaded,
    errorsEncountered: job.errorsEncountered,
    durationMs:
      job.startedAt && job.completedAt
        ? job.completedAt.getTime() - job.startedAt.getTime()
        : null,
    errorLog: job.errorLog,
    jobType: job.jobType,
  }));

  const successTotal = weekJobs.filter((j) => j.status === "SUCCESS").length;
  const failedTotal = weekJobs.filter((j) => j.status === "FAILED").length;
  const successRatePercent =
    successTotal + failedTotal > 0
      ? Math.round((successTotal / (successTotal + failedTotal)) * 100)
      : 100;

  const completedDurations = weekJobs
    .filter((j) => j.status === "SUCCESS" && j.startedAt && j.completedAt)
    .map((j) => j.completedAt!.getTime() - j.startedAt!.getTime());

  const avgProcessingMinutes =
    completedDurations.length > 0
      ? Math.round(
          completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length / 60000
        )
      : Math.round(queueStats.avgTimeMs / 60000);

  // ~150 KB per cached image (WebP full + thumb average)
  const storageUsedGb = Math.round(((imageCount * 150) / 1024 / 1024) * 100) / 100;

  return {
    queue: { ...queueStats, paused },
    currentJobs,
    stats: {
      listingsToday: Math.max(listingsToday, imagesTodayAgg._sum.listingsScraped ?? 0),
      imagesDownloadedToday: imagesTodayAgg._sum.imagesDownloaded ?? 0,
      storageUsedGb,
      successRatePercent,
      avgProcessingMinutes,
    },
    dailyMetrics: [...dailyMap.values()],
    jobHistory,
    errorLogs: errorLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      source: log.source,
      message: log.message,
      meta: log.meta,
      level: log.level,
    })),
    fetchedAt: new Date().toISOString(),
  };
}

export async function listBullJobsForHistory(limit = 20) {
  const queue = getScrapeQueue();
  const [completed, failed, active] = await Promise.all([
    queue.getCompleted(0, limit),
    queue.getFailed(0, limit),
    queue.getActive(),
  ]);

  const all = [...active, ...completed, ...failed];
  const rows: DashboardJobRow[] = [];

  for (const job of all.slice(0, limit)) {
    const state = await job.getState();
    rows.push({
      id: String(job.id),
      bullJobId: String(job.id),
      date: new Date(job.timestamp).toISOString(),
      source: job.data.source,
      city: job.data.city,
      category: job.data.category,
      status: mapBullState(state),
      listingsScraped: (job.returnvalue as { listingsScraped?: number })?.listingsScraped ?? 0,
      imagesDownloaded: (job.returnvalue as { imagesDownloaded?: number })?.imagesDownloaded ?? 0,
      errorsEncountered: state === "failed" ? 1 : 0,
      durationMs:
        job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null,
      errorLog: job.failedReason ?? null,
      jobType: job.data.jobType,
    });
  }

  return rows;
}

export async function exportScrapeLogs(limit = 500): Promise<DashboardErrorLog[]> {
  const prisma = getPrisma();
  const logs = await prisma.scrapeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    source: log.source,
    message: log.message,
    meta: log.meta,
    level: log.level,
  }));
}

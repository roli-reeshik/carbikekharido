import { getScrapeQueue } from "@/lib/queue";
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { getQueueStats } from "@services/scraping/queueService";
import type { MonitoringMetrics } from "./types";
import { ALERT_THRESHOLDS } from "./types";

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function collectMonitoringMetrics(): Promise<MonitoringMetrics> {
  const prisma = getPrisma();
  const today = startOfDay();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const storageQuotaGb = Number(process.env.STORAGE_QUOTA_GB ?? ALERT_THRESHOLDS.defaultStorageQuotaGb);

  const [queueStats, imageCount, listingsToday, jobs24h, activeJobs, imagesToday] = await Promise.all([
    getQueueStats(),
    prisma.aggregatedImage.count(),
    prisma.aggregatedListing.count({ where: { createdAt: { gte: today } } }),
    prisma.scrapingJob.findMany({
      where: { createdAt: { gte: dayAgo } },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
        listingsScraped: true,
        imagesDownloaded: true,
        errorsEncountered: true,
      },
    }),
    getScrapeQueue().getActive(),
    prisma.scrapingJob.aggregate({
      where: { completedAt: { gte: today }, status: "SUCCESS" },
      _sum: { imagesDownloaded: true },
    }),
  ]);

  const successCount = jobs24h.filter((j) => j.status === "SUCCESS").length;
  const failedCount = jobs24h.filter((j) => j.status === "FAILED").length;
  const finishedCount = successCount + failedCount;
  const successRatePercent =
    finishedCount > 0 ? Math.round((successCount / finishedCount) * 100) : 100;
  const errorRatePercent = finishedCount > 0 ? Math.round((failedCount / finishedCount) * 100) : 0;
  const errorCount24h = jobs24h.reduce((n, j) => n + j.errorsEncountered, 0);

  const durations = jobs24h
    .filter((j) => j.status === "SUCCESS" && j.startedAt && j.completedAt)
    .map((j) => j.completedAt!.getTime() - j.startedAt!.getTime());

  const avgProcessingMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000)
      : Math.round(queueStats.avgTimeMs / 60000);

  let slowJobDurationMs: number | null = null;
  for (const job of activeJobs) {
    if (job.processedOn) {
      const elapsed = Date.now() - job.processedOn;
      if (elapsed > (slowJobDurationMs ?? 0)) slowJobDurationMs = elapsed;
    }
  }

  const storageUsedGb = Math.round(((imageCount * 150) / 1024 / 1024) * 100) / 100;
  const storagePercent =
    storageQuotaGb > 0 ? Math.round((storageUsedGb / storageQuotaGb) * 100) : 0;

  // Rough cost: Supabase storage ~$0.021/GB/mo prorated daily + $0.02 per scrape job
  const storageCostDaily = (storageUsedGb * 0.021) / 30;
  const computeCost = finishedCount * 0.02;
  const estimatedCostUsd = Math.round((storageCostDaily + computeCost) * 100) / 100;

  return {
    queue: {
      pending: queueStats.pending,
      active: queueStats.active,
      completed: queueStats.completed,
      failed: queueStats.failed,
    },
    successRatePercent,
    errorRatePercent,
    errorCount24h,
    avgProcessingMinutes,
    slowJobDurationMs,
    storageUsedGb,
    storageQuotaGb,
    storagePercent,
    listingsToday,
    imagesDownloadedToday: imagesToday._sum.imagesDownloaded ?? 0,
    estimatedCostUsd,
    collectedAt: new Date().toISOString(),
  };
}

export async function getRecentInAppAlerts(limit = 20, unacknowledgedOnly = false) {
  const prisma = getPrisma();
  return prisma.monitoringAlert.findMany({
    where: unacknowledgedOnly ? { acknowledged: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function acknowledgeAlert(alertId: string) {
  const prisma = getPrisma();
  return prisma.monitoringAlert.update({
    where: { id: alertId },
    data: { acknowledged: true, acknowledgedAt: new Date() },
  });
}

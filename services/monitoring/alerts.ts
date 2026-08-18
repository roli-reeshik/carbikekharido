/**
 * Scraping monitoring alerts — email (Resend), Slack webhooks, in-app + DB log.
 */
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { sendEmail } from "@/lib/wishlist/email";
import { alertEmailHtml, slackAlertBlocks } from "./emailTemplates";
import { collectMonitoringMetrics } from "./metrics";
import type {
  AlertDetails,
  AlertPayload,
  AlertSeverity,
  AlertType,
  InAppAlert,
  MonitoringMetrics,
} from "./types";
import { ALERT_THRESHOLDS } from "./types";

const recentAlerts = new Map<string, number>();

function cooldownKey(type: AlertType, suffix = ""): string {
  return `${type}${suffix}`;
}

function isOnCooldown(type: AlertType, suffix = ""): boolean {
  const key = cooldownKey(type, suffix);
  const last = recentAlerts.get(key);
  if (!last) return false;
  return Date.now() - last < ALERT_THRESHOLDS.cooldownMinutes * 60 * 1000;
}

function markCooldown(type: AlertType, suffix = "") {
  recentAlerts.set(cooldownKey(type, suffix), Date.now());
}

export async function sendAlertEmail(
  subject: string,
  message: string,
  html?: string
): Promise<{ sent: boolean; error?: string }> {
  const to = process.env.ALERT_EMAIL_TO ?? process.env.ADMIN_EMAIL;
  if (!to) {
    console.info(`[monitoring:email] ${subject} — ${message}`);
    return { sent: false, error: "ALERT_EMAIL_TO not configured" };
  }

  const result = await sendEmail(to, subject, html ?? `<p>${message}</p>`);
  return { sent: result.sent, error: result.error };
}

export async function sendSlackAlert(message: string, payload?: AlertPayload): Promise<{ sent: boolean; error?: string }> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    if (process.env.SLACK_ALERTS_ENABLED === "true") {
      console.warn("[monitoring:slack] SLACK_WEBHOOK_URL not configured");
    }
    return { sent: false, error: "SLACK_WEBHOOK_URL not configured" };
  }

  try {
    const body = payload ? slackAlertBlocks(payload) : { text: message };
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return { sent: false, error: err };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Slack send failed" };
  }
}

export async function sendInAppAlert(
  message: string,
  type: AlertType | string,
  details?: AlertDetails,
  severity: AlertSeverity = "warning"
): Promise<InAppAlert> {
  const row = await logAlert(type, { message, severity, ...details });

  return {
    id: row.id,
    type,
    severity,
    message,
    details: details ?? null,
    acknowledged: false,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function logAlert(
  type: AlertType | string,
  details: AlertDetails & { message?: string; severity?: AlertSeverity; channels?: string[] }
) {
  const prisma = getPrisma();
  const message = details.message ?? `Alert: ${type}`;
  const severity = details.severity ?? "warning";

  const { message: _m, severity: _s, channels, ...rest } = details;

  return prisma.monitoringAlert.create({
    data: {
      type,
      severity,
      message: message.slice(0, 500),
      details: Object.keys(rest).length ? JSON.stringify(rest) : null,
      channels: channels?.join(",") ?? null,
    },
  });
}

/** Dispatch alert to all configured channels. */
export async function dispatchAlert(payload: AlertPayload, cooldownSuffix = ""): Promise<void> {
  if (isOnCooldown(payload.type, cooldownSuffix)) {
    console.info(`[monitoring] skipped (cooldown): ${payload.type}`);
    return;
  }

  markCooldown(payload.type, cooldownSuffix);

  const html = alertEmailHtml(payload);
  const channels: string[] = [];

  const [emailResult, slackResult] = await Promise.all([
    sendAlertEmail(payload.subject, payload.message, html),
    sendSlackAlert(payload.message, payload),
  ]);

  if (emailResult.sent) channels.push("email");
  if (slackResult.sent) channels.push("slack");
  channels.push("in_app");

  await logAlert(payload.type, {
    message: payload.message,
    severity: payload.severity,
    channels,
    ...payload.details,
  });

  console.warn(`[monitoring:alert] ${payload.type} — ${payload.subject}`, payload.details ?? {});
}

export async function alertJobFailed(opts: {
  jobId: string;
  source: string;
  city: string;
  category: string;
  error: string;
}) {
  await dispatchAlert(
    {
      type: "job_failed",
      severity: "critical",
      subject: `Scrape job failed: ${opts.source} ${opts.city}`,
      message: `Job ${opts.jobId} failed while scraping ${opts.source} (${opts.city}, ${opts.category}).`,
      details: opts,
    },
    opts.jobId
  );
}

export async function evaluateMetricsAlerts(metrics?: MonitoringMetrics): Promise<AlertPayload[]> {
  const m = metrics ?? (await collectMonitoringMetrics());
  const fired: AlertPayload[] = [];

  if (m.queue.pending > ALERT_THRESHOLDS.pendingQueue) {
    const payload: AlertPayload = {
      type: "queue_backed_up",
      severity: "warning",
      subject: `Scrape queue backed up (${m.queue.pending} pending)`,
      message: `${m.queue.pending} jobs are waiting in the scrape queue (threshold: ${ALERT_THRESHOLDS.pendingQueue}).`,
      details: { pendingCount: m.queue.pending },
    };
    fired.push(payload);
    await dispatchAlert(payload);
  }

  if (m.slowJobDurationMs && m.slowJobDurationMs > ALERT_THRESHOLDS.maxProcessingMs) {
    const minutes = Math.round(m.slowJobDurationMs / 60000);
    const payload: AlertPayload = {
      type: "slow_processing",
      severity: "warning",
      subject: `Scrape job running over ${minutes} minutes`,
      message: `An active scrape job has been processing for ${minutes} minutes (limit: ${ALERT_THRESHOLDS.maxProcessingMs / 60000} min).`,
      details: { durationMs: m.slowJobDurationMs },
    };
    fired.push(payload);
    await dispatchAlert(payload);
  }

  if (m.errorRatePercent > ALERT_THRESHOLDS.errorRatePercent) {
    const payload: AlertPayload = {
      type: "high_error_rate",
      severity: "critical",
      subject: `High scrape error rate (${m.errorRatePercent}%)`,
      message: `Error rate is ${m.errorRatePercent}% in the last 24h (threshold: ${ALERT_THRESHOLDS.errorRatePercent}%).`,
      details: {
        errorRatePercent: m.errorRatePercent,
        errorCount: m.errorCount24h,
        successRatePercent: m.successRatePercent,
      },
    };
    fired.push(payload);
    await dispatchAlert(payload, "24h");
  }

  if (m.storagePercent >= ALERT_THRESHOLDS.storageQuotaPercent) {
    const payload: AlertPayload = {
      type: "storage_quota",
      severity: m.storagePercent >= 95 ? "critical" : "warning",
      subject: `Storage ${m.storagePercent}% full (${m.storageUsedGb} GB)`,
      message: `Scraped image storage is at ${m.storagePercent}% of ${m.storageQuotaGb} GB quota.`,
      details: {
        storageUsedGb: m.storageUsedGb,
        storageQuotaGb: m.storageQuotaGb,
        storagePercent: m.storagePercent,
        estimatedCostUsd: m.estimatedCostUsd,
      },
    };
    fired.push(payload);
    await dispatchAlert(payload, "storage");
  }

  return fired;
}

export async function runMonitoringChecks(): Promise<{
  metrics: MonitoringMetrics;
  alertsFired: number;
}> {
  const metrics = await collectMonitoringMetrics();
  const fired = await evaluateMetricsAlerts(metrics);
  return { metrics, alertsFired: fired.length };
}

export { collectMonitoringMetrics, getRecentInAppAlerts, acknowledgeAlert } from "./metrics";

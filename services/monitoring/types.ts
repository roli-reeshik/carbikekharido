export type AlertType =
  | "job_failed"
  | "queue_backed_up"
  | "slow_processing"
  | "high_error_rate"
  | "storage_quota";

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertDetails {
  jobId?: string;
  source?: string;
  city?: string;
  category?: string;
  error?: string;
  pendingCount?: number;
  durationMs?: number;
  errorRatePercent?: number;
  storageUsedGb?: number;
  storageQuotaGb?: number;
  storagePercent?: number;
  successRatePercent?: number;
  avgProcessingMinutes?: number;
  errorCount?: number;
  estimatedCostUsd?: number;
  [key: string]: unknown;
}

export interface AlertPayload {
  type: AlertType;
  severity: AlertSeverity;
  subject: string;
  message: string;
  details?: AlertDetails;
}

export interface MonitoringMetrics {
  queue: {
    pending: number;
    active: number;
    completed: number;
    failed: number;
  };
  successRatePercent: number;
  errorRatePercent: number;
  errorCount24h: number;
  avgProcessingMinutes: number;
  slowJobDurationMs: number | null;
  storageUsedGb: number;
  storageQuotaGb: number;
  storagePercent: number;
  listingsToday: number;
  imagesDownloadedToday: number;
  estimatedCostUsd: number;
  collectedAt: string;
}

export interface InAppAlert {
  id: string;
  type: AlertType | string;
  severity: AlertSeverity;
  message: string;
  details: AlertDetails | null;
  acknowledged: boolean;
  createdAt: string;
}

export const ALERT_THRESHOLDS = {
  pendingQueue: 5,
  maxProcessingMs: 120 * 60 * 1000,
  errorRatePercent: 10,
  storageQuotaPercent: 80,
  defaultStorageQuotaGb: 10,
  cooldownMinutes: 30,
} as const;

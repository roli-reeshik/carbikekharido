export type {
  DashboardSnapshot,
  DashboardJobRow,
  DashboardErrorLog,
  CurrentJobSnapshot,
  DailyMetric,
} from "@services/scraping/dashboardService";

import type { MonitoringMetrics } from "@services/monitoring/types";

export interface DashboardAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ExtendedDashboardSnapshot {
  queue: import("@services/scraping/dashboardService").DashboardSnapshot["queue"];
  currentJobs: import("@services/scraping/dashboardService").CurrentJobSnapshot[];
  stats: import("@services/scraping/dashboardService").DashboardSnapshot["stats"];
  dailyMetrics: import("@services/scraping/dashboardService").DailyMetric[];
  jobHistory: import("@services/scraping/dashboardService").DashboardJobRow[];
  errorLogs: import("@services/scraping/dashboardService").DashboardErrorLog[];
  fetchedAt: string;
  monitoring?: MonitoringMetrics | null;
  alerts?: DashboardAlert[];
}

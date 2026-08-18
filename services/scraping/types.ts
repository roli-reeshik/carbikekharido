/** Scraping job types for the Bull queue. */

export type ScrapeJobType =
  | "olx_scrape"
  | "cars24_scrape"
  | "cardekho_scrape"
  | "spinny_scrape"
  /** Structured two-wheeler specs from BikeDekho — catalog-wide, not city-scoped. */
  | "bikedekho_specs";

export type ScrapeCity = "delhi" | "mumbai" | "bangalore" | "chennai" | "hyderabad" | "pune";

export type ScrapeVehicleCategory = "cars" | "bikes";

export type JobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface ScrapeJobData {
  jobType: ScrapeJobType;
  city: ScrapeCity;
  category: ScrapeVehicleCategory;
  startTime: string;
  source: string;
}

export interface ScrapeJobResult {
  listingsScraped: number;
  imagesDownloaded: number;
  city: ScrapeCity;
  jobType: ScrapeJobType;
  durationMs: number;
}

export interface ScrapeJobStatus {
  jobId: string;
  status: JobStatus;
  jobType: ScrapeJobType;
  city: ScrapeCity;
  category: ScrapeVehicleCategory;
  startTime: string;
  progress: number;
  listingsScraped?: number;
  imagesDownloaded?: number;
  error?: string;
  finishedAt?: string;
}

export interface QueueStats {
  active: number;
  pending: number;
  completed: number;
  failed: number;
  delayed: number;
  avgTimeMs: number;
}

export function jobTypeToSource(jobType: ScrapeJobType): string {
  return jobType.replace(/_(scrape|specs)$/, "");
}

export function mapBullState(state: string): JobStatus {
  switch (state) {
    case "waiting":
    case "delayed":
      return "PENDING";
    case "active":
      return "RUNNING";
    case "completed":
      return "SUCCESS";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}

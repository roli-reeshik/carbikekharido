import type { ScrapedListing } from "./scrapedListing.types";

/** Result of downloading and uploading a single scraped image. */
export interface DownloadedImage {
  publicUrl: string;
  thumbnailUrl: string;
  order: number;
  quality: number;
  sourceUrl: string;
}

export interface DownloadProgress {
  completed: number;
  total: number;
  failed: number;
  currentUrl?: string;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

export interface ImageDownloaderOptions {
  source?: string;
  maxConcurrent?: number;
  maxRetries?: number;
  quality?: number;
  onProgress?: DownloadProgressCallback;
}

export interface UpsertListingsResult {
  created: number;
  updated: number;
  errors: number;
  /** Maps external listing id → internal DB id */
  listingIds: Map<string, string>;
}

export interface CreateAggregatedImageInput {
  url: string;
  thumbnailUrl?: string;
  order: number;
  quality?: number;
}

export type ScrapingJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface ScrapingJobStats {
  listingsScraped?: number;
  imagesDownloaded?: number;
  errorsEncountered?: number;
}

export interface UpdateScrapingJobInput extends ScrapingJobStats {
  status?: ScrapingJobStatus;
  errorLog?: string;
  jobType?: string;
  source?: string;
  city?: string;
  category?: string;
}

export interface ScrapingJobRecord {
  id: string;
  bullJobId: string | null;
  status: ScrapingJobStatus;
  listingsScraped: number;
  imagesDownloaded: number;
  errorsEncountered: number;
  completedAt: Date | null;
}

export interface PersistListingsBatchInput {
  listings: ScrapedListing[];
  scraper: string;
  imagesByExternalId: Map<string, CreateAggregatedImageInput[]>;
}

export { ScrapedListing };

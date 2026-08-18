import type { ScrapeCity, ScrapeVehicleCategory } from "../types";

export interface ScraperContext {
  city: ScrapeCity;
  category: ScrapeVehicleCategory;
  onProgress: (listingsDone: number, imagesDone: number) => Promise<void>;
}

export interface ScraperRunResult {
  listingsScraped: number;
  imagesDownloaded: number;
}

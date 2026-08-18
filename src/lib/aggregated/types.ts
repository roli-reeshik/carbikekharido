export type AggregatedSource = "olx" | "cars24" | "spinny" | "cardekho";

export type AggregatedCategory = "cars" | "bikes";

export type AggregatedSortOption = "newest" | "popular" | "price_asc" | "price_desc" | "relevance";

export type ListingOrigin = "marketplace" | "aggregated";

export interface AggregatedImageSummary {
  url: string;
  thumbnailUrl: string | null;
  order: number;
  quality: number | null;
}

export interface AggregatedListingSummary {
  id: string;
  sourceWebsite: AggregatedSource | string;
  sourceLabel: string;
  title: string;
  priceInr: number;
  location: string | null;
  mileage: string | null;
  condition: string | null;
  sellerName: string | null;
  listingUrl: string;
  city: string;
  category: AggregatedCategory | string;
  viewCount: number;
  lastScrapedAt: string;
  lastUpdatedLabel: string;
  imageCount: number;
  thumbnail: string | null;
  images: AggregatedImageSummary[];
}

export interface AggregatedListingDetail extends AggregatedListingSummary {
  externalId: string;
  expiresAt: string;
  createdAt: string;
  marketComparison?: MarketComparison | null;
}

export interface MarketComparison {
  marketAveragePrice: number;
  delta: number;
  deltaPercent: number;
  sampleSize: number;
}

export interface UnifiedListingItem {
  origin: ListingOrigin;
  id: string;
  title: string;
  priceInr: number;
  city: string;
  category: string;
  thumbnail: string | null;
  imageCount: number;
  viewCount: number;
  updatedAt: string;
  lastUpdatedLabel?: string;
  sourceWebsite?: string;
  sourceLabel?: string;
  listingUrl?: string;
  sellerName?: string | null;
  mileage?: string | null;
  condition?: string | null;
  href: string;
  external?: boolean;
  marketplace?: import("@/lib/buy/types").MarketplaceListingSummary;
  aggregated?: AggregatedListingSummary;
  marketComparison?: MarketComparison | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  from: number;
  to: number;
}

export interface AggregatedSearchApiResponse {
  items: AggregatedListingSummary[];
  meta: PaginatedMeta;
}

export interface UnifiedSearchApiResponse {
  items: UnifiedListingItem[];
  meta: PaginatedMeta & {
    marketplaceTotal: number;
    aggregatedTotal: number;
    merged: boolean;
  };
}

export interface AggregatedSearchFilters {
  city: string;
  priceMin: number;
  priceMax: number;
  sources: AggregatedSource[];
  types: ("CAR" | "BIKE")[];
  sort: AggregatedSortOption;
  page: number;
  q: string;
  condition: string[];
  /** When true, only show scraped listings */
  aggregatedOnly: boolean;
  /** When true, merge marketplace + aggregated results */
  merge: boolean;
  fuel: string[];
  transmission: string[];
  yearMin: number;
  yearMax: number;
  mileageMin: number;
  mileageMax: number;
  bodyType: string[];
  ownerType: string[];
  sellerType: string[];
}

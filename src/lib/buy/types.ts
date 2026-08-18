export type VehicleTypeFilter = "CAR" | "BIKE";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "newest" | "popular" | "mileage";

export type ViewMode = "grid" | "list";

export interface BuySearchFilters {
  types: VehicleTypeFilter[];
  priceMin: number;
  priceMax: number;
  city: string;
  fuel: string[];
  transmission: string[];
  yearMin: number;
  yearMax: number;
  mileageMin: number;
  mileageMax: number;
  bodyType: string[];
  ownerType: string[];
  condition: string[];
  sellerType: string[];
  q: string;
  sort: SortOption;
  page: number;
  recent?: boolean;
}

export interface MarketplaceListingSummary {
  listingId: string;
  vehicleType: VehicleTypeFilter;
  brand: string;
  model: string;
  yearOfManufacture: number;
  askingPrice: string;
  city: string;
  state: string;
  fuelType: string | null;
  transmission: string | null;
  currentMileage: number | null;
  ownerType: string | null;
  condition: string | null;
  bodyType: string | null;
  viewCount: number;
  publishedAt: string | null;
  imageCount: number;
  thumbnail: string | null;
  verified: boolean;
  sellerType: "INDIVIDUAL" | "DEALER";
  rating: number;
  reviewCount: number;
}

export interface SearchApiResponse {
  items: MarketplaceListingSummary[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    from: number;
    to: number;
  };
}

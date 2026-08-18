export type CatalogCategory = "car" | "ev" | "bike" | "scooter";

export interface CatalogBrand {
  slug: string;
  name: string;
  category: "car" | "bike";
  logoUrl?: string;
}

export interface CatalogModel {
  id: string;
  category: CatalogCategory;
  brandSlug: string;
  brandName: string;
  modelSlug: string;
  modelName: string;
  source: "cardekho" | "bikedekho";
  sourceUrl: string;
  fuelTypes: string[];
  bodyType?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CatalogVariant {
  id: string;
  modelId: string;
  variantSlug: string;
  variantName: string;
  fuelType?: string;
  priceOnRoad?: number;
  exShowroomPrice?: number;
  mileage?: string;
  specs?: string;
}

export interface CatalogIndex {
  builtAt: string;
  brands: CatalogBrand[];
  models: CatalogModel[];
}

export interface CatalogSearchFilters {
  query?: string;
  category?: CatalogCategory | "all";
  brandSlug?: string;
  bodyType?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

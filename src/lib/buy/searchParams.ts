import {
  MILEAGE_MAX,
  MILEAGE_MIN,
  PRICE_MAX,
  PRICE_MIN,
  YEAR_MAX,
  YEAR_MIN,
} from "./constants";
import { BuySearchFilters, SortOption, VehicleTypeFilter } from "./types";

export const DEFAULT_FILTERS: BuySearchFilters = {
  types: ["CAR", "BIKE"],
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  city: "",
  fuel: [],
  transmission: [],
  yearMin: YEAR_MIN,
  yearMax: YEAR_MAX,
  mileageMin: MILEAGE_MIN,
  mileageMax: MILEAGE_MAX,
  bodyType: [],
  ownerType: [],
  condition: [],
  sellerType: [],
  q: "",
  sort: "relevance",
  page: 1,
};

function parseCsv(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(param: string | null, fallback: number): number {
  if (!param) return fallback;
  const n = Number(param);
  return Number.isFinite(n) ? n : fallback;
}

export function filtersFromSearchParams(params: URLSearchParams): BuySearchFilters {
  const typeParam = params.get("type");
  const types: VehicleTypeFilter[] = typeParam
    ? (parseCsv(typeParam).filter((t) => t === "CAR" || t === "BIKE") as VehicleTypeFilter[])
    : DEFAULT_FILTERS.types;

  const sortParam = params.get("sort") as SortOption | null;
  const validSorts: SortOption[] = [
    "relevance",
    "price_asc",
    "price_desc",
    "newest",
    "popular",
    "mileage",
  ];
  const sort = sortParam && validSorts.includes(sortParam) ? sortParam : DEFAULT_FILTERS.sort;

  return {
    types: types.length ? types : DEFAULT_FILTERS.types,
    priceMin: num(params.get("priceMin"), PRICE_MIN),
    priceMax: num(params.get("priceMax"), PRICE_MAX),
    city: params.get("city") ?? "",
    fuel: parseCsv(params.get("fuel")),
    transmission: parseCsv(params.get("transmission")),
    yearMin: num(params.get("yearMin"), YEAR_MIN),
    yearMax: num(params.get("yearMax"), YEAR_MAX),
    mileageMin: num(params.get("mileageMin"), MILEAGE_MIN),
    mileageMax: num(params.get("mileageMax"), MILEAGE_MAX),
    bodyType: parseCsv(params.get("bodyType")),
    ownerType: parseCsv(params.get("ownerType")),
    condition: parseCsv(params.get("condition")),
    sellerType: parseCsv(params.get("sellerType")),
    q: params.get("q") ?? "",
    sort,
    page: Math.max(1, num(params.get("page"), 1)),
    recent: params.get("recent") === "true",
  };
}

export function filtersToSearchParams(filters: BuySearchFilters): URLSearchParams {
  const p = new URLSearchParams();

  if (filters.types.length === 1) p.set("type", filters.types[0]);
  else if (filters.types.length === 2) {
    /* both selected — omit type param */
  } else if (filters.types.length) {
    p.set("type", filters.types.join(","));
  }

  if (filters.priceMin > PRICE_MIN) p.set("priceMin", String(filters.priceMin));
  if (filters.priceMax < PRICE_MAX) p.set("priceMax", String(filters.priceMax));
  if (filters.city) p.set("city", filters.city);
  if (filters.fuel.length) p.set("fuel", filters.fuel.join(","));
  if (filters.transmission.length) p.set("transmission", filters.transmission.join(","));
  if (filters.yearMin > YEAR_MIN) p.set("yearMin", String(filters.yearMin));
  if (filters.yearMax < YEAR_MAX) p.set("yearMax", String(filters.yearMax));
  if (filters.mileageMin > MILEAGE_MIN) p.set("mileageMin", String(filters.mileageMin));
  if (filters.mileageMax < MILEAGE_MAX) p.set("mileageMax", String(filters.mileageMax));
  if (filters.bodyType.length) p.set("bodyType", filters.bodyType.join(","));
  if (filters.ownerType.length) p.set("ownerType", filters.ownerType.join(","));
  if (filters.condition.length) p.set("condition", filters.condition.join(","));
  if (filters.sellerType.length) p.set("sellerType", filters.sellerType.join(","));
  if (filters.q.trim()) p.set("q", filters.q.trim());
  if (filters.sort !== "relevance") p.set("sort", filters.sort);
  if (filters.page > 1) p.set("page", String(filters.page));
  if (filters.recent) p.set("recent", "true");

  return p;
}

export function countActiveFilters(filters: BuySearchFilters): number {
  let n = 0;
  if (filters.types.length === 1) n++;
  if (filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) n++;
  if (filters.city) n++;
  if (filters.fuel.length) n++;
  if (filters.transmission.length) n++;
  if (filters.yearMin > YEAR_MIN || filters.yearMax < YEAR_MAX) n++;
  if (filters.mileageMin > MILEAGE_MIN || filters.mileageMax < MILEAGE_MAX) n++;
  if (filters.bodyType.length) n++;
  if (filters.ownerType.length) n++;
  if (filters.condition.length) n++;
  if (filters.sellerType.length) n++;
  if (filters.q.trim()) n++;
  if (filters.recent) n++;
  return n;
}

export function buildSearchApiUrl(filters: BuySearchFilters, extra?: Record<string, string>): string {
  const p = filtersToSearchParams(filters);
  p.set("pageSize", "20");
  if (extra) {
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
  }
  return `/api/vehicles/search?${p.toString()}`;
}

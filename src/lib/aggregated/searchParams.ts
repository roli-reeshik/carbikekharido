import {
  MILEAGE_MAX,
  MILEAGE_MIN,
  PRICE_MAX,
  PRICE_MIN,
  YEAR_MAX,
  YEAR_MIN,
} from "@/lib/buy/constants";
import type { AggregatedSearchFilters, AggregatedSortOption } from "./types";
import type { AggregatedSource } from "./types";

export const DEFAULT_AGGREGATED_FILTERS: AggregatedSearchFilters = {
  city: "",
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  sources: [],
  types: ["CAR", "BIKE"],
  sort: "newest",
  page: 1,
  q: "",
  condition: [],
  aggregatedOnly: false,
  merge: true,
  fuel: [],
  transmission: [],
  yearMin: YEAR_MIN,
  yearMax: YEAR_MAX,
  mileageMin: MILEAGE_MIN,
  mileageMax: MILEAGE_MAX,
  bodyType: [],
  ownerType: [],
  sellerType: [],
};

function parseCsv(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

function num(param: string | null, fallback: number): number {
  if (!param) return fallback;
  const n = Number(param);
  return Number.isFinite(n) ? n : fallback;
}

export function filtersFromSearchParams(params: URLSearchParams): AggregatedSearchFilters {
  const typeParam = params.get("type");
  const types = typeParam
    ? (parseCsv(typeParam).filter((t) => t === "CAR" || t === "BIKE") as ("CAR" | "BIKE")[])
    : DEFAULT_AGGREGATED_FILTERS.types;

  const sortParam = params.get("sort") as AggregatedSortOption | null;
  const validSorts: AggregatedSortOption[] = ["newest", "popular", "price_asc", "price_desc", "relevance"];
  const sort = sortParam && validSorts.includes(sortParam) ? sortParam : DEFAULT_AGGREGATED_FILTERS.sort;

  const sources = parseCsv(params.get("source")).filter((s): s is AggregatedSource =>
    ["olx", "cars24", "spinny", "cardekho"].includes(s)
  );

  return {
    city: params.get("city") ?? "",
    priceMin: num(params.get("priceMin"), PRICE_MIN),
    priceMax: num(params.get("priceMax"), PRICE_MAX),
    sources,
    types: types.length ? types : DEFAULT_AGGREGATED_FILTERS.types,
    sort,
    page: Math.max(1, num(params.get("page"), 1)),
    q: params.get("q") ?? "",
    condition: parseCsv(params.get("condition")),
    aggregatedOnly: params.get("aggregatedOnly") === "true",
    merge: params.get("merge") !== "false",
    fuel: parseCsv(params.get("fuel")),
    transmission: parseCsv(params.get("transmission")),
    yearMin: num(params.get("yearMin"), YEAR_MIN),
    yearMax: num(params.get("yearMax"), YEAR_MAX),
    mileageMin: num(params.get("mileageMin"), MILEAGE_MIN),
    mileageMax: num(params.get("mileageMax"), MILEAGE_MAX),
    bodyType: parseCsv(params.get("bodyType")),
    ownerType: parseCsv(params.get("ownerType")),
    sellerType: parseCsv(params.get("sellerType")),
  };
}

export function filtersToSearchParams(filters: AggregatedSearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.city) p.set("city", filters.city);
  if (filters.q) p.set("q", filters.q);
  if (filters.priceMin !== PRICE_MIN) p.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== PRICE_MAX) p.set("priceMax", String(filters.priceMax));
  if (filters.types.length && filters.types.length < 2) p.set("type", filters.types.join(","));
  if (filters.sources.length) p.set("source", filters.sources.join(","));
  if (filters.condition.length) p.set("condition", filters.condition.join(","));
  if (filters.sort !== "newest") p.set("sort", filters.sort);
  if (filters.page > 1) p.set("page", String(filters.page));
  if (filters.aggregatedOnly) p.set("aggregatedOnly", "true");
  if (!filters.merge) p.set("merge", "false");
  if (filters.fuel.length) p.set("fuel", filters.fuel.join(","));
  if (filters.transmission.length) p.set("transmission", filters.transmission.join(","));
  if (filters.yearMin !== YEAR_MIN) p.set("yearMin", String(filters.yearMin));
  if (filters.yearMax !== YEAR_MAX) p.set("yearMax", String(filters.yearMax));
  if (filters.mileageMin !== MILEAGE_MIN) p.set("mileageMin", String(filters.mileageMin));
  if (filters.mileageMax !== MILEAGE_MAX) p.set("mileageMax", String(filters.mileageMax));
  if (filters.bodyType.length) p.set("bodyType", filters.bodyType.join(","));
  if (filters.ownerType.length) p.set("ownerType", filters.ownerType.join(","));
  if (filters.sellerType.length) p.set("sellerType", filters.sellerType.join(","));
  return p;
}

export function buildAggregatedSearchApiUrl(filters: AggregatedSearchFilters, advanced = true): string {
  const p = filtersToSearchParams(filters);
  p.set("pageSize", "20");
  return advanced ? `/api/aggregated-listings/search?${p.toString()}` : `/api/aggregated-listings?${p.toString()}`;
}

export function countActiveFilters(filters: AggregatedSearchFilters): number {
  let n = 0;
  if (filters.city) n++;
  if (filters.q) n++;
  if (filters.priceMin !== PRICE_MIN || filters.priceMax !== PRICE_MAX) n++;
  if (filters.sources.length) n++;
  if (filters.types.length < 2) n++;
  if (filters.condition.length) n++;
  if (filters.aggregatedOnly) n++;
  if (!filters.merge) n++;
  if (filters.fuel.length) n++;
  if (filters.transmission.length) n++;
  if (filters.yearMin !== YEAR_MIN || filters.yearMax !== YEAR_MAX) n++;
  if (filters.mileageMin !== MILEAGE_MIN || filters.mileageMax !== MILEAGE_MAX) n++;
  if (filters.bodyType.length) n++;
  if (filters.ownerType.length) n++;
  if (filters.sellerType.length) n++;
  return n;
}

import type { AggregatedSource } from "./types";

export const AGGREGATED_SOURCES: { value: AggregatedSource; label: string }[] = [
  { value: "olx", label: "OLX" },
  { value: "cars24", label: "Cars24" },
  { value: "spinny", label: "Spinny" },
  { value: "cardekho", label: "CarDekho" },
];

export const AGGREGATED_SORT_OPTIONS = [
  { value: "newest" as const, label: "Newest" },
  { value: "popular" as const, label: "Most viewed" },
  { value: "price_asc" as const, label: "Price: Low to High" },
  { value: "price_desc" as const, label: "Price: High to Low" },
  { value: "relevance" as const, label: "Relevance" },
];

export const SOURCE_BADGE_CLASS: Record<string, string> = {
  olx: "bg-[#002f34] text-white",
  cars24: "bg-[#f75d34] text-white",
  spinny: "bg-[#5c2d91] text-white",
  cardekho: "bg-[#24272c] text-white",
};

export function sourceLabel(source: string): string {
  const hit = AGGREGATED_SOURCES.find((s) => s.value === source.toLowerCase());
  return hit ? `From ${hit.label}` : `From ${source}`;
}

export function categoryFromVehicleType(type: "CAR" | "BIKE"): "cars" | "bikes" {
  return type === "BIKE" ? "bikes" : "cars";
}

export function vehicleTypeFromCategory(category: string): "CAR" | "BIKE" {
  return category === "bikes" ? "BIKE" : "CAR";
}

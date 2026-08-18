import { deriveFeaturePills, MarketplaceListingDetail } from "./listingDetail";
import { formatInrFull } from "./format";

export const COMPARE_SPEC_KEYS = [
  "year",
  "mileage",
  "fuel",
  "transmission",
  "body",
  "engine",
  "power",
  "torque",
  "owner",
  "condition",
  "color",
  "insurance",
  "pollution",
  "service",
  "accident",
] as const;

export type CompareSpecKey = (typeof COMPARE_SPEC_KEYS)[number];

export const COMPARE_SPEC_LABELS: Record<CompareSpecKey, string> = {
  year: "Year",
  mileage: "Mileage",
  fuel: "Fuel",
  transmission: "Transmission",
  body: "Body",
  engine: "Engine",
  power: "Power",
  torque: "Torque",
  owner: "Owner",
  condition: "Condition",
  color: "Color",
  insurance: "Insurance",
  pollution: "Pollution",
  service: "Service history",
  accident: "Accident",
};

export function getSpecValue(listing: MarketplaceListingDetail, key: CompareSpecKey): string {
  switch (key) {
    case "year":
      return String(listing.yearOfManufacture);
    case "mileage":
      return listing.currentMileage != null
        ? `${listing.currentMileage.toLocaleString("en-IN")} km`
        : "—";
    case "fuel":
      return listing.fuelType ? capitalize(listing.fuelType) : "—";
    case "transmission":
      return listing.transmission ? capitalize(listing.transmission) : "—";
    case "body":
      return listing.bodyType ?? "—";
    case "engine":
      return listing.engineCC ? `${listing.engineCC} cc` : "—";
    case "power":
      return listing.power ?? "—";
    case "torque":
      return listing.torque ?? "—";
    case "owner":
      return listing.ownerType?.replace("_", " ") ?? "—";
    case "condition":
      return listing.condition.replace("_", " ");
    case "color":
      return listing.color?.trim() || "—";
    case "insurance":
      return listing.insuranceValid ? "Valid" : "Not valid";
    case "pollution":
      return listing.pollutionCertValid ? "Valid" : "Not valid";
    case "service":
      return listing.serviceHistoryAvail ? "Available" : "Not available";
    case "accident":
      return listing.accidentHistory ? "Yes" : "No";
    default:
      return "—";
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function collectAllFeatures(listings: MarketplaceListingDetail[]): string[] {
  const set = new Set<string>();
  for (const l of listings) {
    for (const f of deriveFeaturePills(l)) set.add(f.label);
  }
  return [...set].sort();
}

export function hasFeature(listing: MarketplaceListingDetail, feature: string): boolean {
  return deriveFeaturePills(listing).some((f) => f.label === feature && f.present);
}

export interface PriceDiff {
  amount: number;
  percent: number;
  label: string;
  direction: "more" | "less" | "same";
}

export function priceDiffVsCheapest(
  listing: MarketplaceListingDetail,
  listings: MarketplaceListingDetail[]
): PriceDiff | null {
  if (listings.length < 2) return null;
  const prices = listings.map((l) => Number(l.askingPrice));
  const min = Math.min(...prices);
  const price = Number(listing.askingPrice);
  if (price === min) {
    return { amount: 0, percent: 0, label: "Lowest price", direction: "same" };
  }
  const diff = price - min;
  const pct = min > 0 ? (diff / min) * 100 : 0;
  return {
    amount: diff,
    percent: pct,
    label: `${formatInrFull(diff)} more (${pct.toFixed(1)}%)`,
    direction: "more",
  };
}

/** Radar chart axes — normalized 0–100 within the compared set. */
export const RADAR_AXES = ["Price value", "Year", "Low mileage", "Engine", "Seller rating"] as const;

export type RadarScores = Record<(typeof RADAR_AXES)[number], number>;

export function computeRadarScores(listings: MarketplaceListingDetail[]): Map<string, RadarScores> {
  const prices = listings.map((l) => Number(l.askingPrice));
  const years = listings.map((l) => l.yearOfManufacture);
  const mileages = listings.map((l) => l.currentMileage ?? 0);
  const engines = listings.map((l) => l.engineCC ?? 0);
  const ratings = listings.map((l) => l.seller.ratings);

  const maxPrice = Math.max(...prices, 1);
  const minPrice = Math.min(...prices);
  const maxYear = Math.max(...years);
  const minYear = Math.min(...years);
  const maxMileage = Math.max(...mileages, 1);
  const minMileage = Math.min(...mileages);
  const maxEngine = Math.max(...engines, 1);
  const minEngine = Math.min(...engines);
  const maxRating = Math.max(...ratings, 1);
  const minRating = Math.min(...ratings);

  const norm = (v: number, min: number, max: number, invert = false) => {
    if (max === min) return 50;
    const t = (v - min) / (max - min);
    return Math.round((invert ? 1 - t : t) * 100);
  };

  const out = new Map<string, RadarScores>();
  listings.forEach((l, i) => {
    out.set(l.listingId, {
      "Price value": norm(prices[i], minPrice, maxPrice, true),
      Year: norm(years[i], minYear, maxYear),
      "Low mileage": norm(mileages[i], minMileage, maxMileage, true),
      Engine: norm(engines[i], minEngine, maxEngine),
      "Seller rating": norm(ratings[i], minRating, maxRating),
    });
  });
  return out;
}

/** Deterministic 30-day price trend (no historical DB — stable per listing). */
export function generatePriceTrend(listingId: string, currentPrice: number): number[] {
  let seed = 0;
  for (let i = 0; i < listingId.length; i++) seed += listingId.charCodeAt(i);
  const points: number[] = [];
  let price = currentPrice * (0.97 + (seed % 7) * 0.005);
  for (let d = 0; d < 30; d++) {
    const wave = Math.sin((d + seed) * 0.4) * 0.012;
    const drift = (d / 30) * 0.025;
    price = currentPrice * (0.96 + drift + wave);
    points.push(Math.round(price));
  }
  points[29] = currentPrice;
  return points;
}

export function compareShareUrl(ids: string[]): string {
  if (typeof window === "undefined") return `/vehicles/compare?ids=${ids.join(",")}`;
  const base = window.location.origin;
  return `${base}/vehicles/compare?ids=${encodeURIComponent(ids.join(","))}`;
}

export function parseCompareIds(param: string | null): string[] {
  if (!param) return [];
  return [...new Set(param.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 4);
}

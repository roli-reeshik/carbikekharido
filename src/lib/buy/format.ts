import { MarketplaceListingSummary } from "./types";

export function formatInrFull(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceLakhs(amount: number): string {
  if (amount >= 100_000) {
    const lakhs = amount / 100_000;
    return `₹${lakhs.toFixed(lakhs >= 10 ? 0 : 2)} L`;
  }
  return formatInrFull(amount);
}

export function formatMileage(km: number | null): string {
  if (km == null) return "—";
  if (km >= 1000) return `${Math.round(km / 1000)}K KMs`;
  return `${km} KMs`;
}

export function formatFuel(fuel: string | null): string {
  if (!fuel) return "—";
  return fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

export function formatTransmission(t: string | null): string {
  if (!t) return "—";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function listingTitle(item: MarketplaceListingSummary): string {
  const engine =
    item.fuelType && item.transmission
      ? `${formatFuel(item.fuelType)} ${formatTransmission(item.transmission)}`
      : item.fuelType
        ? formatFuel(item.fuelType)
        : "";
  const base = `${item.yearOfManufacture} ${item.brand} ${item.model}`;
  return engine ? `${base} ${engine}` : base;
}

export function listingSpecsRow(item: MarketplaceListingSummary): string {
  return [
    String(item.yearOfManufacture),
    formatMileage(item.currentMileage),
    formatFuel(item.fuelType),
    formatTransmission(item.transmission),
  ].join(" • ");
}

export function sellerLabel(type: "INDIVIDUAL" | "DEALER"): string {
  return type === "DEALER" ? "Dealer" : "Individual";
}

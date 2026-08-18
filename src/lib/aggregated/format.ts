import type { AggregatedListingSummary } from "./types";
import { sourceLabel } from "./constants";

export function formatHoursAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
  if (hours < 1) return "Last updated just now";
  if (hours === 1) return "Last updated 1 hour ago";
  if (hours < 24) return `Last updated ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Last updated 1 day ago";
  return `Last updated ${days} days ago`;
}

export function aggregatedSpecsRow(item: AggregatedListingSummary): string {
  return [item.mileage, item.condition, item.location].filter(Boolean).join(" • ") || item.city;
}

export function formatPriceDelta(delta: number, deltaPercent: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(delta)} (${sign}${deltaPercent.toFixed(0)}%) vs market`;
}

export function serializeAggregatedListing(row: {
  id: string;
  sourceWebsite: string;
  externalId?: string;
  title: string;
  priceInr: bigint;
  location: string | null;
  mileage: string | null;
  condition: string | null;
  sellerName: string | null;
  listingUrl: string;
  city: string;
  category: string;
  viewCount: number;
  lastScrapedAt: Date;
  expiresAt?: Date;
  createdAt?: Date;
  images: { url: string; thumbnailUrl: string | null; order: number; quality: number | null }[];
}): AggregatedListingSummary {
  const sorted = [...row.images].sort((a, b) => a.order - b.order);
  const thumb = sorted[0]?.thumbnailUrl ?? sorted[0]?.url ?? null;

  return {
    id: row.id,
    sourceWebsite: row.sourceWebsite,
    sourceLabel: sourceLabel(row.sourceWebsite),
    title: row.title,
    priceInr: Number(row.priceInr),
    location: row.location,
    mileage: row.mileage,
    condition: row.condition,
    sellerName: row.sellerName,
    listingUrl: row.listingUrl,
    city: row.city,
    category: row.category,
    viewCount: row.viewCount,
    lastScrapedAt: row.lastScrapedAt.toISOString(),
    lastUpdatedLabel: formatHoursAgo(row.lastScrapedAt.toISOString()),
    imageCount: sorted.length,
    thumbnail: thumb,
    images: sorted.map((img) => ({
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      order: img.order,
      quality: img.quality,
    })),
  };
}

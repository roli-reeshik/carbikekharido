import type { MarketplaceListingSummary } from "@/lib/buy/types";
import { formatHoursAgo } from "./format";
import type { AggregatedListingSummary, AggregatedSortOption, UnifiedListingItem } from "./types";

function marketComparisonFromAvg(price: number, avg: number | null) {
  if (avg == null || avg <= 0) return null;
  const delta = price - avg;
  return {
    marketAveragePrice: avg,
    delta: Math.round(delta),
    deltaPercent: (delta / avg) * 100,
    sampleSize: 0,
  };
}

export const toUnifiedItems = {
  fromAggregated(item: AggregatedListingSummary, marketAvg: number | null): UnifiedListingItem {
    return {
      origin: "aggregated",
      id: item.id,
      title: item.title,
      priceInr: item.priceInr,
      city: item.city,
      category: item.category,
      thumbnail: item.thumbnail,
      imageCount: item.imageCount,
      viewCount: item.viewCount,
      updatedAt: item.lastScrapedAt,
      lastUpdatedLabel: item.lastUpdatedLabel,
      sourceWebsite: item.sourceWebsite,
      sourceLabel: item.sourceLabel,
      listingUrl: item.listingUrl,
      sellerName: item.sellerName,
      mileage: item.mileage,
      condition: item.condition,
      href: `/vehicles/aggregated/${encodeURIComponent(item.id)}`,
      external: false,
      aggregated: item,
      marketComparison: marketComparisonFromAvg(item.priceInr, marketAvg),
    };
  },

  fromMarketplace(item: MarketplaceListingSummary, marketAvg: number | null): UnifiedListingItem {
    const price = Number(item.askingPrice);
    const title = `${item.yearOfManufacture} ${item.brand} ${item.model}`;

    return {
      origin: "marketplace",
      id: item.listingId,
      title,
      priceInr: price,
      city: item.city,
      category: item.vehicleType === "BIKE" ? "bikes" : "cars",
      thumbnail: item.thumbnail,
      imageCount: item.imageCount,
      viewCount: item.viewCount,
      updatedAt: item.publishedAt ?? new Date().toISOString(),
      lastUpdatedLabel: item.publishedAt ? formatHoursAgo(item.publishedAt) : undefined,
      sourceLabel: "CarBikeKharido",
      href: `/vehicles/buy/${encodeURIComponent(item.listingId)}`,
      external: false,
      marketplace: item,
      marketComparison: marketComparisonFromAvg(price, marketAvg),
    };
  },
};

export function sortUnifiedItems(items: UnifiedListingItem[], sort: AggregatedSortOption) {
  items.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.priceInr - b.priceInr;
      case "price_desc":
        return b.priceInr - a.priceInr;
      case "popular":
        return b.viewCount - a.viewCount;
      case "newest":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "relevance":
      default:
        return b.viewCount - a.viewCount || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
}

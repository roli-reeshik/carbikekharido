"use client";

import Link from "next/link";
import { formatInrFull } from "@/lib/buy/format";
import { aggregatedSpecsRow } from "@/lib/aggregated/format";
import { SOURCE_BADGE_CLASS } from "@/lib/aggregated/constants";
import type { UnifiedListingItem } from "@/lib/aggregated/types";
import type { ViewMode } from "@/lib/buy/types";

interface UnifiedListingCardProps {
  item: UnifiedListingItem;
  view: ViewMode;
}

function SourceBadge({ item }: { item: UnifiedListingItem }) {
  if (item.origin === "marketplace") {
    return (
      <span className="rounded bg-sell-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        CarBikeKharido
      </span>
    );
  }

  const key = (item.sourceWebsite ?? "olx").toLowerCase();
  const cls = SOURCE_BADGE_CLASS[key] ?? "bg-ink/80 text-white";

  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {item.sourceLabel ?? "External"}
    </span>
  );
}

function PriceComparison({ item }: { item: UnifiedListingItem }) {
  const mc = item.marketComparison;
  if (!mc || mc.sampleSize === 0 && mc.marketAveragePrice <= 0) return null;
  if (Math.abs(mc.deltaPercent) < 3) return null;

  const below = mc.delta < 0;
  return (
    <p className={`mt-1 text-[11px] font-medium ${below ? "text-sell-emerald" : "text-coral"}`}>
      {below ? "▼" : "▲"} {Math.abs(mc.deltaPercent).toFixed(0)}% vs market avg ({formatInrFull(mc.marketAveragePrice)})
    </p>
  );
}

export function UnifiedListingCard({ item, view }: UnifiedListingCardProps) {
  const isExternal = item.origin === "aggregated";
  const href = item.href;
  const imageBadge =
    item.imageCount >= 5 ? `${item.imageCount}+` : item.imageCount > 1 ? String(item.imageCount) : null;

  const cardInner = (
    <>
      <div className={`relative ${view === "list" ? "h-28 w-40 shrink-0 sm:h-32 sm:w-48" : "aspect-[4/3]"} overflow-hidden rounded-lg bg-paper`}>
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            className={`h-full w-full object-cover ${view === "grid" ? "transition group-hover:scale-[1.02]" : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-30">
            {item.category === "bikes" ? "🏍️" : "🚗"}
          </div>
        )}
        {imageBadge && (
          <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 text-xs font-semibold text-white">
            {imageBadge}
          </span>
        )}
        <div className="absolute right-2 top-2">
          <SourceBadge item={item} />
        </div>
      </div>

      <div className={view === "list" ? "min-w-0 flex-1" : "p-4"}>
        <h3 className={`line-clamp-2 font-semibold text-ink ${view === "grid" ? "min-h-[2.5rem] text-sm leading-snug" : ""}`}>
          {item.title}
        </h3>
        <p className={`font-mono font-bold text-sell-accent ${view === "grid" ? "mt-2 text-lg" : "mt-1 text-xl"}`}>
          {formatInrFull(item.priceInr)}
        </p>
        <PriceComparison item={item} />
        <p className="mt-0.5 text-xs text-ink/50">{item.city}</p>
        {item.origin === "aggregated" && item.aggregated && (
          <p className="mt-2 text-xs text-ink/55">{aggregatedSpecsRow(item.aggregated)}</p>
        )}
        {item.origin === "marketplace" && item.marketplace && (
          <p className="mt-2 text-xs text-ink/55">
            {[item.marketplace.yearOfManufacture, item.marketplace.currentMileage ? `${item.marketplace.currentMileage} km` : null]
              .filter(Boolean)
              .join(" • ")}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink/45">
          {item.lastUpdatedLabel && <span>{item.lastUpdatedLabel}</span>}
          {item.viewCount > 0 && <span>{item.viewCount} views</span>}
        </div>
        {isExternal && item.listingUrl && (
          <p className="mt-2 text-[11px] font-semibold text-sell-primary">View on {item.sourceLabel?.replace("From ", "")} ↗</p>
        )}
      </div>
    </>
  );

  if (isExternal && item.listingUrl) {
    return (
      <Link
        href={href}
        className={`buy-listing-card group overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover ${
          view === "list" ? "flex gap-4 p-3 sm:p-4" : "relative block"
        }`}
      >
        {cardInner}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`buy-listing-card group overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover ${
        view === "list" ? "flex gap-4 p-3 sm:p-4" : "relative block"
      }`}
    >
      {cardInner}
    </Link>
  );
}

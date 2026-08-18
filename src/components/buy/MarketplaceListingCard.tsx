"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthGate } from "@/components/auth/AuthGateProvider";
import { formatInrFull, listingSpecsRow, listingTitle, sellerLabel } from "@/lib/buy/format";
import { isMpCompared, isMpWishlisted, toggleMpCompare, toggleMpWishlist } from "@/lib/buy/wishlist";
import { MarketplaceListingSummary, ViewMode } from "@/lib/buy/types";
import { INTENT_ACTIONS } from "@/lib/intent";

interface MarketplaceListingCardProps {
  item: MarketplaceListingSummary;
  view: ViewMode;
}

export function MarketplaceListingCard({ item, view }: MarketplaceListingCardProps) {
  const { requireAuth } = useAuthGate();
  const [saved, setSaved] = useState(false);
  const [compared, setCompared] = useState(false);
  const href = `/vehicles/buy/${encodeURIComponent(item.listingId)}`;
  const price = Number(item.askingPrice);
  const imageBadge = item.imageCount >= 5 ? `${item.imageCount}+` : item.imageCount > 1 ? String(item.imageCount) : null;

  useEffect(() => {
    setSaved(isMpWishlisted(item.listingId));
    setCompared(isMpCompared(item.listingId));
  }, [item.listingId]);

  function onWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleMpWishlist(item.listingId);
    setSaved(next.includes(item.listingId));
  }

  function onCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleMpCompare(item.listingId);
    setCompared(next.includes(item.listingId));
    if (next.includes(item.listingId) && next.length >= 1) {
      window.location.href = `/vehicles/compare?ids=${encodeURIComponent(next.join(","))}`;
    }
  }

  function onContact(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(INTENT_ACTIONS.CONTACT_SELLER, () => {
      window.location.href = href;
    });
  }

  const fab = (
    <div className="buy-card-fabs pointer-events-none absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
      <button
        type="button"
        onClick={onWishlist}
        aria-label="Save to wishlist"
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105 ${saved ? "text-coral" : "text-ink/70"}`}
      >
        {saved ? "♥" : "♡"}
      </button>
      <button
        type="button"
        onClick={onCompare}
        aria-label="Compare"
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm shadow-md transition hover:scale-105 ${compared ? "text-sell-primary" : "text-ink/70"}`}
      >
        ⇄
      </button>
      <button
        type="button"
        onClick={onContact}
        aria-label="Contact seller"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-sell-accent text-white shadow-md transition hover:scale-105"
      >
        📞
      </button>
    </div>
  );

  if (view === "list") {
    return (
      <Link
        href={href}
        className="buy-listing-card group flex gap-4 overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-card transition hover:shadow-card-hover sm:p-4"
      >
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-paper sm:h-32 sm:w-48">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl opacity-30">
              {item.vehicleType === "BIKE" ? "🏍️" : "🚗"}
            </div>
          )}
          {imageBadge && (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {imageBadge}
            </span>
          )}
          {item.verified && (
            <span className="absolute right-1.5 top-1.5 rounded bg-sell-emerald px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Verified
            </span>
          )}
        </div>
        <div className="relative min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-ink">{listingTitle(item)}</h3>
          <p className="mt-1 font-mono text-xl font-bold text-sell-accent">{formatInrFull(price)}</p>
          <p className="mt-0.5 text-xs text-ink/50">{item.city}</p>
          <p className="mt-2 text-xs text-ink/60">{listingSpecsRow(item)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-sell-primary/10 px-2 py-0.5 font-medium text-sell-primary">
              {sellerLabel(item.sellerType)}
            </span>
            {item.reviewCount > 0 && (
              <span className="text-ink/55">
                ⭐ {item.rating.toFixed(1)} ({item.reviewCount} reviews)
              </span>
            )}
          </div>
          {fab}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="buy-listing-card group relative overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] bg-paper">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-30">
            {item.vehicleType === "BIKE" ? "🏍️" : "🚗"}
          </div>
        )}
        {imageBadge && (
          <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 text-xs font-semibold text-white">
            {imageBadge}
          </span>
        )}
        {item.verified && (
          <span className="absolute right-2 top-2 rounded bg-sell-emerald px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Verified
          </span>
        )}
        {fab}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">{listingTitle(item)}</h3>
        <p className="mt-2 font-mono text-lg font-bold text-sell-accent">{formatInrFull(price)}</p>
        <p className="mt-0.5 text-xs text-ink/50">{item.city}</p>
        <p className="mt-2 text-xs text-ink/55">{listingSpecsRow(item)}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-sell-primary/10 px-2 py-0.5 text-[11px] font-semibold text-sell-primary">
            {sellerLabel(item.sellerType)}
          </span>
          {item.reviewCount > 0 ? (
            <span className="text-[11px] text-ink/55">
              ⭐ {item.rating.toFixed(1)} ({item.reviewCount})
            </span>
          ) : (
            <span className="text-[11px] text-ink/40">New listing</span>
          )}
        </div>
      </div>
    </Link>
  );
}

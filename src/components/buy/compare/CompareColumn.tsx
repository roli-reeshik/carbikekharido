"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COMPARE_SPEC_KEYS, COMPARE_SPEC_LABELS, generatePriceTrend, getSpecValue, priceDiffVsCheapest } from "@/lib/buy/compare";
import { formatInrFull } from "@/lib/buy/format";
import { deriveFeaturePills, listingPageTitle, MarketplaceListingDetail } from "@/lib/buy/listingDetail";
import { isMpWishlisted, toggleMpWishlist } from "@/lib/buy/wishlist";
import { CompareSparkline } from "./CompareSparkline";

const COLORS = ["#FF6B35", "#1E3A5F", "#2D7A6B", "#F5A623"];

interface CompareColumnProps {
  listing: MarketplaceListingDetail;
  allListings: MarketplaceListingDetail[];
  colorIndex: number;
  onRemove: () => void;
}

export function CompareColumn({ listing, allListings, colorIndex, onRemove }: CompareColumnProps) {
  const [saved, setSaved] = useState(false);
  const price = Number(listing.askingPrice);
  const thumb = listing.images.find((i) => i.isThumb && i.type === "PHOTO") ?? listing.images.find((i) => i.type === "PHOTO");
  const priceDiff = priceDiffVsCheapest(listing, allListings);
  const features = deriveFeaturePills(listing);
  const trend = generatePriceTrend(listing.listingId, price);
  const sellerName = listing.seller.dealerName || listing.seller.contact.name || "Seller";

  useEffect(() => {
    setSaved(isMpWishlisted(listing.listingId));
  }, [listing.listingId]);

  return (
    <article
      className="compare-column snap-center shrink-0 rounded-xl border border-line bg-surface shadow-card"
      style={{ width: "min(280px, 85vw)" }}
      aria-label={`Comparison column for ${listingPageTitle(listing)}`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onRemove}
          className="compare-no-print absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70"
          aria-label="Remove from comparison"
        >
          ✕
        </button>
        <div className="aspect-[4/3] bg-paper">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl opacity-30">
              {listing.vehicleType === "BIKE" ? "🏍️" : "🚗"}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-ink">{listingPageTitle(listing)}</h3>
        <p className="mt-1 font-mono text-lg font-bold text-sell-accent">{formatInrFull(price)}</p>
        {priceDiff && priceDiff.direction !== "same" && (
          <p className="mt-0.5 text-xs text-coral">{priceDiff.label}</p>
        )}
        {priceDiff?.direction === "same" && allListings.length > 1 && (
          <p className="mt-0.5 text-xs font-semibold text-sell-emerald">Lowest price</p>
        )}

        <CompareSparkline
          data={trend}
          color={COLORS[colorIndex % COLORS.length]}
          label={listing.brand}
        />

        <dl className="mt-4 space-y-2 border-t border-line pt-4">
          {COMPARE_SPEC_KEYS.slice(0, 8).map((key) => (
            <div key={key} className="flex justify-between gap-2 text-xs">
              <dt className="text-ink/45">{COMPARE_SPEC_LABELS[key]}</dt>
              <dd className="font-medium text-ink">{getSpecValue(listing, key)}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
          {features.map((f) => (
            <li
              key={f.label}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                f.present ? "bg-sell-emerald/12 text-sell-emerald" : "bg-line/50 text-ink/30 line-through"
              }`}
            >
              {f.present ? "✓" : "✗"} {f.label}
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-line pt-4 text-xs text-ink/60">
          <p className="font-semibold text-ink">{sellerName}</p>
          <p>
            ⭐ {listing.seller.ratings.toFixed(1)} ({listing.seller.totalReviews} reviews)
          </p>
          <p>{listing.city}</p>
          {listing.seller.contact.phoneVerified && (
            <p className="text-sell-emerald">✓ Verified seller</p>
          )}
        </div>

        <div className="compare-no-print mt-4 flex flex-col gap-2">
          <Link
            href={`/vehicles/buy/${encodeURIComponent(listing.listingId)}`}
            className="btn-buy-primary text-center text-sm"
          >
            View full listing
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = toggleMpWishlist(listing.listingId);
              setSaved(next.includes(listing.listingId));
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              saved ? "border-coral/40 bg-coral/5 text-coral" : "border-line text-ink/70"
            }`}
          >
            {saved ? "♥ Saved" : "♡ Add to wishlist"}
          </button>
        </div>
      </div>
    </article>
  );
}

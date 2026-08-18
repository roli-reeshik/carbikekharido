"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { SOURCE_BADGE_CLASS } from "@/lib/aggregated/constants";
import { formatInrFull } from "@/lib/buy/format";
import { formatPriceDelta } from "@/lib/aggregated/format";
import type { AggregatedListingDetail } from "@/lib/aggregated/types";

export default function AggregatedDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [listing, setListing] = useState<AggregatedListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/aggregated-listings/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = (await res.json()) as { ok?: boolean; data?: AggregatedListingDetail; error?: string };
        if (!res.ok || !json.ok || !json.data) throw new Error(json.error ?? "Not found");
        setListing(json.data);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setListing(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ink/50">Loading listing…</div>
      </SiteLayout>
    );
  }

  if (error || !listing) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-coral">{error ?? "Listing not found"}</p>
          <Link href="/vehicles/aggregated" className="mt-4 inline-block text-sell-primary hover:underline">
            ← Back to market listings
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const badgeCls = SOURCE_BADGE_CLASS[listing.sourceWebsite.toLowerCase()] ?? "bg-ink/80 text-white";
  const images = listing.images.length ? listing.images : [{ url: listing.thumbnail ?? "", thumbnailUrl: listing.thumbnail, order: 0, quality: 80 }];
  const hero = images[activeImage]?.url ?? listing.thumbnail;

  return (
    <SiteLayout>
      <div className="border-b border-line bg-surface/80">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/vehicles/aggregated" className="text-xs font-semibold text-sell-primary hover:underline">
            ← Market listings
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl opacity-30">🚗</div>
              )}
              <span className={`absolute right-3 top-3 rounded px-2 py-1 text-xs font-bold uppercase ${badgeCls}`}>
                {listing.sourceLabel}
              </span>
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.order}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-sell-accent" : "border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbnailUrl ?? img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{listing.title}</h1>
            <p className="mt-3 font-mono text-3xl font-bold text-sell-accent">{formatInrFull(listing.priceInr)}</p>

            {listing.marketComparison && listing.marketComparison.sampleSize >= 3 && (
              <p className="mt-2 text-sm text-ink/60">
                Market average in {listing.city}: {formatInrFull(listing.marketComparison.marketAveragePrice)}
                <span className="ml-2 font-medium">
                  ({formatPriceDelta(listing.marketComparison.delta, listing.marketComparison.deltaPercent)})
                </span>
              </p>
            )}

            <p className="mt-2 text-sm text-ink/50">{listing.lastUpdatedLabel}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {listing.location && (
                <>
                  <dt className="text-ink/45">Location</dt>
                  <dd className="font-medium">{listing.location}</dd>
                </>
              )}
              {listing.mileage && (
                <>
                  <dt className="text-ink/45">Mileage</dt>
                  <dd className="font-medium">{listing.mileage}</dd>
                </>
              )}
              {listing.condition && (
                <>
                  <dt className="text-ink/45">Condition</dt>
                  <dd className="font-medium">{listing.condition}</dd>
                </>
              )}
              {listing.sellerName && (
                <>
                  <dt className="text-ink/45">Seller</dt>
                  <dd className="font-medium">{listing.sellerName}</dd>
                </>
              )}
              <dt className="text-ink/45">Views</dt>
              <dd className="font-medium">{listing.viewCount}</dd>
            </dl>

            <a
              href={listing.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-buy-primary mt-8 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              View original on {listing.sourceLabel.replace("From ", "")} ↗
            </a>

            <p className="mt-4 text-xs text-ink/40">
              Listing cached from an external source. Prices and availability may have changed — verify on the original site.
            </p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

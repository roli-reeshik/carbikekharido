"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInrFull } from "@/lib/buy/format";
import { MarketplaceListingSummary } from "@/lib/buy/types";

interface SimilarListingsProps {
  listingId: string;
}

export function SimilarListings({ listingId }: SimilarListingsProps) {
  const [items, setItems] = useState<MarketplaceListingSummary[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/vehicles/${encodeURIComponent(listingId)}/similar?limit=5`)
      .then((r) => r.json())
      .then((json: { ok?: boolean; data?: { items: MarketplaceListingSummary[] } }) => {
        if (json.ok && json.data) setItems(json.data.items);
      })
      .catch(() => setItems([]));
  }, [listingId]);

  if (!items.length) return null;

  const visible = items.slice(index, index + 4);
  if (visible.length < 4 && items.length > 4) {
    visible.push(...items.slice(0, 4 - visible.length));
  }

  return (
    <section aria-labelledby="similar-heading" className="mt-12 border-t border-line pt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="similar-heading" className="font-display text-xl font-bold text-ink">
          Similar listings
        </h2>
        {items.length > 4 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="listing-gallery-nav h-8 w-8 text-sm"
              aria-label="Previous similar listings"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="listing-gallery-nav h-8 w-8 text-sm"
              aria-label="Next similar listings"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(items.length <= 4 ? items : visible).map((item) => (
          <Link
            key={item.listingId}
            href={`/vehicles/buy/${encodeURIComponent(item.listingId)}`}
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="aspect-[4/3] bg-paper">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl opacity-30">
                  {item.vehicleType === "BIKE" ? "🏍️" : "🚗"}
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-semibold text-ink">
                {item.yearOfManufacture} {item.brand} {item.model}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-sell-accent">
                {formatInrFull(Number(item.askingPrice))}
              </p>
              <p className="text-xs text-ink/50">{item.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

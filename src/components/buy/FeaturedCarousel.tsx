"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInrFull } from "@/lib/buy/format";
import { MarketplaceListingSummary } from "@/lib/buy/types";

interface FeaturedCarouselProps {
  items: MarketplaceListingSummary[];
  loading?: boolean;
}

export function FeaturedCarousel({ items, loading }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-line/60" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-10 text-center text-sm text-ink/50">
        Featured listings will appear here once sellers publish vehicles.
      </p>
    );
  }

  const visible = items.slice(index, index + 3).concat(items.slice(0, Math.max(0, index + 3 - items.length)));

  return (
    <div className="relative">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <Link
            key={item.listingId}
            href={`/vehicles/buy/${encodeURIComponent(item.listingId)}`}
            className="group overflow-hidden rounded-xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="relative aspect-[16/10] bg-paper">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl opacity-30">
                  {item.vehicleType === "BIKE" ? "🏍️" : "🚗"}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 font-semibold text-ink">
                {item.yearOfManufacture} {item.brand} {item.model}
              </h3>
              <p className="mt-1 font-mono text-lg font-bold text-sell-accent">
                {formatInrFull(Number(item.askingPrice))}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">{item.city}</p>
            </div>
          </Link>
        ))}
      </div>

      {items.length > 3 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-md transition hover:bg-paper md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-md transition hover:bg-paper md:flex"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

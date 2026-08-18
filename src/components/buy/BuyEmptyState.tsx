"use client";

import Link from "next/link";

export function BuyEmptyState({ onAdjustFilters }: { onAdjustFilters?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sell-primary/10 text-3xl">
        🔍
      </div>
      <h3 className="font-display text-xl font-bold text-ink">No vehicles found matching filters</h3>
      <p className="mt-2 max-w-sm text-sm text-ink/55">
        Try widening your price range, selecting more vehicle types, or clearing some filters.
      </p>
      {onAdjustFilters ? (
        <button type="button" onClick={onAdjustFilters} className="mt-6 text-sm font-semibold text-sell-accent hover:underline">
          Try adjusting filters
        </button>
      ) : (
        <Link href="/vehicles/buy/search" className="mt-6 text-sm font-semibold text-sell-accent hover:underline">
          Try adjusting filters
        </Link>
      )}
    </div>
  );
}

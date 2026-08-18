"use client";

import { ViewMode } from "@/lib/buy/types";

export function BuySearchSkeleton({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4 rounded-xl border border-line p-4">
            <div className="h-28 w-40 shrink-0 rounded-lg bg-line/70" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 rounded bg-line/70" />
              <div className="h-6 w-1/3 rounded bg-line/70" />
              <div className="h-3 w-1/2 rounded bg-line/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-line">
          <div className="aspect-[4/3] bg-line/70" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-full rounded bg-line/70" />
            <div className="h-5 w-1/3 rounded bg-line/70" />
            <div className="h-3 w-2/3 rounded bg-line/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

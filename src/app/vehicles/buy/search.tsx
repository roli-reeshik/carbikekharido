"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BuyEmptyState } from "@/components/buy/BuyEmptyState";
import { BuyFiltersSidebar } from "@/components/buy/BuyFiltersSidebar";
import { BuySearchSkeleton } from "@/components/buy/BuySearchSkeleton";
import { MarketplaceListingCard } from "@/components/buy/MarketplaceListingCard";
import { SORT_OPTIONS } from "@/lib/buy/constants";
import {
  buildSearchApiUrl,
  countActiveFilters,
  DEFAULT_FILTERS,
  filtersFromSearchParams,
  filtersToSearchParams,
} from "@/lib/buy/searchParams";
import { BuySearchFilters, SearchApiResponse, SortOption, ViewMode } from "@/lib/buy/types";

export default function BuySearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appliedFilters = useMemo(
    () => filtersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [draft, setDraft] = useState<BuySearchFilters>(appliedFilters);
  const [view, setView] = useState<ViewMode>("grid");
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setDraft(appliedFilters);
  }, [appliedFilters]);

  const fetchResults = useCallback(async (filters: BuySearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildSearchApiUrl(filters));
      const json = (await res.json()) as { ok?: boolean; data?: SearchApiResponse; error?: string };
      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.error ?? "Search failed");
      }
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(appliedFilters);
  }, [appliedFilters, fetchResults]);

  const appliedCount = countActiveFilters(appliedFilters);

  function pushFilters(filters: BuySearchFilters) {
    const p = filtersToSearchParams({ ...filters, page: 1 });
    router.push(`/vehicles/buy/search?${p.toString()}`);
  }

  function applyDraft() {
    pushFilters(draft);
    setMobileFiltersOpen(false);
  }

  function clearFilters() {
    setDraft(DEFAULT_FILTERS);
    router.push("/vehicles/buy/search");
    setMobileFiltersOpen(false);
  }

  function changeSort(sort: SortOption) {
    pushFilters({ ...appliedFilters, sort, page: 1 });
  }

  function changePage(page: number) {
    const p = filtersToSearchParams({ ...appliedFilters, page });
    router.push(`/vehicles/buy/search?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const sidebar = (
    <BuyFiltersSidebar
      draft={draft}
      appliedCount={appliedCount}
      onDraftChange={setDraft}
      onApply={applyDraft}
      onClear={clearFilters}
    />
  );

  return (
    <SiteLayout>
      <div className="border-b border-line bg-surface/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <Link href="/vehicles/buy" className="text-xs font-semibold text-sell-primary hover:underline">
              ← Back to search
            </Link>
            <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Search results</h1>
          </div>
          <button
            type="button"
            className="btn-buy-ghost md:inline-flex lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            Filters{appliedCount > 0 ? ` (${appliedCount})` : ""}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop sidebar */}
          <div className="hidden w-1/4 shrink-0 lg:block">{sidebar}</div>

          <main className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-ink/60">
                  Sort
                  <select
                    value={appliedFilters.sort}
                    onChange={(e) => changeSort(e.target.value as SortOption)}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-sell-accent"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex rounded-lg border border-line p-0.5">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${view === "grid" ? "bg-sell-primary text-white" : "text-ink/55"}`}
                    aria-label="Grid view"
                  >
                    ⊞ Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${view === "list" ? "bg-sell-primary text-white" : "text-ink/55"}`}
                    aria-label="List view"
                  >
                    ☰ List
                  </button>
                </div>
              </div>
              {data && !loading && (
                <p className="text-sm text-ink/55">
                  Showing {data.meta.from}-{data.meta.to} of {data.meta.total}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
                {error}.{" "}
                <button type="button" onClick={() => fetchResults(appliedFilters)} className="font-semibold underline">
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <BuySearchSkeleton view={view} />
            ) : !data?.items.length ? (
              <BuyEmptyState onAdjustFilters={() => setMobileFiltersOpen(true)} />
            ) : (
              <>
                <div
                  className={
                    view === "grid"
                      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col gap-4"
                  }
                >
                  {data.items.map((item) => (
                    <MarketplaceListingCard key={item.listingId} item={item} view={view} />
                  ))}
                </div>

                {data.meta.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={appliedFilters.page <= 1}
                      onClick={() => changePage(appliedFilters.page - 1)}
                      className="btn-buy-ghost disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-ink/55">
                      Page {appliedFilters.page} of {data.meta.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={appliedFilters.page >= data.meta.totalPages}
                      onClick={() => changePage(appliedFilters.page + 1)}
                      className="btn-buy-primary disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {mobileFiltersOpen && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="buy-sheet-backdrop lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="buy-sheet md:max-w-lg md:left-1/2 md:-translate-x-1/2 lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="text-ink/50">
                ✕
              </button>
            </div>
            {sidebar}
          </div>
        </>
      )}
    </SiteLayout>
  );
}

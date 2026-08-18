"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CompareColumn } from "@/components/buy/compare/CompareColumn";
import { CompareFeatureTable } from "@/components/buy/compare/CompareFeatureTable";
import { CompareRadarChart } from "@/components/buy/compare/CompareRadarChart";
import {
  compareShareUrl,
  computeRadarScores,
  parseCompareIds,
} from "@/lib/buy/compare";
import { listingPageTitle, MarketplaceListingDetail } from "@/lib/buy/listingDetail";
import {
  getMpCompare,
  MAX_COMPARE,
  removeMpCompare,
  setMpCompare,
} from "@/lib/buy/wishlist";
import "./compare.css";

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ids, setIds] = useState<string[]>([]);
  const [listings, setListings] = useState<MarketplaceListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [addQuery, setAddQuery] = useState("");
  const [searchHits, setSearchHits] = useState<{ listingId: string; brand: string; model: string; askingPrice: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const syncUrl = useCallback(
    (nextIds: string[]) => {
      const p = new URLSearchParams();
      if (nextIds.length) p.set("ids", nextIds.join(","));
      router.replace(`/vehicles/compare?${p.toString()}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const fromUrl = parseCompareIds(searchParams.get("ids"));
    const fromStore = getMpCompare();
    const merged = fromUrl.length ? fromUrl : fromStore;
    setIds(merged);
    if (fromUrl.length) setMpCompare(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!ids.length) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/vehicles/compare?ids=${encodeURIComponent(ids.join(","))}`)
      .then((r) => r.json())
      .then((json: { ok?: boolean; data?: { listings: MarketplaceListingDetail[] } }) => {
        if (json.ok && json.data) {
          setListings(json.data.listings);
        } else {
          setListings([]);
        }
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [ids]);

  useEffect(() => {
    if (!addQuery.trim()) {
      setSearchHits([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/vehicles/search?q=${encodeURIComponent(addQuery)}&pageSize=6`)
        .then((r) => r.json())
        .then((json: { ok?: boolean; data?: { items: typeof searchHits } }) => {
          if (json.ok && json.data) setSearchHits(json.data.items);
        })
        .catch(() => setSearchHits([]));
    }, 300);
    return () => clearTimeout(t);
  }, [addQuery]);

  const radarSeries = useMemo(() => {
    if (listings.length < 2) return [];
    const scores = computeRadarScores(listings);
    return listings.map((l) => ({
      id: l.listingId,
      label: `${l.brand} ${l.model}`,
      scores: scores.get(l.listingId)!,
    }));
  }, [listings]);

  function removeListing(listingId: string) {
    const next = ids.filter((id) => id !== listingId);
    setIds(next);
    setMpCompare(next);
    removeMpCompare(listingId);
    syncUrl(next);
  }

  function addListing(listingId: string) {
    if (ids.includes(listingId)) return;
    const next = ids.length >= MAX_COMPARE ? [...ids.slice(1), listingId] : [...ids, listingId];
    setIds(next);
    setMpCompare(next);
    syncUrl(next);
    setAddQuery("");
    setSearchHits([]);
  }

  function handleShare() {
    const url = compareShareUrl(ids);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePdf() {
    window.print();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape" && ids.length) {
        setIds([]);
        setMpCompare([]);
        syncUrl([]);
      }
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        if (ids[idx]) removeListing(ids[idx]);
      }
      if (e.key === "p" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePdf();
      }
      if (e.key === "ArrowLeft" && scrollRef.current) {
        scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
      }
      if (e.key === "ArrowRight" && scrollRef.current) {
        scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, syncUrl]);

  return (
    <SiteLayout>
      <div className="compare-page mx-auto max-w-7xl px-4 py-8">
        <div className="compare-no-print flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/vehicles/buy/search" className="text-xs font-semibold text-sell-primary hover:underline">
              ← Back to search
            </Link>
            <h1 className="font-display text-3xl font-bold text-ink">Compare listings</h1>
            <p className="mt-1 text-sm text-ink/50">
              Side-by-side comparison for up to {MAX_COMPARE} vehicles. Keys: 1–4 remove, Esc clear, ← → scroll, Ctrl+P PDF
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleShare} className="btn-buy-ghost text-sm" disabled={!ids.length}>
              {copied ? "Link copied!" : "Share comparison"}
            </button>
            <button type="button" onClick={handlePdf} className="btn-buy-ghost text-sm" disabled={!listings.length}>
              Download PDF
            </button>
          </div>
        </div>

        {ids.length < MAX_COMPARE && (
          <div className="compare-no-print mt-6">
            <label htmlFor="compare-add" className="text-sm font-medium text-ink/70">
              Add a listing
            </label>
            <input
              id="compare-add"
              type="search"
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search brand or model…"
              className="mt-1 w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sell-accent"
            />
            {searchHits.length > 0 && (
              <ul className="mt-2 max-w-md rounded-lg border border-line bg-surface shadow-card">
                {searchHits.map((hit) => (
                  <li key={hit.listingId}>
                    <button
                      type="button"
                      disabled={ids.includes(hit.listingId)}
                      onClick={() => addListing(hit.listingId)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-paper disabled:opacity-40"
                    >
                      <span>
                        {hit.brand} {hit.model}
                      </span>
                      <span className="font-mono text-xs text-sell-accent">₹{Number(hit.askingPrice).toLocaleString("en-IN")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading ? (
          <div className="mt-10 flex gap-4 overflow-hidden">
            {Array.from({ length: Math.min(ids.length || 2, 4) }).map((_, i) => (
              <div key={i} className="h-96 w-72 shrink-0 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : !listings.length ? (
          <div className="mt-16 rounded-xl border border-dashed border-line py-16 text-center">
            <p className="text-4xl opacity-40">⇄</p>
            <p className="mt-3 font-semibold text-ink">No listings to compare</p>
            <p className="mt-1 text-sm text-ink/50">
              Add vehicles from search results using the compare button, or search above.
            </p>
            <Link href="/vehicles/buy/search" className="btn-buy-primary mt-6 inline-block">
              Browse listings
            </Link>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="compare-columns mt-8 flex gap-4 overflow-x-auto pb-4"
              role="region"
              aria-label="Listing comparison columns"
            >
              {listings.map((listing, i) => (
                <CompareColumn
                  key={listing.listingId}
                  listing={listing}
                  allListings={listings}
                  colorIndex={i}
                  onRemove={() => removeListing(listing.listingId)}
                />
              ))}
              {listings.length < MAX_COMPARE && (
                <div
                  className="flex shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-line text-sm text-ink/40"
                  style={{ width: "min(200px, 40vw)", minHeight: 200 }}
                >
                  + Add up to {MAX_COMPARE - listings.length} more
                </div>
              )}
            </div>

            {listings.length >= 2 && (
              <div className="compare-print-section mt-10 grid gap-8 lg:grid-cols-2">
                <section aria-labelledby="radar-heading">
                  <h2 id="radar-heading" className="font-display text-lg font-bold text-ink">
                    Spec comparison radar
                  </h2>
                  <div className="mt-4 rounded-xl border border-line bg-surface p-4">
                    <CompareRadarChart series={radarSeries} />
                  </div>
                </section>
                <section aria-labelledby="table-heading" className="lg:col-span-2">
                  <h2 id="table-heading" className="font-display text-lg font-bold text-ink">
                    Feature & spec table
                  </h2>
                  <div className="mt-4">
                    <CompareFeatureTable listings={listings} />
                  </div>
                </section>
              </div>
            )}

            {listings.length === 1 && (
              <p className="compare-no-print mt-8 text-center text-sm text-ink/50">
                Add at least one more listing to see radar charts and comparison tables.
              </p>
            )}
          </>
        )}

        {/* Print-only title block */}
        <div className="hidden print:block print:mt-4">
          <h1 className="text-xl font-bold">CarBikeKharido — Listing Comparison</h1>
          <p className="text-sm text-gray-600">{listings.map(listingPageTitle).join(" vs ")}</p>
        </div>
      </div>
    </SiteLayout>
  );
}

export default function VehiclesComparePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink/50">Loading comparison…</div>}>
      <ComparePageContent />
    </Suspense>
  );
}

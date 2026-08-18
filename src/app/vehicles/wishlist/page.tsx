"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuthGate } from "@/components/auth/AuthGateProvider";
import { getMpWishlist } from "@/lib/buy/wishlist";
import { formatInrFull } from "@/lib/buy/format";
import { INTENT_ACTIONS } from "@/lib/intent";
import { isAuthenticated } from "@/lib/session";
import {
  apiRemoveWishlist,
  apiSendDigest,
  apiSetPriceAlert,
  exportWishlistCsv,
  fetchWishlist,
  WishlistItem,
  wishlistShareUrl,
} from "@/lib/wishlist/apiClient";
import "../buy/buy.css";

type SortOption = "saved" | "price_asc" | "price_desc";

function WishlistContent() {
  const searchParams = useSearchParams();
  const { requireAuth } = useAuthGate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [count, setCount] = useState(0);
  const [sort, setSort] = useState<SortOption>("saved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertInputs, setAlertInputs] = useState<Record<string, string>>({});
  const [digestEmail, setDigestEmail] = useState("");
  const [digestMsg, setDigestMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      setItems([]);
      setCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWishlist(sort);
      setItems(data.items);
      setCount(data.count);
      const alerts: Record<string, string> = {};
      data.items.forEach((i) => {
        if (i.priceAlert) alerts[i.listingId] = i.priceAlert.maxPrice;
      });
      setAlertInputs(alerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    if (isAuthenticated()) load();
    else setLoading(false);
  }, [load]);

  useEffect(() => {
    const shared = searchParams.get("shared");
    if (shared && isAuthenticated()) {
      /* shared view is read-only hint — listings open individually */
    }
  }, [searchParams]);

  async function handleRemove(listingId: string) {
    try {
      const data = await apiRemoveWishlist(listingId);
      setCount(data.count);
      setItems((prev) => prev.filter((i) => i.listingId !== listingId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  async function handleSetAlert(listingId: string) {
    const raw = alertInputs[listingId]?.replace(/,/g, "");
    const maxPrice = Number(raw);
    if (!Number.isFinite(maxPrice) || maxPrice < 10_000) {
      setError("Enter a valid alert price (min ₹10,000)");
      return;
    }
    try {
      await apiSetPriceAlert(listingId, maxPrice);
      await load();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Alert failed");
    }
  }

  function handleExport() {
    const csv = exportWishlistCsv(items);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carbikekharido-wishlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    const ids = items.map((i) => i.listingId);
    navigator.clipboard.writeText(wishlistShareUrl(ids)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDigest() {
    try {
      const result = await apiSendDigest(digestEmail || undefined);
      setDigestMsg(result.sent ? "Digest email sent!" : "Digest queued (check server logs in dev)");
    } catch (e) {
      setDigestMsg(e instanceof Error ? e.message : "Digest failed");
    }
  }

  if (!isAuthenticated()) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl opacity-30">♡</p>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">Sign in to save listings</h2>
        <p className="mt-2 text-sm text-ink/50">
          Your saved vehicles sync across devices when you verify your phone.
        </p>
        <button type="button" onClick={() => requireAuth(INTENT_ACTIONS.SAVE_PRICE_ALERT, () => load())} className="btn-buy-primary mt-6">
          Sign in with OTP
        </button>
        {getMpWishlist().length > 0 && (
          <p className="mt-4 text-xs text-ink/45">{getMpWishlist().length} listing(s) saved locally — will merge after sign-in</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/vehicles/buy/search" className="text-xs font-semibold text-sell-primary hover:underline">
            ← Browse listings
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink">Saved listings</h1>
          <p className="mt-1 text-sm text-ink/50">
            {count} saved {count === 1 ? "vehicle" : "vehicles"} · Price alerts notify you when prices drop
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            aria-label="Sort wishlist"
          >
            <option value="saved">Recently saved</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button type="button" onClick={handleExport} disabled={!items.length} className="btn-buy-ghost text-sm disabled:opacity-40">
            Export CSV
          </button>
          <button type="button" onClick={handleShare} disabled={!items.length} className="btn-buy-ghost text-sm disabled:opacity-40">
            {copied ? "Link copied!" : "Share wishlist"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold text-ink">Email digest</h2>
        <p className="mt-1 text-xs text-ink/50">Get your saved listings emailed to you.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            value={digestEmail}
            onChange={(e) => setDigestEmail(e.target.value)}
            placeholder="your@email.com"
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sell-accent"
          />
          <button type="button" onClick={handleDigest} className="btn-buy-primary text-sm">
            Send digest now
          </button>
        </div>
        {digestMsg && <p className="mt-2 text-xs text-sell-emerald">{digestMsg}</p>}
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-line/60" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="mt-16 text-center">
          <p className="text-5xl opacity-30">♡</p>
          <p className="mt-4 text-sm text-ink/50">No saved listings yet.</p>
          <Link href="/vehicles/buy/search" className="btn-buy-primary mt-4 inline-block">
            Find vehicles
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.wishlistId} className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
              <Link href={`/vehicles/buy/${encodeURIComponent(item.listingId)}`} className="block">
                <div className="aspect-[4/3] bg-paper">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl opacity-30">
                      {item.vehicleType === "BIKE" ? "🏍️" : "🚗"}
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/vehicles/buy/${encodeURIComponent(item.listingId)}`}>
                  <h3 className="font-semibold text-ink">
                    {item.yearOfManufacture} {item.brand} {item.model}
                  </h3>
                </Link>
                <p className="mt-1 font-mono text-lg font-bold text-sell-accent">{formatInrFull(Number(item.askingPrice))}</p>
                <p className="text-xs text-ink/50">{item.city} · Saved {new Date(item.savedAt).toLocaleDateString("en-IN")}</p>

                <div className="mt-3 border-t border-line pt-3">
                  <label className="text-xs font-semibold text-ink/55" htmlFor={`alert-${item.listingId}`}>
                    Price alert (notify below)
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id={`alert-${item.listingId}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="Max price ₹"
                      value={alertInputs[item.listingId] ?? ""}
                      onChange={(e) =>
                        setAlertInputs((prev) => ({ ...prev, [item.listingId]: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
                    />
                    <button type="button" onClick={() => handleSetAlert(item.listingId)} className="btn-buy-primary px-3 py-1.5 text-xs">
                      Set
                    </button>
                  </div>
                  {item.priceAlert && (
                    <p className="mt-1 text-[10px] text-sell-emerald">
                      Alert active: below {formatInrFull(Number(item.priceAlert.maxPrice))}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.listingId)}
                  className="mt-3 w-full rounded-lg border border-line py-2 text-xs font-medium text-ink/60 hover:bg-paper hover:text-coral"
                >
                  Remove from wishlist
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function VehiclesWishlistPage() {
  return (
    <SiteLayout>
      <div className="buy-flow mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<div className="py-20 text-center text-sm text-ink/50">Loading wishlist…</div>}>
          <WishlistContent />
        </Suspense>
      </div>
    </SiteLayout>
  );
}

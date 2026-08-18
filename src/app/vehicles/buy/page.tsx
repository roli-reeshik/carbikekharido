"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FeaturedCarousel } from "@/components/buy/FeaturedCarousel";
import { HeroSearchBar } from "@/components/buy/HeroSearchBar";
import { PRICE_MAX, PRICE_MIN, QUICK_FILTERS } from "@/lib/buy/constants";
import { buildSearchApiUrl } from "@/lib/buy/searchParams";
import { MarketplaceListingSummary, SearchApiResponse, VehicleTypeFilter } from "@/lib/buy/types";

export default function BuyLandingPage() {
  const router = useRouter();
  const [types, setTypes] = useState<VehicleTypeFilter[]>(["CAR", "BIKE"]);
  const [priceMin, setPriceMin] = useState(PRICE_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [city, setCity] = useState("");
  const [featured, setFeatured] = useState<MarketplaceListingSummary[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    fetch(buildSearchApiUrl({ types: ["CAR", "BIKE"], priceMin: PRICE_MIN, priceMax: PRICE_MAX, city: "", fuel: [], transmission: [], yearMin: 1990, yearMax: new Date().getFullYear() + 1, mileageMin: 0, mileageMax: 200_000, bodyType: [], ownerType: [], condition: [], sellerType: [], q: "", sort: "popular", page: 1 }, { featured: "true", pageSize: "6" }))
      .then((r) => r.json())
      .then((json: { ok?: boolean; data?: SearchApiResponse }) => {
        if (json.ok && json.data) setFeatured(json.data.items);
      })
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  return (
    <SiteLayout>
      <section className="buy-hero-gradient border-b border-line/60 pb-10 pt-8 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-sell-primary">Buy used vehicles</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-highway sm:text-4xl">
            Find your next car or bike
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink/60 sm:text-base">
            Search thousands of verified listings from individuals and dealers across India.
          </p>
          <div className="mt-8">
            <HeroSearchBar
              types={types}
              priceMin={priceMin}
              priceMax={priceMax}
              city={city}
              onTypesChange={setTypes}
              onPriceChange={(min, max) => {
                setPriceMin(min);
                setPriceMax(max);
              }}
              onCityChange={setCity}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Featured listings</h2>
            <p className="mt-1 text-sm text-ink/50">Hand-picked popular vehicles this week</p>
          </div>
        </div>
        <FeaturedCarousel items={featured} loading={featuredLoading} />
      </section>

      <section className="border-t border-line bg-surface/50 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-xl font-bold text-ink">Quick filters</h2>
          <p className="mt-1 text-sm text-ink/50">Jump straight to popular searches</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.id}
                type="button"
                onClick={() => {
                  const p = new URLSearchParams(qf.params as Record<string, string>);
                  router.push(`/vehicles/buy/search?${p.toString()}`);
                }}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink/75 transition hover:border-sell-accent/40 hover:bg-sell-accent/5 hover:text-sell-accent"
              >
                {qf.label}
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink/45">
            Selling instead?{" "}
            <Link href="/vehicles/sell" className="font-semibold text-sell-primary hover:underline">
              List your vehicle free
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

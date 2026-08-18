"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRICE_MAX, PRICE_MIN } from "@/lib/buy/constants";
import { formatPriceLakhs } from "@/lib/buy/format";
import { filtersToSearchParams } from "@/lib/buy/searchParams";
import { VehicleTypeFilter } from "@/lib/buy/types";
import { CityAutocomplete } from "./CityAutocomplete";
import { DualRangeSlider } from "./DualRangeSlider";

interface HeroSearchBarProps {
  types: VehicleTypeFilter[];
  priceMin: number;
  priceMax: number;
  city: string;
  onTypesChange: (types: VehicleTypeFilter[]) => void;
  onPriceChange: (min: number, max: number) => void;
  onCityChange: (city: string) => void;
}

export function HeroSearchBar({
  types,
  priceMin,
  priceMax,
  city,
  onTypesChange,
  onPriceChange,
  onCityChange,
}: HeroSearchBarProps) {
  const router = useRouter();

  function toggleType(type: VehicleTypeFilter) {
    const has = types.includes(type);
    let next = has ? types.filter((t) => t !== type) : [...types, type];
    if (next.length === 0) next = [type === "CAR" ? "BIKE" : "CAR"];
    onTypesChange(next);
  }

  function handleSearch() {
    const p = filtersToSearchParams({
      types,
      priceMin,
      priceMax,
      city,
      fuel: [],
      transmission: [],
      yearMin: 1990,
      yearMax: new Date().getFullYear() + 1,
      mileageMin: 0,
      mileageMax: 200_000,
      bodyType: [],
      ownerType: [],
      condition: [],
      sellerType: [],
      q: "",
      sort: "relevance",
      page: 1,
    });
    router.push(`/vehicles/buy/search?${p.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {(["CAR", "BIKE"] as VehicleTypeFilter[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              types.includes(type)
                ? "bg-sell-primary text-white shadow-sm"
                : "bg-paper text-ink/60 hover:bg-line/80"
            }`}
          >
            {type === "CAR" ? "🚗 Cars" : "🏍️ Bikes"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div className="lg:col-span-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Price range</p>
          <DualRangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50_000}
            valueMin={priceMin}
            valueMax={priceMax}
            formatLabel={formatPriceLakhs}
            onChange={onPriceChange}
          />
        </div>
        <div>
          <label htmlFor="hero-city" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/45">
            Location
          </label>
          <CityAutocomplete id="hero-city" value={city} onChange={onCityChange} placeholder="Indian city" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button type="button" onClick={handleSearch} className="btn-buy-primary whitespace-nowrap px-8">
            Search
          </button>
          <Link href="/vehicles/buy/search" className="btn-buy-ghost text-center">
            View All
          </Link>
        </div>
      </div>
    </div>
  );
}

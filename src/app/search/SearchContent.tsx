"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { VehicleCard } from "@/components/VehicleCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useIndiaCatalogSearch } from "@/lib/hooks/useIndiaCatalogSearch";
import { useCatalogBrands } from "@/lib/hooks/useCatalogBrands";
import { VehicleType } from "@/lib/vehicles";

type CatalogTab = "car" | "ev" | "bike" | "scooter" | "all";

const CATALOG_TABS: CatalogTab[] = ["car", "ev", "bike", "scooter", "all"];

function isCatalogTab(value: string | null): value is CatalogTab {
  return !!value && (CATALOG_TABS as string[]).includes(value);
}

export default function SearchPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const initialType = (searchParams.get("type") as VehicleType) || "car";
  const initialQuery = searchParams.get("q") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialFuel = searchParams.get("fuel") || "";
  const initialPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const initialCategory = searchParams.get("category");

  const [vehicleType, setVehicleType] = useState<VehicleType>(initialType);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>(
    isCatalogTab(initialCategory)
      ? initialCategory
      : initialFuel === "electric"
        ? "ev"
        : initialType === "bike"
          ? "bike"
          : "car"
  );
  const [query, setQuery] = useState(initialQuery);
  const [brand, setBrand] = useState(initialBrand);
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("name");

  const categoryParam =
    catalogTab === "all" ? undefined : catalogTab;

  const { vehicles, meta, loading } = useIndiaCatalogSearch({
    q: query || undefined,
    category: categoryParam,
    brand: brand || undefined,
    page,
    pageSize: 24,
  });

  const { brands: carBrands } = useCatalogBrands("car");
  const { brands: bikeBrands } = useCatalogBrands("bike");
  const brandOptions = vehicleType === "car" ? carBrands : bikeBrands;

  const sorted = useMemo(() => {
    const list = [...vehicles];
    const priceOr = (v: { priceOnRoad: number }, fallback: number) =>
      v.priceOnRoad > 0 ? v.priceOnRoad : fallback;
    if (sortBy === "price-asc")
      list.sort((a, b) => priceOr(a, Infinity) - priceOr(b, Infinity));
    else if (sortBy === "price-desc")
      list.sort((a, b) => priceOr(b, 0) - priceOr(a, 0));
    else list.sort((a, b) => a.name.en.localeCompare(b.name.en));
    return list;
  }, [vehicles, sortBy]);

  useEffect(() => {
    const pType = (searchParams.get("type") as VehicleType) || "car";
    const pCategory = searchParams.get("category");
    const pFuel = searchParams.get("fuel");
    const pQuery = searchParams.get("q") || "";
    const pBrand = searchParams.get("brand") || "";
    const pPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

    setVehicleType(pType);
    if (isCatalogTab(pCategory)) {
      setCatalogTab(pCategory);
    } else if (pFuel === "electric") {
      setCatalogTab("ev");
    } else if (pType === "bike") {
      setCatalogTab("bike");
    } else {
      setCatalogTab("car");
    }
    setQuery(pQuery);
    setBrand(pBrand);
    setPage(pPage);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [query, brand, catalogTab]);

  function switchType(type: VehicleType) {
    setVehicleType(type);
    setCatalogTab(type === "car" ? "car" : "bike");
    setBrand("");
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">{t("search.title")}</h1>
        <p className="mt-1 text-sm text-ink/50">
          {loading ? "…" : meta ? `${meta.total.toLocaleString()} models` : "0"}{" "}
          {t("search.resultsFound")}
          {meta ? ` · ${meta.brands} brands · ${meta.models.toLocaleString()} total in India` : ""}
        </p>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row">
          <aside className="w-full shrink-0 space-y-4 lg:w-64">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <h3 className="text-sm font-bold text-ink">{t("search.filters")}</h3>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-ink/50">{t("search.vehicleType")}</label>
                  <div className="mt-1.5 flex gap-1 rounded-lg bg-paper p-1">
                    {(["car", "bike"] as VehicleType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => switchType(type)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold ${
                          vehicleType === type ? "bg-highway text-white" : "text-ink/50"
                        }`}
                      >
                        {type === "car" ? t("nav.cars") : t("nav.bikes")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink/50">Category</label>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(vehicleType === "car"
                      ? (["car", "ev"] as CatalogTab[])
                      : (["bike", "scooter"] as CatalogTab[])
                    ).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCatalogTab(tab)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                          catalogTab === tab ? "bg-highway text-white" : "bg-paper text-ink/60"
                        }`}
                      >
                        {tab === "ev" ? "EVs" : tab === "car" ? "Cars" : tab === "bike" ? "Bikes" : "Scooters"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink/50">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-paper px-2 py-2 text-xs"
                  >
                    <option value="">{t("search.all")} brands</option>
                    {brandOptions.map((b) => (
                      <option key={b.slug} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    vehicleType === "bike"
                      ? t("home.hero.searchPlaceholderBikes")
                      : t("home.hero.searchPlaceholderCars")
                  }
                  className="w-full rounded-xl border border-line bg-surface pl-10 pr-10 py-2.5 text-sm outline-none focus:border-highway transition shadow-sm"
                />
                <span className="absolute left-3.5 top-3 text-ink/40">🔍</span>
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-paper text-xs text-ink/50 hover:bg-line hover:text-ink transition"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm shadow-sm font-medium"
              >
                <option value="name">Name A–Z</option>
                <option value="price-asc">{t("search.sortPriceLow")}</option>
                <option value="price-desc">{t("search.sortPriceHigh")}</option>
              </select>
            </div>

            {/* Quick Popular Searches Strip */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink/60">
              <span className="text-[11px] font-medium text-ink/40">Popular:</span>
              {(vehicleType === "car"
                ? ["Tata Punch", "Maruti Swift", "Hyundai Creta", "Tata Nexon", "Mahindra Thar", "Scorpio N"]
                : ["Royal Enfield Classic 350", "Hero Splendor Plus", "Honda Activa", "Yamaha MT-15", "TVS Raider"]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border border-line bg-paper/60 px-2.5 py-0.5 text-[11px] font-medium text-ink/70 hover:border-highway hover:text-highway hover:bg-surface transition"
                >
                  {s}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-line" />
                ))}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sorted.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}

            {!loading && sorted.length === 0 && (
              <div className="mt-12 rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
                <p className="text-4xl">🔍</p>
                <h3 className="mt-3 font-display text-base font-bold text-ink">No vehicles found</h3>
                <p className="mt-1 text-xs text-ink/50">
                  We couldn&apos;t find any vehicles matching &ldquo;{query}&rdquo;. Try checking the spelling or browse popular models below.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {(vehicleType === "car"
                    ? ["Tata Punch", "Tata Nexon", "Maruti Swift", "Hyundai Creta"]
                    : ["Classic 350", "Splendor", "Activa 6G", "Hunter 350"]
                  ).map((rec) => (
                    <button
                      key={rec}
                      onClick={() => setQuery(rec)}
                      className="rounded-lg border border-highway bg-highway/5 px-3 py-1.5 text-xs font-semibold text-highway hover:bg-highway hover:text-white transition"
                    >
                      Search &ldquo;{rec}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-ink/50">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

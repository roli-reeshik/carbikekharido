"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { CITIES } from "@/lib/homeContent";
import { DEMO_VEHICLES, Vehicle, VehicleCondition, VehicleType, formatLakh } from "@/lib/vehicles";
import { VehiclePhoto } from "./VehiclePhoto";
import { HeroShowcase } from "./HeroShowcase";

interface Props {
  vehicleType: VehicleType;
  onVehicleTypeChange: (type: VehicleType) => void;
  condition: VehicleCondition;
  onConditionChange: (condition: VehicleCondition) => void;
  vehicles: Vehicle[];
}

interface QuickPick {
  label: string;
  icon: string;
  href: string;
}

/**
 * Quick picks only link to filters the catalog can actually apply today:
 * `category` and `brand`. There is deliberately no budget or transmission
 * chip — the catalog index carries neither, so those would return nothing.
 */
function quickPicks(type: VehicleType): QuickPick[] {
  return type === "car"
    ? [
        { label: "All cars", icon: "🚗", href: "/search?type=car&category=car" },
        { label: "Electric", icon: "⚡", href: "/search?type=car&category=ev" },
        { label: "Maruti", icon: "◆", href: "/search?type=car&brand=maruti" },
        { label: "Tata", icon: "◆", href: "/search?type=car&brand=tata" },
        { label: "Hyundai", icon: "◆", href: "/search?type=car&brand=hyundai" },
      ]
    : [
        { label: "All bikes", icon: "🏍️", href: "/search?type=bike&category=bike" },
        { label: "Scooters", icon: "🛵", href: "/search?type=bike&category=scooter" },
        { label: "Royal Enfield", icon: "◆", href: "/search?type=bike&brand=royal-enfield" },
        { label: "Honda", icon: "◆", href: "/search?type=bike&brand=honda" },
        { label: "TVS", icon: "◆", href: "/search?type=bike&brand=tvs" },
      ];
}

const TOOLS = [
  { label: "Rider Fit", icon: "📐", href: "/rider-fit", blurb: "Bikes that fit your body" },
  { label: "Running Cost", icon: "💰", href: "/ownership-cost", blurb: "True cost per km" },
  { label: "EMI", icon: "🧮", href: "/emi-calculator", blurb: "Monthly instalment" },
];

function popularity(v: Vehicle): number {
  return (v.reviewCount ?? 0) * (v.rating ?? 0);
}

export function Hero({
  vehicleType,
  onVehicleTypeChange,
  condition,
  onConditionChange,
  vehicles,
}: Props) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [city, setCity] = useState(CITIES[0]);
  const [query, setQuery] = useState("");

  const pool = useMemo(
    () => vehicles.filter((v) => v.type === vehicleType && v.condition === "new"),
    [vehicles, vehicleType]
  );

  /**
   * The catalog feed is an alphabetical page of scraped models carrying no
   * ratings, so ranking it by popularity ties at zero and leaves alphabetical
   * order — which puts Aston Martins in an Indian "trending" strip. Rank real
   * engagement data when the pool has it, otherwise use the curated set.
   */
  const ranked = useMemo(() => {
    const byPopularity = (a: Vehicle, b: Vehicle) => popularity(b) - popularity(a);
    const rated = pool.filter((v) => (v.rating ?? 0) > 0 && (v.reviewCount ?? 0) > 0);
    if (rated.length >= 4) return [...rated].sort(byPopularity);

    const curated = DEMO_VEHICLES.filter(
      (v) => v.type === vehicleType && v.condition === "new"
    );
    return curated.length ? [...curated].sort(byPopularity) : [...pool].sort(byPopularity);
  }, [pool, vehicleType]);

  /** Bodies are varied deliberately so the rotator reads as a range, not a list. */
  const showcase = useMemo(() => {
    const priced = ranked.filter((v) => v.priceOnRoad > 0);
    const seenBody = new Set<string>();
    const varied: Vehicle[] = [];
    for (const v of priced) {
      if (seenBody.has(v.bodyType)) continue;
      seenBody.add(v.bodyType);
      varied.push(v);
    }
    for (const v of priced) {
      if (varied.length >= 5) break;
      if (!varied.includes(v)) varied.push(v);
    }
    return varied.slice(0, 5);
  }, [ranked]);

  const trending = useMemo(() => ranked.slice(0, 10), [ranked]);

  function handleSearch() {
    const params = new URLSearchParams({ type: vehicleType, condition, city });
    if (query.trim()) params.set("q", query.trim());
    router.push(`/search?${params.toString()}`);
  }

  const picks = quickPicks(vehicleType);

  return (
    <section className="relative">
      {/* ---------------------------------------------------------------- */}
      {/* Cinematic backdrop                                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative overflow-hidden bg-highway-dark pb-32 pt-12 sm:pb-36 sm:pt-16 lg:pb-40">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 520px at 12% 8%, rgba(245,166,35,0.20) 0%, transparent 62%), radial-gradient(900px 480px at 88% 92%, rgba(14,124,123,0.28) 0%, transparent 60%), linear-gradient(160deg, #081828 0%, #0D2137 45%, #10293f 100%)",
          }}
          aria-hidden
        />
        {/* Motorway lane markings, very faint */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 46px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to top, rgba(4,12,20,0.55), transparent)" }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          {/* -------------------- Copy -------------------- */}
          <div className="hero-reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-marigold/25 bg-marigold/10 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-marigold opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-marigold" />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-marigold-light">
                {t("home.hero.eyebrow")}
              </span>
            </span>

            <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]">
              {t("hero.title")}
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[t("home.hero.stat1"), t("home.hero.stat2"), t("home.hero.stat3")].map((s) => (
                <span key={s} className="flex items-center gap-2 text-sm text-white/55">
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4 shrink-0 text-marigold"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* -------------------- Rotating showcase -------------------- */}
          {showcase.length > 0 && (
            <div className="hero-reveal hero-reveal-delay hidden lg:block">
              <HeroShowcase vehicles={showcase} />
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Search panel, overlapping the backdrop                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative z-10 mx-auto -mt-24 max-w-5xl px-4 sm:-mt-28 sm:px-6">
        <div className="rounded-3xl border border-line/60 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
              {t("home.hero.panelTitle")}
            </h2>
            <div className="flex gap-2">
              <div className="flex rounded-xl bg-paper p-1">
                {(["new", "used"] as VehicleCondition[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => onConditionChange(c)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                      condition === c ? "bg-surface text-ink shadow-sm" : "text-ink/45 hover:text-ink/70"
                    }`}
                  >
                    {c === "new" ? t("hero.toggleNew") : t("hero.toggleUsed")}
                  </button>
                ))}
              </div>
              <div className="flex rounded-xl bg-paper p-1">
                {(["car", "bike"] as VehicleType[]).map((ty) => (
                  <button
                    key={ty}
                    onClick={() => onVehicleTypeChange(ty)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                      vehicleType === ty
                        ? ty === "car"
                          ? "bg-highway text-white shadow-sm"
                          : "bg-teal text-white shadow-sm"
                        : "text-ink/45 hover:text-ink/70"
                    }`}
                  >
                    {ty === "car" ? t("hero.toggleCars") : t("hero.toggleBikes")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-48">
              <svg
                viewBox="0 0 20 20"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a5 5 0 00-5 5c0 3.4 4.2 8.5 4.4 8.7a.8.8 0 001.2 0C10.8 15.5 15 10.4 15 7a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"
                  clipRule="evenodd"
                />
              </svg>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full appearance-none rounded-xl border border-line bg-paper py-3 pl-9 pr-8 text-sm font-medium text-ink outline-none transition focus:border-highway focus:ring-2 focus:ring-highway/10"
                aria-label={t("home.hero.citySelectLabel")}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <svg
                viewBox="0 0 20 20"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 104 4 4 4 0 00-4-4zM2 8a6 6 0 1110.9 3.5l4.3 4.3a1 1 0 01-1.4 1.4l-4.3-4.3A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  vehicleType === "bike"
                    ? t("home.hero.searchPlaceholderBikes")
                    : t("home.hero.searchPlaceholderCars")
                }
                className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-highway focus:bg-surface focus:ring-2 focus:ring-highway/10"
              />
            </div>

            <button
              onClick={handleSearch}
              className="btn-primary shrink-0 px-8 py-3 text-sm shadow-md hover:shadow-lg"
            >
              {t("home.hero.searchCta")}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/70 pt-4">
            <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/35">
              {t("home.hero.quickPicks")}
            </span>
            {picks.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink/70 transition hover:-translate-y-0.5 hover:border-highway/40 hover:text-highway hover:shadow-sm"
              >
                <span aria-hidden>{p.icon}</span>
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        {/* -------------------- Tool shortcuts -------------------- */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-3 shadow-card transition hover:-translate-y-0.5 hover:border-teal/35 hover:shadow-card-hover"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-base transition group-hover:bg-teal/15"
                aria-hidden
              >
                {tool.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink group-hover:text-teal">
                  {tool.label}
                </span>
                <span className="block truncate text-xs text-ink/45">{tool.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Trending strip                                                    */}
      {/* ---------------------------------------------------------------- */}
      {trending.length > 0 && (
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <span className="text-coral" aria-hidden>
                ▲
              </span>
              {t("home.hero.trending")}
            </h2>
            <Link
              href={`/search?type=${vehicleType}`}
              className="text-xs font-semibold text-highway hover:underline"
            >
              {t("home.hero.viewAll")} →
            </Link>
          </div>

          <div className="scrollbar-hide -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {trending.map((v) => (
              <Link
                key={v.id}
                href={
                  v.catalogModelId
                    ? `/model?id=${encodeURIComponent(v.catalogModelId)}`
                    : `/search?q=${encodeURIComponent(v.name.en)}`
                }
                className="group w-40 shrink-0 overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card transition hover:-translate-y-1 hover:border-highway/30 hover:shadow-card-hover"
              >
                <div className="overflow-hidden bg-paper">
                  <VehiclePhoto
                    searchTerm={v.name.en}
                    vehicleType={v.type}
                    bodyType={v.bodyType}
                    brand={v.brand}
                    modelName={v.modelName}
                    officialImageUrl={v.officialImageUrl}
                    className="h-24 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold text-ink group-hover:text-highway">
                    {v.name[locale]}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] font-medium text-highway">
                    {v.priceOnRoad > 0 ? formatLakh(v.priceOnRoad) : "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

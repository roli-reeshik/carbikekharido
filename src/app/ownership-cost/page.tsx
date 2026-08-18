"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BikePicker } from "@/components/ownership/BikePicker";
import { CostCard } from "@/components/ownership/CostCard";
import { formatInr } from "@/lib/ownership/format";
import type { BikeSpecSummary } from "@/lib/ownership/service";
import type { OwnershipComparison } from "@/lib/ownership/types";

const MAX_COMPARE = 4;

/** Sensible starting picks: the two best-selling petrol bikes against an EV. */
const DEFAULT_MODELS = [
  "bike-hero-splendor-plus",
  "scooter-honda-activa",
  "bike-ola-electric-s1-pro",
];

export default function OwnershipCostPage() {
  const [modelIds, setModelIds] = useState<string[]>(DEFAULT_MODELS);
  const [kmPerYear, setKmPerYear] = useState(12000);
  const [years, setYears] = useState(5);
  const [petrolPriceInr, setPetrolPriceInr] = useState(102.12);
  const [electricityPriceInr, setElectricityPriceInr] = useState(8);
  const [comprehensive, setComprehensive] = useState(true);

  const [data, setData] = useState<OwnershipComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      kmPerYear: String(kmPerYear),
      years: String(years),
      petrolPriceInr: String(petrolPriceInr),
      electricityPriceInr: String(electricityPriceInr),
      comprehensiveInsurance: String(comprehensive),
    });
    if (modelIds.length) params.set("models", modelIds.join(","));
    else params.set("limit", "10");

    try {
      const res = await fetch(`/api/ownership-cost?${params}`);
      const body = await res.json();
      if (!body.ok) throw new Error(body.error?.message ?? "Could not work out the cost");
      setData(body.data as OwnershipComparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [modelIds, kmPerYear, years, petrolPriceInr, electricityPriceInr, comprehensive]);

  // Debounced so dragging a slider does not fire a request per pixel.
  useEffect(() => {
    const timer = setTimeout(fetchCosts, 300);
    return () => clearTimeout(timer);
  }, [fetchCosts]);

  const results = data?.results ?? [];

  // Bars are scaled against the priciest bike on screen so the columns compare.
  const scaleMaxInr = useMemo(
    () => Math.max(0, ...results.map((r) => r.acquisitionInr + r.runningInr)),
    [results]
  );

  const cheapestId = useMemo(() => {
    if (results.length < 2) return null;
    return results.reduce((best, r) => (r.costPerKmInr < best.costPerKmInr ? r : best)).bike.modelId;
  }, [results]);

  const saving = useMemo(() => {
    if (results.length < 2) return null;
    const sorted = [...results].sort((a, b) => a.totalInr - b.totalInr);
    return {
      cheapest: sorted[0],
      dearest: sorted[sorted.length - 1],
      gap: sorted[sorted.length - 1].totalInr - sorted[0].totalInr,
    };
  }, [results]);

  function addBike(bike: BikeSpecSummary) {
    setModelIds((ids) => (ids.includes(bike.modelId) ? ids : [...ids, bike.modelId]));
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            What will it actually cost you?
          </h1>
          <p className="mt-2 text-ink/60">
            The sticker price is the smallest part of what a bike costs. Add fuel or charging,
            servicing, tyres, insurance and what you get back when you sell, and the cheapest bike
            to buy is often not the cheapest to own.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit space-y-6 rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-6">
            <Slider
              label="You ride"
              value={kmPerYear}
              min={1000}
              max={40000}
              step={500}
              onChange={setKmPerYear}
              display={`${kmPerYear.toLocaleString("en-IN")} km/yr`}
            />

            <Slider
              label="You keep it"
              value={years}
              min={1}
              max={12}
              step={1}
              onChange={setYears}
              display={`${years} year${years > 1 ? "s" : ""}`}
            />

            <Slider
              label="Petrol"
              value={petrolPriceInr}
              min={70}
              max={150}
              step={0.5}
              onChange={setPetrolPriceInr}
              display={`₹${petrolPriceInr.toFixed(2)}/l`}
            />

            <Slider
              label="Electricity"
              value={electricityPriceInr}
              min={2}
              max={20}
              step={0.5}
              onChange={setElectricityPriceInr}
              display={`₹${electricityPriceInr.toFixed(2)}/unit`}
            />

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={comprehensive}
                onChange={(e) => setComprehensive(e.target.checked)}
                className="mt-0.5 accent-teal"
              />
              <span>
                <span className="font-medium text-ink/80">Comprehensive insurance</span>
                <span className="mt-0.5 block text-xs text-ink/45">
                  Uncheck for the legal minimum third-party cover only.
                </span>
              </span>
            </label>

            <div className="border-t border-line pt-5">
              <span className="mb-2 block text-sm font-medium text-ink/70">Compare bikes</span>
              <BikePicker onPick={addBike} disabled={modelIds.length >= MAX_COMPARE} />
              {modelIds.length === 0 ? (
                <p className="mt-2 text-xs text-ink/45">
                  Nothing selected — showing the cheapest bikes to own at this usage.
                </p>
              ) : null}
            </div>
          </aside>

          <section>
            {error ? (
              <div className="rounded-3xl border border-coral/30 bg-coral/5 p-6 text-coral">
                {error}
              </div>
            ) : null}

            {saving && saving.gap > 0 ? (
              <div className="mb-4 rounded-3xl border border-teal/30 bg-teal/5 p-5">
                <p className="text-sm text-ink/80">
                  Over {years} year{years > 1 ? "s" : ""} at{" "}
                  {kmPerYear.toLocaleString("en-IN")} km a year, the{" "}
                  <strong className="font-semibold">{saving.cheapest.bike.modelName}</strong> costs{" "}
                  <strong className="font-semibold text-teal">{formatInr(saving.gap)}</strong> less
                  to own than the {saving.dearest.bike.modelName}
                  {saving.cheapest.bike.exShowroomInr > saving.dearest.bike.exShowroomInr
                    ? " — despite being the more expensive one to buy."
                    : "."}
                </p>
              </div>
            ) : null}

            {data ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-ink/60">
                    {modelIds.length
                      ? `Comparing ${results.length} bike${results.length === 1 ? "" : "s"}`
                      : "Cheapest bikes to own at this usage"}
                  </p>
                  {loading ? <span className="text-xs text-ink/40">Updating…</span> : null}
                </div>

                <div className="mt-4 space-y-4">
                  {results.map((cost) => (
                    <CostCard
                      key={cost.bike.modelId}
                      cost={cost}
                      scaleMaxInr={scaleMaxInr}
                      cheapest={cost.bike.modelId === cheapestId}
                      onRemove={
                        modelIds.length
                          ? () =>
                              setModelIds((ids) => ids.filter((id) => id !== cost.bike.modelId))
                          : undefined
                      }
                    />
                  ))}
                </div>

                {data.skipped.length ? (
                  <ul className="mt-4 space-y-1 text-xs text-ink/45">
                    {data.skipped.map((s) => (
                      <li key={s.modelId}>· {s.reason}</li>
                    ))}
                  </ul>
                ) : null}

                <footer className="mt-6 rounded-3xl border border-line bg-line/20 p-5 text-xs text-ink/50">
                  <p className="font-semibold text-ink/70">Where these numbers come from</p>
                  <ul className="mt-2 space-y-1">
                    <li>
                      · Third-party insurance premiums are the statutory rates set by the Motor
                      Vehicles (Third Party Insurance) Rules, and are the same at every insurer.
                    </li>
                    <li>
                      · Insured value follows the IRDAI depreciation schedule. Resale is a separate
                      estimate from a standard depreciation curve, not from sale records.
                    </li>
                    <li>
                      · Servicing, tyres and battery replacement are market estimates at authorised
                      centres. A local mechanic will cost less.
                    </li>
                    <li>· Rates last reviewed {data.ratesCheckedOn}.</li>
                  </ul>
                </footer>
              </>
            ) : (
              <div className="rounded-3xl border border-line bg-surface p-8 text-ink/50">
                Working out the cost…
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-ink/70">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-ink">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-teal"
        aria-label={label}
      />
    </div>
  );
}

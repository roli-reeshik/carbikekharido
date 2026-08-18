"use client";

import { CityAutocomplete } from "@/components/buy/CityAutocomplete";
import { DualRangeSlider } from "@/components/buy/DualRangeSlider";
import {
  MILEAGE_MAX,
  MILEAGE_MIN,
  PRICE_MAX,
  PRICE_MIN,
  YEAR_MAX,
  YEAR_MIN,
} from "@/lib/buy/constants";
import { AGGREGATED_SOURCES, AGGREGATED_SORT_OPTIONS } from "@/lib/aggregated/constants";
import type { AggregatedSearchFilters, AggregatedSource } from "@/lib/aggregated/types";

interface AggregatedFiltersSidebarProps {
  draft: AggregatedSearchFilters;
  appliedCount: number;
  onDraftChange: (next: AggregatedSearchFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function AggregatedFiltersSidebar({
  draft,
  appliedCount,
  onDraftChange,
  onApply,
  onClear,
}: AggregatedFiltersSidebarProps) {
  function toggleSource(source: AggregatedSource) {
    const next = draft.sources.includes(source)
      ? draft.sources.filter((s) => s !== source)
      : [...draft.sources, source];
    onDraftChange({ ...draft, sources: next });
  }

  function toggleType(type: "CAR" | "BIKE") {
    const has = draft.types.includes(type);
    const next = has ? draft.types.filter((t) => t !== type) : [...draft.types, type];
    onDraftChange({ ...draft, types: next.length ? next : draft.types });
  }

  return (
    <aside className="space-y-5 rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink/70">Filters</h2>
        {appliedCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-sell-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Search</label>
        <input
          type="search"
          value={draft.q}
          onChange={(e) => onDraftChange({ ...draft, q: e.target.value })}
          placeholder="Brand, model, keyword…"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sell-accent"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">City</label>
        <CityAutocomplete
          value={draft.city}
          onChange={(city) => onDraftChange({ ...draft, city })}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Price range</p>
        <DualRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={50_000}
          valueMin={draft.priceMin}
          valueMax={draft.priceMax}
          onChange={(priceMin, priceMax) => onDraftChange({ ...draft, priceMin, priceMax })}
          formatLabel={(v) => `₹${(v / 100_000).toFixed(1)}L`}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Vehicle type</p>
        <div className="flex flex-wrap gap-2">
          {(["CAR", "BIKE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                draft.types.includes(t) ? "bg-sell-primary text-white" : "bg-paper text-ink/60"
              }`}
            >
              {t === "CAR" ? "Cars" : "Bikes"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Source</p>
        <div className="flex flex-wrap gap-2">
          {AGGREGATED_SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleSource(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                draft.sources.includes(s.value) ? "bg-ink text-white" : "bg-paper text-ink/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-line bg-paper/50 p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.merge}
            onChange={(e) => onDraftChange({ ...draft, merge: e.target.checked, aggregatedOnly: e.target.checked ? false : draft.aggregatedOnly })}
            className="rounded border-line"
          />
          Include CarBikeKharido listings
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.aggregatedOnly}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                aggregatedOnly: e.target.checked,
                merge: e.target.checked ? false : draft.merge,
              })
            }
            className="rounded border-line"
          />
          Aggregated sources only
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Year</p>
        <DualRangeSlider
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          valueMin={draft.yearMin}
          valueMax={draft.yearMax}
          onChange={(yearMin, yearMax) => onDraftChange({ ...draft, yearMin, yearMax })}
          formatLabel={(v) => String(v)}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Mileage (km)</p>
        <DualRangeSlider
          min={MILEAGE_MIN}
          max={MILEAGE_MAX}
          step={5000}
          valueMin={draft.mileageMin}
          valueMax={draft.mileageMax}
          onChange={(mileageMin, mileageMax) => onDraftChange({ ...draft, mileageMin, mileageMax })}
          formatLabel={(v) => `${Math.round(v / 1000)}K`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Sort</label>
        <select
          value={draft.sort}
          onChange={(e) => onDraftChange({ ...draft, sort: e.target.value as AggregatedSearchFilters["sort"] })}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-sell-accent"
        >
          {AGGREGATED_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={onApply} className="btn-buy-primary w-full">
        Apply filters
      </button>
    </aside>
  );
}

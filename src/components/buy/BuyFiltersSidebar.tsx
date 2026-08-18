"use client";

import {
  BODY_TYPE_BIKE,
  BODY_TYPE_CAR,
  CONDITION_OPTIONS,
  FUEL_OPTIONS,
  MILEAGE_MAX,
  MILEAGE_MIN,
  OWNER_TYPE_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  SELLER_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  YEAR_MAX,
  YEAR_MIN,
} from "@/lib/buy/constants";
import { formatPriceLakhs } from "@/lib/buy/format";
import { BuySearchFilters } from "@/lib/buy/types";
import { CityAutocomplete } from "./CityAutocomplete";
import { DualRangeSlider } from "./DualRangeSlider";

interface BuyFiltersSidebarProps {
  draft: BuySearchFilters;
  appliedCount: number;
  onDraftChange: (next: BuySearchFilters) => void;
  onApply: () => void;
  onClear: () => void;
  compact?: boolean;
}

function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">{label}</legend>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
              className="h-4 w-4 rounded border-line text-sell-accent focus:ring-sell-accent/30"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toggleArr(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function BuyFiltersSidebar({
  draft,
  appliedCount,
  onDraftChange,
  onApply,
  onClear,
  compact = false,
}: BuyFiltersSidebarProps) {
  const bodyOptions = [
    ...(draft.types.includes("CAR") || draft.types.length === 2 ? BODY_TYPE_CAR : []),
    ...(draft.types.includes("BIKE") || draft.types.length === 2 ? BODY_TYPE_BIKE : []),
  ].map((b) => ({ value: b, label: b }));

  const uniqueBody = bodyOptions.filter((b, i, a) => a.findIndex((x) => x.value === b.value) === i);

  function patch(partial: Partial<BuySearchFilters>) {
    onDraftChange({ ...draft, ...partial });
  }

  function toggleType(type: "CAR" | "BIKE") {
    const has = draft.types.includes(type);
    let next = has ? draft.types.filter((t) => t !== type) : [...draft.types, type];
    if (next.length === 0) next = [type === "CAR" ? "BIKE" : "CAR"];
    patch({ types: next });
  }

  return (
    <aside className={`buy-filters ${compact ? "buy-filters-compact" : ""}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">Filters</h2>
        {appliedCount > 0 && (
          <span className="rounded-full bg-sell-accent/15 px-2.5 py-0.5 text-xs font-bold text-sell-accent">
            {appliedCount} applied
          </span>
        )}
      </div>

      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">Vehicle type</legend>
          <div className="flex gap-2">
            {(["CAR", "BIKE"] as const).map((type) => (
              <label
                key={type}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition ${
                  draft.types.includes(type)
                    ? "border-sell-primary bg-sell-primary/10 text-sell-primary"
                    : "border-line text-ink/60"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={draft.types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type === "CAR" ? "🚗 Car" : "🏍️ Bike"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">Price range</p>
          <DualRangeSlider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50_000}
            valueMin={draft.priceMin}
            valueMax={draft.priceMax}
            formatLabel={formatPriceLakhs}
            onChange={(priceMin, priceMax) => patch({ priceMin, priceMax })}
          />
        </div>

        <CheckboxGroup
          label="Fuel type"
          options={FUEL_OPTIONS}
          selected={draft.fuel}
          onToggle={(v) => patch({ fuel: toggleArr(draft.fuel, v) })}
        />

        <CheckboxGroup
          label="Transmission"
          options={TRANSMISSION_OPTIONS}
          selected={draft.transmission}
          onToggle={(v) => patch({ transmission: toggleArr(draft.transmission, v) })}
        />

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">Year range</p>
          <DualRangeSlider
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={1}
            valueMin={draft.yearMin}
            valueMax={draft.yearMax}
            onChange={(yearMin, yearMax) => patch({ yearMin, yearMax })}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">Mileage (km)</p>
          <DualRangeSlider
            min={MILEAGE_MIN}
            max={MILEAGE_MAX}
            step={5000}
            valueMin={draft.mileageMin}
            valueMax={draft.mileageMax}
            formatLabel={(v) => `${(v / 1000).toFixed(0)}K`}
            onChange={(mileageMin, mileageMax) => patch({ mileageMin, mileageMax })}
          />
        </div>

        {uniqueBody.length > 0 && (
          <CheckboxGroup
            label="Body type"
            options={uniqueBody}
            selected={draft.bodyType}
            onToggle={(v) => patch({ bodyType: toggleArr(draft.bodyType, v) })}
          />
        )}

        <CheckboxGroup
          label="Owner type"
          options={OWNER_TYPE_OPTIONS}
          selected={draft.ownerType}
          onToggle={(v) => patch({ ownerType: toggleArr(draft.ownerType, v) })}
        />

        <CheckboxGroup
          label="Condition"
          options={CONDITION_OPTIONS}
          selected={draft.condition}
          onToggle={(v) => patch({ condition: toggleArr(draft.condition, v) })}
        />

        <CheckboxGroup
          label="Seller type"
          options={SELLER_TYPE_OPTIONS}
          selected={draft.sellerType}
          onToggle={(v) => patch({ sellerType: toggleArr(draft.sellerType, v) })}
        />

        <div>
          <label htmlFor="filter-city" className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink/45">
            City
          </label>
          <CityAutocomplete
            id="filter-city"
            value={draft.city}
            onChange={(city) => patch({ city })}
            placeholder="Search city…"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onApply} className="btn-buy-primary flex-1">
          Apply
        </button>
        <button type="button" onClick={onClear} className="btn-buy-ghost flex-1">
          Clear
        </button>
      </div>
    </aside>
  );
}

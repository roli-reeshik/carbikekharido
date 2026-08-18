"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { DEMO_VEHICLES, Vehicle, formatLakh } from "@/lib/vehicles";
import { VehiclePhoto } from "@/components/home/VehiclePhoto";

const MAX_COMPARE = 4;

const DEFAULT_CAR_PICKS = [
  DEMO_VEHICLES.find((v) => v.id === "car-tata-nexon") || DEMO_VEHICLES[0],
  DEMO_VEHICLES.find((v) => v.id === "car-maruti-brezza") || DEMO_VEHICLES[1],
].filter(Boolean) as Vehicle[];

function CompareContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const v1Param = searchParams.get("v1");
  const v2Param = searchParams.get("v2");

  const [selected, setSelected] = useState<Vehicle[]>(DEFAULT_CAR_PICKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"car" | "bike">("car");

  useEffect(() => {
    if (v1Param || v2Param) {
      const picks: Vehicle[] = [];
      if (v1Param) {
        const found = DEMO_VEHICLES.find((v) => v.id === v1Param || v.catalogModelId === v1Param);
        if (found) picks.push(found);
      }
      if (v2Param) {
        const found = DEMO_VEHICLES.find((v) => v.id === v2Param || v.catalogModelId === v2Param);
        if (found) picks.push(found);
      }
      if (picks.length > 0) {
        setSelected(picks);
        if (picks[0]?.type) setFilterType(picks[0].type);
      }
    }
  }, [v1Param, v2Param]);

  const available = DEMO_VEHICLES.filter(
    (v) =>
      v.type === filterType &&
      !selected.find((s) => s.id === v.id) &&
      (searchQuery === "" ||
        v.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.brand?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function addVehicle(vehicle: Vehicle) {
    if (selected.length < MAX_COMPARE) {
      setSelected([...selected, vehicle]);
    }
  }

  function removeVehicle(id: string) {
    if (selected.length > 1) {
      setSelected(selected.filter((v) => v.id !== id));
    }
  }

  const specRows = [
    {
      label: t("compare.priceOnRoad"),
      getValue: (v: Vehicle) => (v.priceOnRoad > 0 ? formatLakh(v.priceOnRoad) : "Price on Request"),
    },
    {
      label: t("compare.fuelType"),
      getValue: (v: Vehicle) => v.fuelType?.toUpperCase() || (v.isElectric ? "ELECTRIC" : "PETROL"),
    },
    {
      label: t("compare.mileage"),
      getValue: (v: Vehicle) => v.mileage || v.spec[locale] || "—",
    },
    {
      label: t("compare.bodyType"),
      getValue: (v: Vehicle) => v.bodyType.toUpperCase(),
    },
    {
      label: t("compare.condition"),
      getValue: (v: Vehicle) => (v.condition === "new" ? t("search.new") : t("search.used")),
    },
    {
      label: t("compare.city"),
      getValue: (v: Vehicle) => v.city,
    },
  ];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">{t("compare.title")}</h1>
            <p className="mt-1 text-sm text-ink/50">{t("compare.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilterType("car");
                setSelected(DEFAULT_CAR_PICKS);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filterType === "car" ? "bg-highway text-white" : "border border-line bg-surface text-ink hover:bg-paper"
              }`}
            >
              {t("nav.cars")}
            </button>
            <button
              onClick={() => {
                setFilterType("bike");
                const bikePicks = DEMO_VEHICLES.filter((v) => v.type === "bike").slice(0, 2);
                setSelected(bikePicks);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filterType === "bike" ? "bg-highway text-white" : "border border-line bg-surface text-ink hover:bg-paper"
              }`}
            >
              {t("nav.bikes")}
            </button>
          </div>
        </div>

        {/* Vehicles Grid Header */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {selected.map((vehicle) => (
            <div key={vehicle.id} className="relative rounded-2xl border border-line bg-surface p-4 shadow-sm">
              {selected.length > 1 && (
                <button
                  onClick={() => removeVehicle(vehicle.id)}
                  className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-ink/40 hover:bg-line hover:text-ink"
                  title="Remove vehicle"
                >
                  ✕
                </button>
              )}
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-paper">
                <VehiclePhoto vehicle={vehicle} />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-ink">{vehicle.name[locale]}</h3>
              <p className="font-mono text-sm font-bold text-marigold-dark">
                {vehicle.priceOnRoad > 0 ? formatLakh(vehicle.priceOnRoad) : "Price on Request"}
              </p>
            </div>
          ))}

          {/* Add Slot if less than 4 */}
          {selected.length < MAX_COMPARE && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-paper/50 p-6 text-center">
              <span className="text-2xl text-ink/30">+</span>
              <p className="mt-1 text-xs font-medium text-ink/50">{t("compare.addVehicle")}</p>
            </div>
          )}
        </div>

        {/* Comparison Specs Table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-line">
              {specRows.map((row) => (
                <tr key={row.label} className="hover:bg-paper/50">
                  <td className="w-1/4 bg-paper px-4 py-3.5 font-medium text-ink/70 sm:px-6">{row.label}</td>
                  {selected.map((vehicle) => (
                    <td key={vehicle.id} className="px-4 py-3.5 font-mono text-sm font-semibold text-ink sm:px-6">
                      {row.getValue(vehicle)}
                    </td>
                  ))}
                  {Array.from({ length: MAX_COMPARE - selected.length }).map((_, i) => (
                    <td key={i} className="px-4 py-3.5 text-center text-xs text-ink/20">
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Available to Add Selector */}
        {selected.length < MAX_COMPARE && (
          <div className="mt-10 rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-ink">{t("compare.selectMore")}</h2>
            <div className="mt-4 flex gap-4">
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md rounded-xl border border-line bg-paper px-4 py-2 text-sm outline-none focus:border-highway"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {available.slice(0, 12).map((v) => (
                <button
                  key={v.id}
                  onClick={() => addVehicle(v)}
                  className="flex flex-col items-center rounded-xl border border-line bg-paper p-2.5 text-center transition hover:border-highway hover:bg-surface hover:shadow-sm"
                >
                  <span className="line-clamp-1 text-xs font-bold text-ink">{v.name[locale]}</span>
                  <span className="font-mono text-[11px] text-marigold-dark">
                    {v.priceOnRoad > 0 ? formatLakh(v.priceOnRoad) : "Specs"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-ink/50">Loading comparison tool…</div>}>
      <CompareContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
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

export default function ComparePage() {
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
    setSelected(selected.filter((v) => v.id !== id));
  }

  const specRows = [
    { key: "price", label: t("compare.price") },
    { key: "fuel", label: t("compare.fuel") },
    { key: "mileage", label: t("compare.mileage") },
    { key: "engine", label: "Engine / Power" },
    { key: "rating", label: t("compare.rating") },
    { key: "safety", label: "Safety Rating" },
    { key: "body", label: t("compare.bodyType") },
  ];

  function getSpecValue(vehicle: Vehicle, key: string): string {
    switch (key) {
      case "price":
        return vehicle.priceRangeMax
          ? `${formatLakh(vehicle.priceOnRoad)} - ${formatLakh(vehicle.priceRangeMax)}`
          : formatLakh(vehicle.priceOnRoad);
      case "fuel":
        return vehicle.fuelType ? vehicle.fuelType.toUpperCase() : "Petrol / Diesel";
      case "mileage":
        return vehicle.mileage || (vehicle.type === "bike" ? "45 kmpl" : "18.5 kmpl");
      case "engine":
        return vehicle.spec ? vehicle.spec[locale] || vehicle.spec.en : "1199 cc · 120 PS";
      case "rating":
        return vehicle.rating ? `★ ${vehicle.rating}` : "★ 4.6 (864 reviews)";
      case "safety":
        return vehicle.type === "car" ? "5 Star (Global NCAP)" : "Dual Channel ABS";
      case "body":
        return vehicle.bodyType ? vehicle.bodyType.toUpperCase() : "SUV";
      default:
        return "—";
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">{t("compare.title")}</h1>
            <p className="mt-1 text-sm text-ink/50">{t("compare.subtitle")}</p>
          </div>

          <div className="flex rounded-xl bg-paper p-1 border border-line">
            <button
              onClick={() => {
                setFilterType("car");
                const carPicks = DEMO_VEHICLES.filter((v) => v.type === "car").slice(0, 2);
                if (carPicks.length > 0) setSelected(carPicks);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === "car" ? "bg-highway text-white shadow-sm" : "text-ink/60"
              }`}
            >
              Compare Cars
            </button>
            <button
              onClick={() => {
                setFilterType("bike");
                const bikePicks = DEMO_VEHICLES.filter((v) => v.type === "bike").slice(0, 2);
                if (bikePicks.length > 0) setSelected(bikePicks);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === "bike" ? "bg-highway text-white shadow-sm" : "text-ink/60"
              }`}
            >
              Compare Bikes
            </button>
          </div>
        </div>

        {/* Selected Vehicles Cards Header */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {selected.map((vehicle) => (
            <div key={vehicle.id} className="card w-56 shrink-0 p-4 relative group">
              <button
                onClick={() => removeVehicle(vehicle.id)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-xs text-ink/40 hover:bg-coral/10 hover:text-coral transition"
                title="Remove from comparison"
              >
                ✕
              </button>
              <VehiclePhoto
                searchTerm={vehicle.name.en}
                vehicleType={vehicle.type}
                bodyType={vehicle.bodyType}
                brand={vehicle.brand}
                modelName={vehicle.modelName}
                officialImageUrl={vehicle.officialImageUrl}
                className="h-28 w-full rounded-xl object-cover"
              />
              <p className="mt-3 text-sm font-bold text-ink truncate">{vehicle.name[locale]}</p>
              <p className="font-mono text-xs font-bold text-highway">{formatLakh(vehicle.priceOnRoad)}</p>
            </div>
          ))}
          {selected.length < MAX_COMPARE && (
            <div className="flex h-44 w-56 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-line text-xs font-semibold text-ink/40 p-4 text-center">
              + {t("compare.addVehicle")} (Up to {MAX_COMPARE})
            </div>
          )}
        </div>

        {/* Comparison Matrix Table */}
        {selected.length >= 2 && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
            <table className="w-full min-w-[640px] text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60">
                  <th className="p-4 text-left font-bold uppercase tracking-wider text-ink/50 w-44">
                    Specification
                  </th>
                  {selected.map((v) => (
                    <th key={v.id} className="p-4 text-left font-display font-bold text-ink">
                      {v.name[locale]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {specRows.map((row) => (
                  <tr key={row.key} className="hover:bg-paper/40 transition">
                    <td className="p-4 font-semibold text-ink/60">{row.label}</td>
                    {selected.map((v) => (
                      <td key={v.id} className="p-4 font-medium text-ink">
                        {getSpecValue(v, row.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add more vehicles section */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
            <h2 className="font-display text-lg font-bold text-ink">
              Add more {filterType === "car" ? "Cars" : "Bikes"} to compare
            </h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${filterType === "car" ? "cars" : "bikes"} (e.g. Swift, Nexon, Thar...)`}
              className="w-full max-w-xs rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-highway shadow-sm"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {available.slice(0, 8).map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => addVehicle(vehicle)}
                disabled={selected.length >= MAX_COMPARE}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:shadow-card hover:border-highway disabled:opacity-40"
              >
                <VehiclePhoto
                  searchTerm={vehicle.name.en}
                  vehicleType={vehicle.type}
                  bodyType={vehicle.bodyType}
                  brand={vehicle.brand}
                  modelName={vehicle.modelName}
                  officialImageUrl={vehicle.officialImageUrl}
                  className="h-14 w-20 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink truncate">{vehicle.name[locale]}</p>
                  <p className="font-mono text-[11px] font-semibold text-highway">{formatLakh(vehicle.priceOnRoad)}</p>
                  <span className="text-[10px] font-bold text-highway mt-0.5 inline-block">+ Add to Compare</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

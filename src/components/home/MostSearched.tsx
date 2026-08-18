"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BODY_TYPES, Vehicle, VehicleCondition, VehicleType, formatLakh } from "@/lib/vehicles";
import { VehiclePhoto } from "./VehiclePhoto";

const POPULAR_WEIGHTS: Record<string, number> = {
  // SUVs
  "nexon": 100,
  "creta": 99,
  "thar": 98,
  "brezza": 97,
  "scorpio": 96,
  "xuv700": 95,
  "punch": 94,
  "seltos": 93,
  "fortuner": 92,
  "harrier": 91,
  "safari": 90,
  "sonet": 89,
  // Hatchbacks
  "swift": 100,
  "baleno": 99,
  "tiago": 98,
  "altroz": 97,
  "i20": 96,
  "wagon-r": 95,
  "fronx": 94,
  // Sedans
  "city": 100,
  "verna": 99,
  "dzire": 98,
  "slavia": 97,
  "virtus": 96,
  "amaze": 95,
  "ciaz": 94,
  // MUVs
  "innova": 100,
  "ertiga": 99,
  "carens": 98,
  "xl6": 97,
  // Luxury
  "bmw": 95,
  "mercedes": 94,
  "audi": 93,
  "porsche": 92,
  "land-rover": 91,
  // Bikes & Two-Wheelers
  "himalayan": 100,
  "classic-350": 99,
  "activa": 98,
  "pulsar": 97,
  "apache": 96,
  "r15": 95,
  "duke": 94,
  "ola": 93,
  "splendor": 92,
  "mt-15": 91,
  "ather": 90,
  "hunter": 89,
  "speed-400": 88,
};

function getPopularityScore(v: Vehicle): number {
  const s = `${v.brand || ""} ${v.modelName || ""} ${v.name.en}`.toLowerCase().replace(/[^a-z0-9]/g, "-");
  for (const [key, weight] of Object.entries(POPULAR_WEIGHTS)) {
    if (s.includes(key)) return weight;
  }
  return (v.rating || 4.0) * 10;
}

export function MostSearched({
  vehicles,
  activeType,
  condition,
}: {
  vehicles: Vehicle[];
  activeType: VehicleType;
  condition: VehicleCondition;
}) {
  const { locale, t } = useLanguage();
  const bodyTypesForType = BODY_TYPES.filter((b) => b.vehicleType === activeType);
  const [activeBodyType, setActiveBodyType] = useState(bodyTypesForType[0]?.id);

  const filtered = vehicles.filter(
    (v) => v.type === activeType && v.bodyType === activeBodyType && v.condition === condition
  );

  const sorted = [...filtered].sort((a, b) => getPopularityScore(b) - getPopularityScore(a)).slice(0, 12);

  return (
    <section>
      <h2 className="section-title">{t("home.mostSearched.title")}</h2>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-paper p-1 scrollbar-hide">
        {bodyTypesForType.map((bt) => (
          <button
            key={bt.id}
            onClick={() => setActiveBodyType(bt.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeBodyType === bt.id
                ? "bg-surface text-highway shadow-sm"
                : "text-ink/50 hover:text-ink/80"
            }`}
          >
            {bt.icon} {bt.label[locale]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((vehicle) => (
          <Link
            key={vehicle.id}
            href={
              vehicle.catalogModelId
                ? `/model?id=${encodeURIComponent(vehicle.catalogModelId)}`
                : vehicle.brand && vehicle.modelName && vehicle.variantName
                  ? `/vehicle?brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(vehicle.modelName)}&variant=${encodeURIComponent(vehicle.variantName)}`
                  : `/search?q=${encodeURIComponent(vehicle.name.en)}`
            }
            className="card group"
          >
            <div className="aspect-[16/10] overflow-hidden bg-paper">
              <VehiclePhoto
                searchTerm={vehicle.name.en}
                vehicleType={vehicle.type}
                bodyType={vehicle.bodyType}
                brand={vehicle.brand}
                modelName={vehicle.modelName}
                officialImageUrl={vehicle.officialImageUrl}
                className="h-full w-full object-cover sm:h-36"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold leading-snug text-ink group-hover:text-highway">
                {vehicle.name[locale]}
              </p>
              <p className="mt-1 font-mono text-xs font-medium text-highway">
                {vehicle.priceOnRoad > 0
                  ? `${formatLakh(vehicle.priceOnRoad)}${vehicle.priceRangeMax ? ` - ${formatLakh(vehicle.priceRangeMax)}` : ""}`
                  : "Price on request"}
              </p>
              {vehicle.rating && (
                <p className="mt-1 text-[10px] text-ink/50">
                  ★ {vehicle.rating} ({vehicle.reviewCount?.toLocaleString()})
                </p>
              )}
            </div>
          </Link>
        ))}
        {sorted.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-ink/40">{t("home.mostSearched.empty")}</p>
        )}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BODY_TYPES, Vehicle, VehicleCondition, VehicleType, formatLakh } from "@/lib/vehicles";
import { VehiclePhoto } from "./VehiclePhoto";

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
        {filtered.map((vehicle) => (
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
            <VehiclePhoto
              searchTerm={vehicle.name.en}
              vehicleType={vehicle.type}
              bodyType={vehicle.bodyType}
              brand={vehicle.brand}
              modelName={vehicle.modelName}
              officialImageUrl={vehicle.officialImageUrl}
              className="h-28 w-full object-cover sm:h-32"
            />
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
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-ink/40">{t("home.mostSearched.empty")}</p>
        )}
      </div>
    </section>
  );
}

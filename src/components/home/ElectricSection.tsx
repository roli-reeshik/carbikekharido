"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Vehicle } from "@/lib/vehicles";
import { VehiclePhoto } from "./VehiclePhoto";
import { formatLakh } from "@/lib/vehicles";

export function ElectricSection({ vehicles }: { vehicles: Vehicle[] }) {
  const { locale, t } = useLanguage();
  const evs = vehicles.filter((v) => v.isElectric);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-dark via-teal to-teal-light p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-end justify-between">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
              ⚡ {t("home.electric.badge")}
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              {t("home.electric.title")}
            </h2>
            <p className="mt-1 text-sm text-white/70">{t("home.electric.subtitle")}</p>
          </div>
          <Link
            href="/search?fuel=electric"
            className="hidden rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 sm:block"
          >
            {t("home.electric.viewAll")} →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {evs.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={
                vehicle.catalogModelId
                  ? `/model?id=${encodeURIComponent(vehicle.catalogModelId)}`
                  : vehicle.brand && vehicle.modelName && vehicle.variantName
                    ? `/vehicle?brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(vehicle.modelName)}&variant=${encodeURIComponent(vehicle.variantName)}`
                    : `/search?q=${encodeURIComponent(vehicle.name.en)}`
              }
              className="group flex gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:bg-white/20"
            >
              <VehiclePhoto
                searchTerm={vehicle.name.en}
                vehicleType={vehicle.type}
                bodyType={vehicle.bodyType}
                brand={vehicle.brand}
                modelName={vehicle.modelName}
                officialImageUrl={vehicle.officialImageUrl}
                className="h-24 w-32 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <p className="font-semibold text-white group-hover:text-marigold-light">
                  {vehicle.name[locale]}
                </p>
                <p className="mt-0.5 text-xs text-white/60">{vehicle.spec[locale]}</p>
                <p className="mt-2 font-mono text-sm font-bold text-marigold-light">
                  {vehicle.priceOnRoad > 0
                    ? `${formatLakh(vehicle.priceOnRoad)}${vehicle.priceRangeMax ? ` - ${formatLakh(vehicle.priceRangeMax)}` : ""}`
                    : "Price on request"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

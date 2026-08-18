"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { UPCOMING_VEHICLES } from "@/lib/homeContent";
import { VehiclePhoto } from "./VehiclePhoto";

export function UpcomingSection() {
  const { locale, t } = useLanguage();

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="section-title">{t("home.upcoming.title")}</h2>
          <p className="section-subtitle">{t("home.upcoming.subtitle")}</p>
        </div>
        <Link
          href="/search?upcoming=true"
          className="hidden text-sm font-semibold text-highway hover:text-marigold sm:block"
        >
          {t("home.upcoming.viewAll")} →
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {UPCOMING_VEHICLES.map((vehicle) => (
          <div
            key={vehicle.id}
            className="card group relative p-5"
          >
            <span className="absolute right-4 top-4 rounded-full bg-marigold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-marigold-dark">
              {t("home.upcoming.soon")}
            </span>
            <div className="overflow-hidden rounded-xl bg-paper">
              <VehiclePhoto
                searchTerm={vehicle.name[locale]}
                vehicleType={vehicle.type}
                bodyType={vehicle.bodyType}
                brand={vehicle.brand}
                modelName={vehicle.modelName}
                officialImageUrl={vehicle.officialImageUrl}
                className="h-28 w-full object-cover sm:h-32"
              />
            </div>
            <p className="mt-4 text-xs font-medium text-ink/50">{vehicle.brand}</p>
            <h3 className="mt-0.5 font-display text-base font-bold text-ink group-hover:text-highway">
              {vehicle.name[locale]}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-ink/50">{vehicle.expectedLaunch}</span>
              <span className="font-mono font-semibold text-highway">{vehicle.expectedPrice[locale]}</span>
            </div>
            <button className="mt-4 w-full rounded-xl border border-line py-2 text-xs font-semibold text-highway transition hover:bg-highway hover:text-white">
              {t("home.upcoming.notify")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

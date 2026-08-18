"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { OFFERS } from "@/lib/homeContent";
import { VehicleType } from "@/lib/vehicles";

interface DbOffer {
  id: string;
  brand: string;
  vehicleName: string;
  title: string;
  description?: string;
  validTill: string;
}

export function OffersSection({ activeType }: { activeType: VehicleType }) {
  const { locale, t } = useLanguage();
  const [dbOffers, setDbOffers] = useState<DbOffer[] | null>(null);

  useEffect(() => {
    fetch(`/api/offers?type=${activeType}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.offers?.length > 0) setDbOffers(data.offers);
      })
      .catch(() => {});
  }, [activeType]);

  const staticOffers = OFFERS.filter((o) => o.type === activeType);
  const useDb = dbOffers && dbOffers.length > 0;

  return (
    <section>
      <h2 className="section-title">{t("home.offers.title")}</h2>
      <p className="section-subtitle">{t("home.offers.subtitle")}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {useDb
          ? dbOffers.map((offer) => (
              <div
                key={offer.id}
                className="group flex items-center gap-4 rounded-2xl border border-coral/20 bg-gradient-to-r from-coral/5 to-marigold/5 p-4 transition hover:shadow-card"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-xl">
                  🏷️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink/50">{offer.brand}</p>
                  <p className="font-display text-sm font-bold text-ink">{offer.vehicleName}</p>
                  <p className="mt-0.5 text-xs font-semibold text-coral">{offer.title}</p>
                </div>
                <button className="shrink-0 rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-coral-light">
                  {t("home.offers.claim")}
                </button>
              </div>
            ))
          : staticOffers.map((offer) => (
              <div
                key={offer.id}
                className="group flex items-center gap-4 rounded-2xl border border-coral/20 bg-gradient-to-r from-coral/5 to-marigold/5 p-4 transition hover:shadow-card"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-xl">
                  🏷️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink/50">{offer.brand}</p>
                  <p className="font-display text-sm font-bold text-ink">{offer.vehicleName[locale]}</p>
                  <p className="mt-0.5 text-xs font-semibold text-coral">{offer.discount[locale]}</p>
                </div>
                <button className="shrink-0 rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-coral-light">
                  {t("home.offers.claim")}
                </button>
              </div>
            ))}
      </div>
    </section>
  );
}

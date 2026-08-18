"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { DEMO_DEALERS } from "@/lib/homeContent";

export function DealerLocator() {
  const { locale, t } = useLanguage();

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-title">{t("home.dealers.title")}</h2>
          <p className="section-subtitle">{t("home.dealers.subtitle")}</p>
        </div>
        <select className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink">
          <option>Lucknow</option>
          <option>Delhi</option>
          <option>Mumbai</option>
          <option>Bengaluru</option>
        </select>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {DEMO_DEALERS.map((dealer) => (
          <div
            key={dealer.id}
            className="flex items-start gap-4 rounded-2xl border border-line/60 bg-paper p-4 transition hover:shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-highway text-sm font-bold text-white">
              {dealer.brand[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink">{dealer.name[locale]}</h3>
              <p className="mt-0.5 text-xs text-ink/50">{dealer.address[locale]}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-medium text-marigold">
                  ★ {dealer.rating}
                </span>
                <button className="text-xs font-semibold text-highway hover:text-teal">
                  {t("home.dealers.call")} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BUDGET_BUCKETS } from "@/lib/homeContent";
import { VehicleType } from "@/lib/vehicles";

export function BudgetExplorer({ activeType }: { activeType: VehicleType }) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const buckets = BUDGET_BUCKETS.filter((b) => b.vehicleType === activeType);

  function handleClick(bucket: (typeof buckets)[0]) {
    const params = new URLSearchParams({ type: activeType });
    if (bucket.minPrice) params.set("minPrice", String(bucket.minPrice));
    if (bucket.maxPrice) params.set("maxPrice", String(bucket.maxPrice));
    if (bucket.fuelType) params.set("fuel", bucket.fuelType);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section>
      <h2 className="section-title">{t("home.budget.title")}</h2>
      <p className="section-subtitle">{t("home.budget.subtitle")}</p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {buckets.map((bucket) => (
          <button
            key={bucket.id}
            onClick={() => handleClick(bucket)}
            className="chip hover:scale-[1.02] active:scale-[0.98]"
          >
            {bucket.label[locale]}
          </button>
        ))}
      </div>
    </section>
  );
}

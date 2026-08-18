"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { BODY_TYPES, BodyType, VehicleType } from "@/lib/vehicles";

function BodyTypeImage({ bodyTypeId, label }: { bodyTypeId: BodyType; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/media/body-type?id=${bodyTypeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { imageUrl?: string } | null) => {
        if (!cancelled) setSrc(data?.imageUrl ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bodyTypeId]);

  if (!src) {
    const icon = BODY_TYPES.find((b) => b.id === bodyTypeId)?.icon ?? "🚗";
    return <span className="text-3xl transition group-hover:scale-110">{icon}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className="h-16 w-full rounded-xl object-cover transition group-hover:scale-105"
      loading="lazy"
    />
  );
}

export function BodyTypeExplorer({ activeType }: { activeType: VehicleType }) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const types = BODY_TYPES.filter((b) => b.vehicleType === activeType);

  return (
    <section>
      <h2 className="section-title">{t("home.bodyType.title")}</h2>
      <p className="section-subtitle">{t("home.bodyType.subtitle")}</p>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-5">
        {types.map((bt) => (
          <button
            key={bt.id}
            onClick={() => router.push(`/search?type=${activeType}&bodyType=${bt.id}`)}
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-line/60 bg-surface p-4 transition hover:border-teal/40 hover:shadow-card"
          >
            <BodyTypeImage bodyTypeId={bt.id} label={bt.label[locale]} />
            <span className="text-xs font-semibold text-ink/80 group-hover:text-highway sm:text-sm">
              {bt.label[locale]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

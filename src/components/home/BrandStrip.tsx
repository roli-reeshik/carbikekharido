"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCatalogBrands } from "@/lib/hooks/useCatalogBrands";
import { getBrandLogo } from "@/lib/brandLogos";

function BrandLogoImage({ slug, name }: { slug: string; name: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    fetch(`/api/media/brand?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { imageUrl?: string } | null) => {
        if (!cancelled) setSrc(data?.imageUrl ?? getBrandLogo(slug) ?? null);
      })
      .catch(() => {
        if (!cancelled) setSrc(getBrandLogo(slug) ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!src || failed) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper text-xs font-bold text-ink/40">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        width={44}
        height={44}
        className="h-full w-full object-contain transition group-hover:scale-110"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function BrandStrip() {
  const { t } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<"car" | "bike">("car");
  const { brands, loading } = useCatalogBrands(tab);

  const visible = brands.slice(0, 24);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">{t("home.brands.title")}</h2>
          <p className="section-subtitle">
            {loading ? "…" : `${brands.length} brands in India`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-paper p-1">
            {(["car", "bike"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTab(type)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${
                  tab === type ? "bg-surface text-highway shadow-sm" : "text-ink/50"
                }`}
              >
                {type === "car" ? "Cars & EVs" : "Bikes & Scooters"}
              </button>
            ))}
          </div>
          <Link href="/search" className="hidden text-sm font-semibold text-highway hover:text-marigold sm:block">
            {t("home.brands.viewAll")} →
          </Link>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12">
        {visible.map((brand) => (
          <button
            key={`${tab}-${brand.slug}`}
            onClick={() => router.push(`/search?type=${tab}&brand=${encodeURIComponent(brand.slug)}`)}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-line/60 bg-surface p-3 text-center transition hover:border-highway/30 hover:shadow-card"
          >
            <BrandLogoImage slug={brand.slug} name={brand.name} />
            <span className="line-clamp-2 text-[10px] font-medium leading-tight text-ink/70 group-hover:text-highway sm:text-[11px]">
              {brand.name}
            </span>
          </button>
        ))}
      </div>
      {brands.length > 24 && (
        <p className="mt-4 text-center text-sm text-ink/50">
          + {brands.length - 24} more brands —{" "}
          <Link href={`/search?type=${tab}`} className="font-semibold text-highway hover:underline">
            browse all
          </Link>
        </p>
      )}
    </section>
  );
}

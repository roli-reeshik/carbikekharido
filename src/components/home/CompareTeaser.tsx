"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function CompareTeaser() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-highway p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-marigold/10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-lg">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {t("home.compareTeaser.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{t("home.compareTeaser.subtitle")}</p>
          <div className="mt-4 flex gap-3">
            {["🚗", "🚙", "🏍️"].map((icon, i) => (
              <div
                key={i}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur"
              >
                {icon}
              </div>
            ))}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-white/20 text-lg text-white/40">
              +
            </div>
          </div>
        </div>
        <Link href="/compare" className="btn-primary shrink-0 px-8 py-3 text-base">
          {t("home.compareTeaser.cta")}
        </Link>
      </div>
    </section>
  );
}

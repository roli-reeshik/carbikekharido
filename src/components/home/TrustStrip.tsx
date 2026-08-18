"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const TRUST_ITEMS = [
  { icon: "🔓", key: "anonymous" },
  { icon: "📋", key: "history" },
  { icon: "🔒", key: "priceLock" },
  { icon: "📞", key: "consent" },
] as const;

export function TrustStrip() {
  const { t } = useLanguage();

  return (
    <section>
      <h2 className="section-title">{t("home.trust.title")}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-line/60 bg-surface p-5 transition hover:shadow-card"
          >
            <span className="text-2xl">{item.icon}</span>
            <h3 className="mt-3 font-display text-sm font-bold text-ink">
              {t(`home.trust.items.${item.key}.title`)}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              {t(`home.trust.items.${item.key}.desc`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { AD_CREATIVES } from "@/lib/adCreatives";

const ROTATE_INTERVAL_MS = 6000;

export function AdBanner() {
  const { locale } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % AD_CREATIVES.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const creative = AD_CREATIVES[index];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-line/60 p-6 sm:p-8 transition-colors"
      style={{ background: `linear-gradient(135deg, ${creative.accent}12 0%, ${creative.accent}06 100%)` }}
    >
      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/40 shadow-sm">
        Sponsored
      </span>

      <div className="max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: creative.accent }}>
          {creative.advertiserName}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">
          {creative.headline[locale]}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{creative.subtext[locale]}</p>

        <button
          className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          style={{ backgroundColor: creative.accent }}
        >
          {creative.ctaLabel[locale]}
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        {AD_CREATIVES.map((c, i) => (
          <button
            key={c.id}
            aria-label={`Show creative ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-ink/50" : "w-1.5 bg-ink/15 hover:bg-ink/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

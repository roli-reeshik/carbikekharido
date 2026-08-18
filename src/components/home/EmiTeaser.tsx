"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function calculateEmi(principal: number, annualRatePercent: number, tenureYears: number): number {
  const monthlyRate = annualRatePercent / 12 / 100;
  const months = tenureYears * 12;
  if (monthlyRate === 0) return principal / months;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

export function EmiTeaser() {
  const { t } = useLanguage();
  const [price, setPrice] = useState(800000);
  const [downPayment, setDownPayment] = useState(160000);
  const [tenure, setTenure] = useState(5);
  const [rate] = useState(9.5);

  const emi = useMemo(() => {
    const principal = Math.max(price - downPayment, 0);
    return calculateEmi(principal, rate, tenure);
  }, [price, downPayment, tenure, rate]);

  const formatInr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="section-title">{t("home.emi.title")}</h2>
          <p className="section-subtitle">{t("home.emi.subtitle")}</p>
        </div>
        <Link href="/emi-calculator" className="hidden text-sm font-semibold text-highway hover:text-marigold sm:block">
          {t("home.emi.fullCalculator")} →
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          {[
            { label: t("home.emi.priceLabel"), value: price, min: 100000, max: 5000000, step: 10000, setter: setPrice },
            { label: t("home.emi.downPaymentLabel"), value: downPayment, min: 0, max: price, step: 10000, setter: setDownPayment },
            { label: t("home.emi.tenureLabel"), value: tenure, min: 1, max: 7, step: 1, setter: setTenure, suffix: ` ${t("home.emi.years")}` },
          ].map((slider) => (
            <div key={slider.label}>
              <div className="flex justify-between text-xs font-medium text-ink/60">
                <span>{slider.label}</span>
                <span className="font-mono">
                  {slider.suffix ? `${slider.value}${slider.suffix}` : formatInr(slider.value)}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={slider.value}
                onChange={(e) => slider.setter(Number(e.target.value))}
                className="mt-2 w-full accent-highway"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-highway to-highway-light p-8 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">{t("home.emi.resultLabel")}</p>
          <p className="mt-3 font-mono text-4xl font-bold text-marigold">
            {formatInr(Math.round(emi))}
            <span className="text-base font-normal text-white/50">{t("home.emi.perMonth")}</span>
          </p>
          <p className="mt-3 text-xs text-white/40">
            {t("home.emi.rateLabel")}: {rate}%
          </p>
          <Link href="/emi-calculator" className="mt-5 rounded-xl bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 sm:hidden">
            {t("home.emi.fullCalculator")}
          </Link>
        </div>
      </div>
    </section>
  );
}

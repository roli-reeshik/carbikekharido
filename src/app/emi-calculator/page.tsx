"use client";

import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
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

export default function EmiCalculatorPage() {
  const { t } = useLanguage();
  const [price, setPrice] = useState(1000000);
  const [downPayment, setDownPayment] = useState(200000);
  const [tenure, setTenure] = useState(5);
  const [rate, setRate] = useState(9.5);

  const { emi, totalPayment, totalInterest } = useMemo(() => {
    const principal = Math.max(price - downPayment, 0);
    const monthlyEmi = calculateEmi(principal, rate, tenure);
    const total = monthlyEmi * tenure * 12;
    return {
      emi: monthlyEmi,
      totalPayment: total + downPayment,
      totalInterest: total - principal,
    };
  }, [price, downPayment, tenure, rate]);

  const formatInr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const sliders = [
    { label: t("home.emi.priceLabel"), value: price, min: 50000, max: 5000000, step: 10000, setter: setPrice },
    { label: t("home.emi.downPaymentLabel"), value: downPayment, min: 0, max: price, step: 10000, setter: setDownPayment },
    { label: t("home.emi.tenureLabel"), value: tenure, min: 1, max: 7, step: 1, setter: setTenure, suffix: ` ${t("home.emi.years")}` },
    { label: t("home.emi.rateLabel"), value: rate, min: 7, max: 15, step: 0.1, setter: setRate, suffix: "%" },
  ];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">{t("emiPage.title")}</h1>
        <p className="mt-1 text-sm text-ink/50">{t("emiPage.subtitle")}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-line bg-surface p-6 sm:p-8">
            {sliders.map((slider) => (
              <div key={slider.label}>
                <div className="flex justify-between text-sm font-medium text-ink/70">
                  <span>{slider.label}</span>
                  <span className="font-mono">
                    {slider.suffix
                      ? slider.suffix === "%"
                        ? `${slider.value}${slider.suffix}`
                        : `${slider.value}${slider.suffix}`
                      : formatInr(slider.value)}
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

          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-highway to-highway-light p-8 text-center text-white">
              <p className="text-xs font-medium uppercase tracking-widest text-white/50">
                {t("home.emi.resultLabel")}
              </p>
              <p className="mt-3 font-mono text-5xl font-bold text-marigold">
                {formatInr(Math.round(emi))}
                <span className="text-lg font-normal text-white/50">{t("home.emi.perMonth")}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-surface p-4 text-center">
                <p className="text-xs text-ink/50">{t("emiPage.totalPayment")}</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{formatInr(Math.round(totalPayment))}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4 text-center">
                <p className="text-xs text-ink/50">{t("emiPage.totalInterest")}</p>
                <p className="mt-1 font-mono text-lg font-bold text-coral">{formatInr(Math.round(totalInterest))}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs text-ink/50">{t("emiPage.disclaimer")}</p>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

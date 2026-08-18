"use client";

import { SiteLayout } from "@/components/layout/SiteLayout";

export default function TermsPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-black text-ink sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: August 2026</p>

        <div className="mt-8 space-y-6 text-sm text-ink/75 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">1. Platform Services</h2>
            <p>
              CarBikeKharido.com provides an interactive automotive discovery, comparison, and marketplace tool for Indian cars and two-wheelers. All vehicle specifications and estimates are sourced from manufacturer publications, statutory guidelines, and certified dealers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">2. Pricing &amp; On-Road Estimates</h2>
            <p>
              Ex-showroom and on-road prices are indicative and subject to regional road taxes (RTO), state subsidies, insurance variants, and dealership charges. Please verify with your local dealership for binding quotation numbers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">3. Vehicle Listings &amp; User Conduct</h2>
            <p>
              Sellers listing vehicles agree to provide accurate odometer readings, clear photos, and legal ownership documentation. Fraudulent listings or abusive content are subject to immediate removal.
            </p>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

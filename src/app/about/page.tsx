"use client";

import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-highway/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-highway">
            About Us
          </span>
          <h1 className="font-display text-4xl font-black text-ink sm:text-5xl">
            Empowering India's Next-Generation Auto Marketplace
          </h1>
          <p className="text-lg text-ink/65 leading-relaxed">
            CarBikeKharido.com is built from the ground up to give buyers and enthusiasts direct, friction-free access to honest automotive intelligence, live pricing, rider fit ergonomics, and comprehensive total ownership calculators.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="text-3xl font-mono font-bold text-highway">100%</div>
            <h3 className="mt-2 font-display text-lg font-bold text-ink">Anonymous-First</h3>
            <p className="mt-1 text-sm text-ink/60 leading-relaxed">
              Explore every vehicle, comparison, and calculation freely without forced signups or invasive tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="text-3xl font-mono font-bold text-marigold-dark">1,000+</div>
            <h3 className="mt-2 font-display text-lg font-bold text-ink">Curated Catalog</h3>
            <p className="mt-1 text-sm text-ink/60 leading-relaxed">
              Authentic on-road prices, mileage stats, and official manufacturer specifications across India.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="text-3xl font-mono font-bold text-teal">0-Lag</div>
            <h3 className="mt-2 font-display text-lg font-bold text-ink">Precision Tools</h3>
            <p className="mt-1 text-sm text-ink/60 leading-relaxed">
              From Rider Fit physical legroom ergonomics to 5-year running cost breakdowns.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-highway p-8 text-white sm:p-12">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to find your next machine?</h2>
          <p className="mt-2 text-white/70 max-w-xl">
            Browse our showcase of hyper hybrids, supercars, WSBK track bikes, and daily commuters.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/search?type=car" className="btn-primary">
              Explore Cars
            </Link>
            <Link href="/search?type=bike" className="btn-secondary">
              Explore Bikes
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

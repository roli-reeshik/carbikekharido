"use client";

import { SiteLayout } from "@/components/layout/SiteLayout";

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-black text-ink sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: August 2026</p>

        <div className="mt-8 space-y-6 text-sm text-ink/75 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">1. Anonymous-First Architecture</h2>
            <p>
              At CarBikeKharido.com, we prioritize your privacy. You can browse all cars, motorcycles, reviews, comparisons, and run ownership calculators without providing your phone number, email, or name.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">2. Local Storage Usage</h2>
            <p>
              Your vehicle wishlist and comparison selections are saved locally on your own device via browser local storage. We do not transmit your browsing history or search terms to third-party ad networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">3. Verified Seller &amp; Buyer Interactions</h2>
            <p>
              When you choose to list a vehicle for sale or submit a test drive inquiry, your contact details are shared exclusively with verified authorized dealers or verified buyers with your explicit consent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink">4. Data Security</h2>
            <p>
              All traffic is encrypted over HTTPS (TLS 1.3). We do not sell your personal data to telemarketers or external advertising brokers.
            </p>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

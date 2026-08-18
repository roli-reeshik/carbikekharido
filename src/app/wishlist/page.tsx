"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { VehicleCard } from "@/components/VehicleCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { DEMO_VEHICLES, Vehicle } from "@/lib/vehicles";
import { getWishlist, toggleWishlist } from "@/lib/wishlist";

export default function WishlistPage() {
  const { t } = useLanguage();
  const [ids, setIds] = useState<string[]>([]);

  const refreshWishlist = () => {
    setIds(getWishlist());
  };

  useEffect(() => {
    refreshWishlist();
  }, []);

  const vehicles = DEMO_VEHICLES.filter((v) => ids.includes(v.id));
  const suggestions = DEMO_VEHICLES.slice(0, 4);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">{t("wishlistPage.title")}</h1>
            <p className="mt-1 text-sm text-ink/50">{t("wishlistPage.anonymousNote")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/search?type=car" className="btn-secondary text-xs">
              Explore Cars
            </Link>
            <Link href="/search?type=bike" className="btn-secondary text-xs">
              Explore Bikes
            </Link>
          </div>
        </div>

        {vehicles.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-paper border border-line text-4xl text-coral/70 shadow-inner">
              ♡
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-ink">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-ink/50 max-w-md mx-auto">
              Click the heart icon on any car or bike card across the platform to save vehicles for quick reference anytime.
            </p>

            <div className="mt-10 border-t border-line/60 pt-8 text-left">
              <h3 className="font-display text-lg font-bold text-ink mb-4">
                Recommended Vehicles to Add:
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {suggestions.map((v) => (
                  <div key={v.id} className="relative">
                    <VehicleCard vehicle={v} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { CinematicSplitHero } from "@/components/home/CinematicSplitHero";
import { ImmersiveSearchOverlay } from "@/components/home/ImmersiveSearchOverlay";
import { ShowroomCarousel } from "@/components/home/ShowroomCarousel";
import { BudgetExplorer } from "@/components/home/BudgetExplorer";
import { BrandStrip } from "@/components/home/BrandStrip";
import { BodyTypeExplorer } from "@/components/home/BodyTypeExplorer";
import { MostSearched } from "@/components/home/MostSearched";
import { ElectricSection } from "@/components/home/ElectricSection";
import { UpcomingSection } from "@/components/home/UpcomingSection";
import { OffersSection } from "@/components/home/OffersSection";
import { CompareTeaser } from "@/components/home/CompareTeaser";
import { TrustStrip } from "@/components/home/TrustStrip";
import { EmiTeaser } from "@/components/home/EmiTeaser";
import { NewsTeaser } from "@/components/home/NewsTeaser";
import { DealerLocator } from "@/components/home/DealerLocator";
import { AdBanner } from "@/components/home/AdBanner";
import { VehicleCard } from "@/components/VehicleCard";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { VehicleCondition, VehicleType } from "@/lib/vehicles";
import { useVehicleCatalog } from "@/lib/hooks/useVehicleCatalog";

export function HomePageClient() {
  const { t } = useLanguage();
  const { vehicles } = useVehicleCatalog();
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [condition, setCondition] = useState<VehicleCondition>("new");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global hotkey listener for Cmd+K / Ctrl+K and custom event
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }

    function handleOpenEvent() {
      setIsSearchOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-immersive-search", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-immersive-search", handleOpenEvent);
    };
  }, []);

  const filtered = vehicles.filter((v) => v.type === vehicleType && v.condition === condition);

  return (
    <SiteLayout>
      {/* ------------------------------------------------------------- */}
      {/* 1. Above-the-fold Dual-Category Cinematic Split Screen Hero   */}
      {/* ------------------------------------------------------------- */}
      <CinematicSplitHero onOpenSearch={() => setIsSearchOpen(true)} />

      {/* ------------------------------------------------------------- */}
      {/* 2. Full-Screen Glassmorphic Search Overlay                    */}
      {/* ------------------------------------------------------------- */}
      <ImmersiveSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* ------------------------------------------------------------- */}
      {/* 3. Obsidian Dark-Mode "Showroom" Horizontal Parallax Carousel */}
      {/* ------------------------------------------------------------- */}
      <ShowroomCarousel />

      {/* ------------------------------------------------------------- */}
      {/* 4. Main Vehicle Discovery & Marketplace Content Sections      */}
      {/* ------------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:space-y-16">
        <AdBanner />
        <BudgetExplorer activeType={vehicleType} />
        <BodyTypeExplorer activeType={vehicleType} />
        <BrandStrip />
        <MostSearched vehicles={vehicles} activeType={vehicleType} condition={condition} />

        {/* Popular India Catalog Grid */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-title">{t("home.popular.title")}</h2>
              <p className="section-subtitle">{t("home.popular.subtitle")}</p>
            </div>
            <div className="flex rounded-xl bg-paper p-1 border border-line">
              {(["car", "bike"] as VehicleType[]).map((ty) => (
                <button
                  key={ty}
                  onClick={() => setVehicleType(ty)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    vehicleType === ty
                      ? "bg-highway text-white shadow-sm"
                      : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {ty === "car" ? "Cars" : "Bikes"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 6).map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-ink/40">
                {t("home.mostSearched.empty")}
              </p>
            )}
          </div>
        </section>

        {vehicleType === "car" && <ElectricSection vehicles={vehicles} />}
        <OffersSection activeType={vehicleType} />
        <UpcomingSection />
        <CompareTeaser />
        <TrustStrip />
        <EmiTeaser />
        <DealerLocator />
        <NewsTeaser />
      </div>
    </SiteLayout>
  );
}

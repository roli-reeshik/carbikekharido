"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  SHOWROOM_VEHICLES,
  SHOWROOM_CATEGORIES,
  ShowroomVehicle,
} from "@/lib/showroomVehicles";
import { ShowroomCard } from "./ShowroomCard";
import { ShowroomDetailModal } from "./ShowroomDetailModal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function ShowroomCarousel() {
  const { locale } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<ShowroomVehicle | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredVehicles = useMemo(() => {
    if (activeCategory === "all") return SHOWROOM_VEHICLES;
    return SHOWROOM_VEHICLES.filter((v) => {
      if (activeCategory === "supercar") return v.type === "car";
      if (activeCategory === "superbike") return v.type === "bike";
      if (activeCategory === "hypercar") return v.category === "hypercar";
      if (activeCategory === "track-monster") return v.category === "track-monster";
      return true;
    });
  }, [activeCategory]);

  // Track horizontal scroll offset for parallax
  function handleScroll() {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setScrollOffset(scrollLeft);
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  }

  function scroll(direction: "left" | "right") {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.75;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }

  useEffect(() => {
    handleScroll();
  }, [filteredVehicles]);

  return (
    <section className="relative w-full overflow-hidden bg-obsidian py-16 sm:py-24 text-white">
      {/* Background Ambience & Radial Glow Spotlights */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-supercar-amber/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-superbike-cyan/10 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #0b0b0b 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-supercar-amber" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                FLAGSHIP SHOWROOM
              </span>
            </div>

            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              THE OBSIDIAN <span className="text-gradient-amber">COLLECTION</span>
            </h2>

            <p className="mt-2 font-mono text-xs sm:text-sm text-white/60 max-w-xl">
              Precision machinery curated for collectors, track enthusiasts, and adrenaline purists. Select any vehicle to launch the Studio Inspector.
            </p>
          </div>

          {/* Navigation Slider Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-obsidian-800 text-white shadow-lg backdrop-blur-xl transition hover:border-supercar-amber hover:bg-obsidian-750 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              aria-label="Scroll left"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-obsidian-800 text-white shadow-lg backdrop-blur-xl transition hover:border-superbike-cyan hover:bg-obsidian-750 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              aria-label="Scroll right"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SHOWROOM_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "border border-white/40 bg-white text-obsidian shadow-lg"
                    : "border border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.label.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal Parallax Vehicle Slider */}
      <div className="relative mt-8 sm:mt-10">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto px-4 sm:px-6 lg:px-12 py-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="snap-center">
              <ShowroomCard
                vehicle={vehicle}
                scrollOffset={scrollOffset}
                onSelectVehicle={(v) => setSelectedVehicle(v)}
              />
            </div>
          ))}
        </div>

        {/* Gradient edge masks for smooth overflow fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-obsidian to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-obsidian to-transparent z-10" />
      </div>

      {/* Bottom Counter & View All Showroom CTA */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 font-mono text-xs text-white/50">
          <span>SHOWING</span>
          <span className="font-bold text-white">{filteredVehicles.length}</span>
          <span>OF {SHOWROOM_VEHICLES.length} FLAGSHIP VEHICLES</span>
        </div>

        <Link
          href="/search"
          className="group inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-cinematic text-supercar-amber transition hover:text-white"
        >
          <span>VIEW FULL 2026 CATALOG</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      {/* Cinematic Vehicle Studio Modal */}
      <ShowroomDetailModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onSelectVehicle={(v) => setSelectedVehicle(v)}
      />
    </section>
  );
}

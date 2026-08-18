"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SHOWROOM_VEHICLES, ShowroomVehicle } from "@/lib/showroomVehicles";
import { DEMO_VEHICLES, Vehicle, formatLakh } from "@/lib/vehicles";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ImmersiveSearchOverlay({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input automatically when opened and handle Escape / Hotkey
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Combine curated showroom high-end vehicles + demo vehicles catalog for search pool
  const allCars = useMemo(() => {
    const highEnd = SHOWROOM_VEHICLES.filter((v) => v.type === "car");
    const demo = DEMO_VEHICLES.filter((v) => v.type === "car");
    return { highEnd, demo };
  }, []);

  const allBikes = useMemo(() => {
    const highEnd = SHOWROOM_VEHICLES.filter((v) => v.type === "bike");
    const demo = DEMO_VEHICLES.filter((v) => v.type === "bike");
    return { highEnd, demo };
  }, []);

  const filteredCars = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCars.highEnd.slice(0, 4);
    return allCars.highEnd.filter(
      (c) =>
        c.model.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.engine.toLowerCase().includes(q)
    );
  }, [query, allCars]);

  const filteredBikes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBikes.highEnd.slice(0, 4);
    return allBikes.highEnd.filter(
      (b) =>
        b.model.toLowerCase().includes(q) ||
        b.brand.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.engine.toLowerCase().includes(q)
    );
  }, [query, allBikes]);

  const quickTags = [
    { label: "V12 Hybrids", q: "V12" },
    { label: "Track Special", q: "Track" },
    { label: "Porsche GT3", q: "Porsche" },
    { label: "Ducati V4", q: "Ducati" },
    { label: "Supercharged", q: "Supercharged" },
    { label: "Ferrari", q: "Ferrari" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-start overflow-y-auto bg-obsidian-950/90 backdrop-blur-20 p-4 sm:p-8 md:p-12 text-white animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-label="Immersive Vehicle Search"
    >
      {/* Top Controls: Close button & Hotkey */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-supercar-amber">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
            SEARCH SHOWROOM &amp; CATALOG
          </span>
        </div>

        <button
          onClick={onClose}
          className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-mono tracking-wider text-white transition hover:bg-white/20 hover:border-white/30"
          aria-label="Close search overlay"
        >
          <span>ESC</span>
          <svg className="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Massive High-Contrast Headline Input */}
      <div className="mx-auto mt-8 sm:mt-12 w-full max-w-5xl">
        <form onSubmit={handleSubmit} className="relative">
          <label htmlFor="immersive-search-input" className="sr-only">
            What is your dream ride?
          </label>
          <input
            id="immersive-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What is your dream ride?"
            className="w-full bg-transparent font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white placeholder:text-white/20 outline-none border-b-2 border-white/15 pb-6 transition-colors focus:border-supercar-amber selection:bg-supercar-amber selection:text-obsidian"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/60 hover:text-white"
              aria-label="Clear query"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>

        {/* Curated Trending Tags */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 mr-1">
            TRENDING:
          </span>
          {quickTags.map((tag) => (
            <button
              key={tag.label}
              onClick={() => setQuery(tag.q)}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white active:scale-95"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual-Column Split Auto-Suggestions (Cars on Left, Bikes on Right) */}
      <div className="mx-auto mt-10 sm:mt-14 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 pb-16">
        {/* ----------------- CARS COLUMN ----------------- */}
        <div className="rounded-3xl border border-white/10 bg-obsidian-900/70 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-supercar-amber/15 text-sm text-supercar-amber">
                🏎️
              </span>
              <h3 className="font-display text-lg font-bold text-white tracking-wide">
                CARS &amp; SUPERCARS
              </h3>
            </div>
            <span className="font-mono text-[11px] text-supercar-amber font-semibold">
              {filteredCars.length} MATCHES
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {filteredCars.map((car) => (
              <Link
                key={car.id}
                href={`/search?type=car&q=${encodeURIComponent(car.brand + " " + car.model)}`}
                onClick={onClose}
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 transition-all duration-300 hover:border-supercar-amber/40 hover:bg-white/[0.08] hover:translate-x-1"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/10 group-hover:border-supercar-amber/30">
                    <span className="font-mono text-xs font-bold text-supercar-amber">
                      {car.brand.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-display text-sm font-bold text-white group-hover:text-supercar-amber">
                        {car.brand} {car.model}
                      </h4>
                      <span className="shrink-0 rounded bg-supercar-amber/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-supercar-amber">
                        {car.acceleration0to100}
                      </span>
                    </div>
                    <p className="truncate text-xs text-white/50 mt-0.5">
                      {car.engine} · {car.power}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="block font-mono text-sm font-bold text-white">
                    {car.priceDisplay}
                  </span>
                  <span className="block font-mono text-[10px] text-white/40 uppercase">
                    SHOWROOM
                  </span>
                </div>
              </Link>
            ))}

            {filteredCars.length === 0 && (
              <div className="py-8 text-center text-xs text-white/40">
                No matching supercars found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* ----------------- BIKES COLUMN ----------------- */}
        <div className="rounded-3xl border border-white/10 bg-obsidian-900/70 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-superbike-cyan/15 text-sm text-superbike-cyan">
                🏍️
              </span>
              <h3 className="font-display text-lg font-bold text-white tracking-wide">
                BIKES &amp; SUPERBIKES
              </h3>
            </div>
            <span className="font-mono text-[11px] text-superbike-cyan font-semibold">
              {filteredBikes.length} MATCHES
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {filteredBikes.map((bike) => (
              <Link
                key={bike.id}
                href={`/search?type=bike&q=${encodeURIComponent(bike.brand + " " + bike.model)}`}
                onClick={onClose}
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 transition-all duration-300 hover:border-superbike-cyan/40 hover:bg-white/[0.08] hover:translate-x-1"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/10 group-hover:border-superbike-cyan/30">
                    <span className="font-mono text-xs font-bold text-superbike-cyan">
                      {bike.brand.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-display text-sm font-bold text-white group-hover:text-superbike-cyan">
                        {bike.brand} {bike.model}
                      </h4>
                      <span className="shrink-0 rounded bg-superbike-cyan/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-superbike-cyan">
                        {bike.badge}
                      </span>
                    </div>
                    <p className="truncate text-xs text-white/50 mt-0.5">
                      {bike.engine} · {bike.power}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="block font-mono text-sm font-bold text-white">
                    {bike.priceDisplay}
                  </span>
                  <span className="block font-mono text-[10px] text-white/40 uppercase">
                    SHOWROOM
                  </span>
                </div>
              </Link>
            ))}

            {filteredBikes.length === 0 && (
              <div className="py-8 text-center text-xs text-white/40">
                No matching superbikes found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

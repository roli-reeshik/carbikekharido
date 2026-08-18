"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShowroomVehicle, SHOWROOM_VEHICLES } from "@/lib/showroomVehicles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface Props {
  vehicle: ShowroomVehicle | null;
  onClose: () => void;
  onSelectVehicle?: (v: ShowroomVehicle) => void;
}

type StudioAngle = "front-three-quarter" | "side-profile" | "cockpit-aero" | "rear-diffuser";

export function ShowroomDetailModal({ vehicle, onClose, onSelectVehicle }: Props) {
  const { locale } = useLanguage();
  const [activeAngle, setActiveAngle] = useState<StudioAngle>("front-three-quarter");
  const [isPlayingRev, setIsPlayingRev] = useState(false);
  const [consultationBooked, setConsultationBooked] = useState(false);
  // Re-trigger animation when switching vehicles
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (vehicle) {
      document.body.style.overflow = "hidden";
      setAnimationKey((prev) => prev + 1);
      setActiveAngle("front-three-quarter");
      setConsultationBooked(false);
      setIsPlayingRev(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [vehicle]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && vehicle) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vehicle, onClose]);

  if (!vehicle) return null;

  const isCar = vehicle.type === "car";
  const currentIndex = SHOWROOM_VEHICLES.findIndex((v) => v.id === vehicle.id);
  const prevVehicle = SHOWROOM_VEHICLES[(currentIndex - 1 + SHOWROOM_VEHICLES.length) % SHOWROOM_VEHICLES.length];
  const nextVehicle = SHOWROOM_VEHICLES[(currentIndex + 1) % SHOWROOM_VEHICLES.length];

  function handlePlayRev() {
    setIsPlayingRev(true);
    setTimeout(() => setIsPlayingRev(false), 3000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-obsidian-950/95 p-4 sm:p-6 md:p-10 backdrop-blur-30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="showroom-vehicle-title"
    >
      {/* Background Ambient Radial Glows & Grid Pattern */}
      <div className="pointer-events-none absolute -top-32 left-1/3 h-[600px] w-[600px] rounded-full bg-supercar-amber/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/3 h-[600px] w-[600px] rounded-full bg-superbike-cyan/10 blur-[140px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #0b0b0b 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Main Studio Container */}
      <div className="relative flex flex-col w-full max-w-7xl min-h-[85vh] rounded-3xl border border-white/15 bg-obsidian-900/90 shadow-2xl p-6 sm:p-10 md:p-12 overflow-hidden justify-between">
        
        {/* Giant Watermark in the Background */}
        <div
          className="pointer-events-none absolute -top-8 right-6 select-none font-display text-8xl sm:text-[14rem] font-black uppercase tracking-tighter text-white/[0.025] leading-none z-0"
          aria-hidden
        >
          {vehicle.watermark}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Top Header: Badge, Navigation Arrows & Close Button           */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-20 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 font-mono text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${
                isCar
                  ? "border-supercar-amber/40 bg-supercar-amber/10 text-supercar-amber"
                  : "border-superbike-cyan/40 bg-superbike-cyan/10 text-superbike-cyan"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {vehicle.badge}
            </span>
            <span className="hidden sm:inline font-mono text-xs text-white/40 uppercase tracking-widest">
              STUDIO INSPECTOR · {vehicle.categoryLabel[locale]}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onSelectVehicle && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => onSelectVehicle(prevVehicle)}
                  className="rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition"
                  title={`Previous: ${prevVehicle.brand} ${prevVehicle.model}`}
                  aria-label="Previous Vehicle"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-2 font-mono text-[10px] text-white/40">
                  {currentIndex + 1} / {SHOWROOM_VEHICLES.length}
                </span>
                <button
                  onClick={() => onSelectVehicle(nextVehicle)}
                  className="rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition"
                  title={`Next: ${nextVehicle.brand} ${nextVehicle.model}`}
                  aria-label="Next Vehicle"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-mono tracking-wider text-white transition hover:bg-white/20 hover:border-white/30 active:scale-95"
              aria-label="Close Studio View"
            >
              <span>ESC</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Center Stage: Cinematic Animated Vehicle Cutout & Ground Shadow */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 my-8 sm:my-12 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[380px]">
          
          {/* Ambient Lighting Dome */}
          <div
            className={`absolute h-48 sm:h-72 w-80 sm:w-[32rem] rounded-full filter blur-3xl transition-opacity duration-1000 ${
              isCar ? "bg-supercar-amber/15" : "bg-superbike-cyan/15"
            }`}
          />

          {/* 1. Cinematic Vehicle Cutout Entrance Image */}
          {/* Initial State: opacity: 0, scale: 0.85, blur: 10px, translateX(-40px) */}
          {/* Animate To: opacity: 1, scale: 1, blur: 0px, translateX(0) over 1.2s cubic-bezier(0.16, 1, 0.3, 1) */}
          <div key={`vehicle-img-${animationKey}`} className="relative z-10 w-full max-w-3xl cinematic-cutout-enter">
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className={`w-full max-h-[300px] sm:max-h-[420px] object-contain filter drop-shadow-2xl transition-transform duration-700 ${
                activeAngle === "side-profile" ? "scale-x-[-1]" : "scale-100"
              }`}
            />
          </div>

          {/* 2. Ambient Ground Shadow Beneath Tires */}
          {/* Soft black radial floor shadow fading in (opacity 0 to 0.6-0.7) and scaling right as vehicle finishes slide-in */}
          <div
            key={`shadow-${animationKey}`}
            className="shadow-element ground-shadow-enter pointer-events-none relative -mt-6 sm:-mt-8 z-0 h-10 sm:h-14 w-[75%] sm:w-[65%] max-w-2xl rounded-[100%]"
            style={{
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          {/* Studio 360 Rotation Angle Tabs */}
          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-obsidian-850/80 p-1 backdrop-blur-md">
            {[
              { id: "front-three-quarter", label: "Front 3/4" },
              { id: "side-profile", label: "Side Aerodynamics" },
              { id: "cockpit-aero", label: "Cockpit Focus" },
            ].map((angle) => (
              <button
                key={angle.id}
                onClick={() => setActiveAngle(angle.id as StudioAngle)}
                className={`rounded-full px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider transition ${
                  activeAngle === angle.id
                    ? "bg-white/20 text-white font-bold shadow-sm"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {angle.label}
              </button>
            ))}

            {/* Engine Audio Rev Teaser */}
            <button
              onClick={handlePlayRev}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider border transition ${
                isPlayingRev
                  ? isCar
                    ? "border-supercar-amber bg-supercar-amber text-obsidian font-bold"
                    : "border-superbike-cyan bg-superbike-cyan text-obsidian font-bold"
                  : "border-white/15 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <span>{isPlayingRev ? "🔊 REV ACCELERATING..." : "▶ REV ENGINE"}</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. Content Stagger: Specifications & Actions                  */}
        {/* Staggers in gently after the vehicle animation completes      */}
        {/* ------------------------------------------------------------- */}
        <div key={`spec-content-${animationKey}`} className="relative z-20 spec-stagger-enter border-t border-white/10 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Vehicle Title & Tagline */}
            <div className="lg:col-span-5">
              <h2 id="showroom-vehicle-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {vehicle.brand}{" "}
                <span className={isCar ? "text-gradient-amber" : "text-gradient-cyan"}>
                  {vehicle.model}
                </span>
              </h2>
              <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-lg">
                {vehicle.heroSnippet[locale]}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {vehicle.highlights.map((h) => (
                  <span
                    key={h}
                    className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/60"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Metric Cards */}
            <div className="lg:col-span-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-obsidian-850 p-3.5 text-center">
                <span className="block font-mono text-[10px] uppercase text-white/40 tracking-wider">
                  0-100 KM/H
                </span>
                <span
                  className={`mt-1 block font-mono text-xl sm:text-2xl font-black ${
                    isCar ? "text-supercar-amber" : "text-superbike-cyan"
                  }`}
                >
                  {vehicle.acceleration0to100}
                </span>
                <span className="block font-mono text-[9px] text-white/30">TESTED LAUNCH</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-obsidian-850 p-3.5 text-center">
                <span className="block font-mono text-[10px] uppercase text-white/40 tracking-wider">
                  POWER
                </span>
                <span className="mt-1 block font-mono text-xl sm:text-2xl font-black text-white">
                  {vehicle.power.split(" ")[0]}
                </span>
                <span className="block font-mono text-[9px] text-white/30">HORSEPOWER</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-obsidian-850 p-3.5 text-center">
                <span className="block font-mono text-[10px] uppercase text-white/40 tracking-wider">
                  TOP SPEED
                </span>
                <span className="mt-1 block font-mono text-xl sm:text-2xl font-black text-white">
                  {vehicle.topSpeed.split(" ")[0]}
                </span>
                <span className="block font-mono text-[9px] text-white/30">KM / HOUR</span>
              </div>
            </div>

            {/* Price & VIP Consultation Trigger */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col justify-center items-start lg:items-end gap-3">
              <div className="text-left lg:text-right">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-white/40">
                  ESTIMATED ON-ROAD PRICE
                </span>
                <span className="block font-mono text-2xl sm:text-3xl font-black text-white">
                  {vehicle.priceDisplay}
                </span>
              </div>

              <div className="flex flex-col w-full sm:w-auto gap-2">
                <button
                  onClick={() => setConsultationBooked(true)}
                  className={`w-full rounded-xl px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg active:scale-95 ${
                    consultationBooked
                      ? "bg-emerald-500 text-white"
                      : isCar
                      ? "bg-supercar-amber text-obsidian hover:bg-supercar-amber/90 shadow-obsidian-glow-amber"
                      : "bg-superbike-cyan text-obsidian hover:bg-superbike-cyan/90 shadow-obsidian-glow-cyan"
                  }`}
                >
                  {consultationBooked ? "✓ VIP CONCIERGE ASSIGNED" : "REQUEST VIP SHOWROOM VIEW"}
                </button>
                <Link
                  href={`/model?brand=${encodeURIComponent(vehicle.brand)}&model=${encodeURIComponent(vehicle.model)}`}
                  className="w-full text-center rounded-xl border border-white/20 bg-white/5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/15 transition"
                >
                  VIEW FULL WEBPAGE &amp; SPECS →
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

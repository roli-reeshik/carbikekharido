"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { playCarRevSound, playBikeRevSound, stopAllSounds } from "@/lib/soundEngine";

interface Props {
  onOpenSearch?: () => void;
}

type HoverState = "none" | "car" | "bike";
type ExpandedCategory = "none" | "car" | "bike";

export function CinematicSplitHero({ onOpenSearch }: Props) {
  const { t } = useLanguage();
  const [hoveredSide, setHoveredSide] = useState<HoverState>("none");
  const [expandedCategory, setExpandedCategory] = useState<ExpandedCategory>("none");
  const [isMuted, setIsMuted] = useState(true);

  const carVideoRef = useRef<HTMLVideoElement | null>(null);
  const bikeVideoRef = useRef<HTMLVideoElement | null>(null);

  // Sync mute states across videos
  useEffect(() => {
    if (carVideoRef.current) carVideoRef.current.muted = isMuted;
    if (bikeVideoRef.current) bikeVideoRef.current.muted = isMuted;
  }, [isMuted]);

  // Autoplay videos on mount and ensure continuous playback
  useEffect(() => {
    const startPlayback = () => {
      if (carVideoRef.current) {
        carVideoRef.current.defaultMuted = true;
        carVideoRef.current.muted = isMuted;
        carVideoRef.current.play().catch(() => {});
      }
      if (bikeVideoRef.current) {
        bikeVideoRef.current.defaultMuted = true;
        bikeVideoRef.current.muted = isMuted;
        bikeVideoRef.current.play().catch(() => {});
      }
    };

    startPlayback();

    const handleUserInteraction = () => {
      startPlayback();
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [isMuted]);

  // Cleanup audio upon component unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  // Keyboard shortcut: Escape exits expanded category showcase
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && expandedCategory !== "none") {
        stopAllSounds();
        setExpandedCategory("none");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedCategory]);

  const handleExploreCar = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    playCarRevSound();
    setExpandedCategory("car");
  }, []);

  const handleExploreBike = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    playBikeRevSound();
    setExpandedCategory("bike");
  }, []);

  const handleResetShowcase = useCallback(() => {
    stopAllSounds();
    setExpandedCategory("none");
    setHoveredSide("none");
  }, []);

  const isShowcaseActive = expandedCategory !== "none";

  return (
    <section 
      className="relative w-full overflow-hidden bg-obsidian text-white select-none transition-all duration-1000"
      aria-label="Cinematic Dual Showcase"
    >
      {/* ------------------------------------------------------------- */}
      {/* Top Floating Utility Bar                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-6 inset-x-0 z-30 pointer-events-none px-4 sm:px-6 md:px-12 flex items-center justify-between gap-4">
        {/* Left: Official Luxury Branding Pill */}
        <div className="pointer-events-auto w-auto shrink-0 flex items-center gap-2.5 rounded-full border border-white/20 bg-obsidian-900/95 px-4 py-1.5 backdrop-blur-xl shadow-2xl">
          <span className="h-2 w-2 rounded-full bg-supercar-amber animate-pulse shrink-0" />
          <span className="cinematic-logo-enter whitespace-nowrap font-display text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.3)] select-none">
            CARBIKE<span className="text-supercar-amber">KHARIDO</span><span className="text-supercar-amber font-mono">.COM</span>
          </span>
        </div>

        {/* Right Controls: Reset Button (when active) + Sound Toggle + Search */}
        <div className="pointer-events-auto flex items-center gap-3">
          {isShowcaseActive && (
            <button
              onClick={handleResetShowcase}
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl transition hover:bg-white/20 hover:border-white/40 active:scale-95 animate-fadeIn"
              title="Return to 50/50 Dual Showcase"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-mono text-[10px] sm:text-[11px] tracking-wider uppercase">DUAL VIEW</span>
            </button>
          )}

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-obsidian-800/80 px-3.5 py-1.5 text-xs font-medium text-white/75 backdrop-blur-md transition hover:border-white/30 hover:text-white hover:bg-obsidian-750"
            title={isMuted ? "Unmute Engine Audio" : "Mute Engine Audio"}
            aria-label="Toggle Engine Audio"
          >
            {isMuted ? (
              <>
                <svg className="h-3.5 w-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">AUDIO OFF</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 text-supercar-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="font-mono text-[10px] uppercase tracking-wider text-supercar-amber">V12 &amp; V4 SOUND</span>
              </>
            )}
          </button>

          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-white/20 hover:border-white/35 active:scale-95"
              aria-label="Open Fullscreen Search"
            >
              <svg className="h-3.5 w-3.5 text-supercar-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-mono text-[11px] tracking-wider uppercase">SEARCH</span>
              <kbd className="hidden sm:inline-block rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-mono text-white/80">⌘K</kbd>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 50/50 Dual-Category Split or Full-Bleed Showcase Container    */}
      {/* ------------------------------------------------------------- */}
      <div 
        className="relative flex flex-col md:flex-row w-full min-h-[92vh] lg:min-h-[96vh] transition-all duration-1000 ease-cinematic"
        onMouseLeave={() => {
          if (!isShowcaseActive) setHoveredSide("none");
        }}
      >
        {/* =========================================================== */}
        {/* LEFT HALF: SUPERCARS (Plays /assets/hero-car.mp4)           */}
        {/* =========================================================== */}
        <div
          className={`relative flex flex-col justify-between overflow-hidden split-panel transition-all duration-1000 ease-cinematic ${
            expandedCategory === "car"
              ? "w-full md:w-full md:flex-[10] z-20 min-h-[92vh]"
              : expandedCategory === "bike"
              ? "w-0 md:w-0 md:flex-[0] opacity-0 pointer-events-none overflow-hidden max-h-0 md:max-h-none"
              : hoveredSide === "car"
              ? "md:flex-[7] md:w-[70%] min-h-[48vh] md:min-h-full cursor-pointer"
              : hoveredSide === "bike"
              ? "md:flex-[3] md:w-[30%] opacity-40 brightness-75 saturate-50 min-h-[48vh] md:min-h-full cursor-pointer"
              : "md:flex-[5] md:w-[50%] min-h-[48vh] md:min-h-full cursor-pointer"
          } border-b md:border-b-0 md:border-r border-white/10`}
          onMouseEnter={() => {
            if (!isShowcaseActive) setHoveredSide("car");
          }}
          onFocus={() => {
            if (!isShowcaseActive) setHoveredSide("car");
          }}
        >
          {/* Direct Video Backdrop */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-obsidian-950">
            <video
              ref={carVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className={`object-cover w-full h-full filter brightness-[0.88] contrast-[1.05] transition-transform duration-1200 ease-cinematic ${
                expandedCategory === "car"
                  ? "scale-115"
                  : hoveredSide === "car"
                  ? "scale-110"
                  : "scale-105"
              }`}
            >
              <source src="/assets/hero-car.mp4" type="video/mp4" />
              <source src="/assets/hero-car.webm" type="video/webm" />
            </video>

            {/* Cinematic Transparent Lighting & Vignette for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian/75 via-transparent to-black/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(245,166,35,0.18)_0%,transparent_70%)]" />
          </div>

          {/* Top Label */}
          <div className="relative z-10 p-8 sm:p-12 pt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-supercar-amber/30 bg-obsidian-900/80 px-3.5 py-1 backdrop-blur-md">
              <span className="text-supercar-amber text-xs">◆</span>
              <span className="font-mono text-[11px] font-semibold tracking-cinematic uppercase text-supercar-amber">
                {expandedCategory === "car" ? "FLAGSHIP SHOWCASE · HYPER HYBRID" : "CATEGORY 01 · FOUR WHEELS"}
              </span>
            </div>
          </div>

          {/* Default Split Hero State Content */}
          {expandedCategory !== "car" && (
            <div className="relative z-10 p-8 sm:p-12 pb-14 sm:pb-20 max-w-xl">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl">
                SUPERCARS <br />
                <span className="text-gradient-amber">&amp; HYPER HYBRIDS</span>
              </h2>

              <p className={`mt-4 text-sm sm:text-base text-white/85 drop-shadow-md leading-relaxed max-w-md transition-opacity duration-500 ${
                hoveredSide === "bike" ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
              }`}>
                From 1,000 HP Maranello e-motors to naturally aspirated 9,000 RPM flat-six precision. Experience engineering at the absolute limit.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleExploreCar}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-supercar-amber/40 bg-obsidian-800/90 px-8 py-3.5 shadow-obsidian-card backdrop-blur-xl transition-all duration-300 hover:border-supercar-amber hover:bg-supercar-amber hover:text-obsidian hover:shadow-obsidian-glow-amber active:scale-95"
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-cinematic transition-colors">
                    EXPLORE SUPERCARS
                  </span>
                  <svg
                    className="ml-3 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-white/70 bg-obsidian-900/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                  <span className="text-supercar-amber font-bold">0-100</span>
                  <span>in 2.5s</span>
                </div>
              </div>
            </div>
          )}

          {/* FULL-BLEED CATEGORY SHOWCASE (Ferrari SF90) */}
          {expandedCategory === "car" && (
            <div className="relative z-10 w-full px-6 sm:px-12 pb-16 flex flex-col justify-between flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-4">
                <div className="lg:col-span-5 space-y-6 showcase-content-enter">
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-supercar-amber uppercase">
                      MARANELLO APEX SPECIFICATION
                    </span>
                    <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
                      Ferrari SF90 <br />
                      <span className="text-gradient-amber">Stradale</span>
                    </h1>
                    <p className="text-sm text-white/75 leading-relaxed max-w-lg">
                      1,000 CV of pure Maranello electrification. Featuring 3 axial-flux electric motors paired with a twin-turbo V8 producing instantaneous torque vectoring.
                    </p>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="rounded-xl border border-white/10 bg-obsidian-900/80 p-3.5 backdrop-blur-md">
                      <div className="font-mono text-[10px] uppercase text-white/50">0-100 KM/H</div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-supercar-amber">2.5s</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-obsidian-900/80 p-3.5 backdrop-blur-md">
                      <div className="font-mono text-[10px] uppercase text-white/50">POWER</div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">1,000 CV</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-obsidian-900/80 p-3.5 backdrop-blur-md">
                      <div className="font-mono text-[10px] uppercase text-white/50">TOP SPEED</div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">340 km/h</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Link
                      href="/search?type=car"
                      className="inline-flex items-center justify-center rounded-full bg-supercar-amber px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-cinematic text-obsidian shadow-obsidian-glow-amber transition hover:brightness-110 active:scale-95"
                    >
                      BROWSE ALL CARS →
                    </Link>
                    <button
                      type="button"
                      onClick={handleResetShowcase}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 bg-obsidian-800/80 px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-white/80 transition hover:border-white/40 hover:text-white"
                    >
                      ✕ BACK TO DUAL APEX
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 relative flex flex-col items-center justify-center min-h-[340px] sm:min-h-[460px]">
                  <div className="relative w-full max-w-2xl aspect-[16/9] flex items-center justify-center flagship-vehicle-enter">
                    <div className="relative w-full h-full object-cover rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                      >
                        <source src="/assets/ferrari-showcase.mp4" type="video/mp4" />
                        <source src="/assets/hero-car.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ambient Edge */}
          <div 
            className={`absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-transparent via-supercar-amber/60 to-transparent transition-opacity duration-500 ${
              hoveredSide === "car" ? "opacity-100" : "opacity-0"
            }`} 
          />
        </div>

        {/* =========================================================== */}
        {/* CENTER INTERACTIVE DIVIDER BADGE ("VS")                     */}
        {/* =========================================================== */}
        {!isShowcaseActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center pointer-events-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-obsidian-900/95 shadow-2xl backdrop-blur-2xl transition-transform duration-500 group-hover:scale-110">
              <span className="font-mono text-xs font-black tracking-widest text-white/90">VS</span>
            </div>
          </div>
        )}

        {/* =========================================================== */}
        {/* RIGHT HALF: SUPERBIKES (Plays /assets/hero-bike.mp4)        */}
        {/* =========================================================== */}
        <div
          className={`relative flex flex-col justify-between overflow-hidden split-panel transition-all duration-1000 ease-cinematic ${
            expandedCategory === "bike"
              ? "w-full md:w-full md:flex-[10] z-20 min-h-[92vh]"
              : expandedCategory === "car"
              ? "w-0 md:w-0 md:flex-[0] opacity-0 pointer-events-none overflow-hidden max-h-0 md:max-h-none"
              : hoveredSide === "bike"
              ? "md:flex-[7] md:w-[70%] min-h-[48vh] md:min-h-full cursor-pointer"
              : hoveredSide === "car"
              ? "md:flex-[3] md:w-[30%] opacity-40 brightness-75 saturate-50 min-h-[48vh] md:min-h-full cursor-pointer"
              : "md:flex-[5] md:w-[50%] min-h-[48vh] md:min-h-full cursor-pointer"
          }`}
          onMouseEnter={() => {
            if (!isShowcaseActive) setHoveredSide("bike");
          }}
          onFocus={() => {
            if (!isShowcaseActive) setHoveredSide("bike");
          }}
        >
          {/* Direct Video Backdrop */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-obsidian-950">
            <video
              ref={bikeVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className={`object-cover w-full h-full filter brightness-[0.88] contrast-[1.05] transition-transform duration-1200 ease-cinematic ${
                expandedCategory === "bike"
                  ? "scale-115"
                  : hoveredSide === "bike"
                  ? "scale-110"
                  : "scale-105"
              }`}
            >
              <source src="/assets/hero-bike.mp4" type="video/mp4" />
              <source src="/assets/hero-bike.webm" type="video/webm" />
            </video>

            {/* Cinematic Transparent Lighting & Vignette for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-l from-obsidian/75 via-transparent to-black/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(0,245,212,0.18)_0%,transparent_70%)]" />
          </div>

          {/* Top Label */}
          <div className="relative z-10 p-8 sm:p-12 pt-20 md:text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-superbike-cyan/30 bg-obsidian-900/80 px-3.5 py-1 backdrop-blur-md">
              <span className="text-superbike-cyan text-xs">◆</span>
              <span className="font-mono text-[11px] font-semibold tracking-cinematic uppercase text-superbike-cyan">
                {expandedCategory === "bike" ? "FLAGSHIP SHOWCASE · MOTOGP DNA" : "CATEGORY 02 · TWO WHEELS"}
              </span>
            </div>
          </div>

          {/* Default Split Hero State Content */}
          {expandedCategory !== "bike" && (
            <div className="relative z-10 p-8 sm:p-12 pb-14 sm:pb-20 max-w-xl md:ml-auto md:text-right">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl">
                SUPERBIKES <br />
                <span className="text-gradient-cyan">&amp; TRACK WEAPONS</span>
              </h2>

              <p className={`mt-4 text-sm sm:text-base text-white/85 drop-shadow-md leading-relaxed max-w-md md:ml-auto transition-opacity duration-500 ${
                hoveredSide === "car" ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
              }`}>
                WSBK homologation missiles revving past 16,500 RPM and supercharged 300+ HP velocity beasts. Pure visceral adrenaline on two wheels.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-start md:justify-end gap-4">
                <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-white/70 bg-obsidian-900/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                  <span className="text-superbike-cyan font-bold">16,500</span>
                  <span>RPM Peak</span>
                </div>

                <button
                  type="button"
                  onClick={handleExploreBike}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-superbike-cyan/40 bg-obsidian-800/90 px-8 py-3.5 shadow-obsidian-card backdrop-blur-xl transition-all duration-300 hover:border-superbike-cyan hover:bg-superbike-cyan hover:text-obsidian hover:shadow-obsidian-glow-cyan active:scale-95"
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-cinematic transition-colors">
                    EXPLORE SUPERBIKES
                  </span>
                  <svg
                    className="ml-3 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* FULL-BLEED CATEGORY SHOWCASE (Ducati Panigale V4 R) */}
          {expandedCategory === "bike" && (
            <div className="relative z-10 w-full px-6 sm:px-12 pb-16 flex flex-col justify-between flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-4">
                <div className="lg:col-span-7 order-2 lg:order-1 relative flex flex-col items-center justify-center min-h-[340px] sm:min-h-[460px]">
                  <div className="relative w-full max-w-2xl aspect-[16/9] flex items-center justify-center flagship-vehicle-enter">
                    <div className="relative w-full h-full object-cover rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                      >
                        <source src="/assets/ducati-showcase.mp4" type="video/mp4" />
                        <source src="/assets/hero-bike.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 order-1 lg:order-2 space-y-6 showcase-content-enter text-left lg:text-right">
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-superbike-cyan uppercase">
                      BORGO PANIGALE HOMOLOGATION
                    </span>
                    <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
                      Ducati Panigale <br />
                      <span className="text-gradient-cyan">V4 R</span>
                    </h1>
                    <p className="text-sm text-white/75 leading-relaxed max-w-lg lg:ml-auto">
                      Direct WSBK world-championship pedigree. Powered by the 998cc Desmosedici Stradale R engine revving to 16,500 RPM with carbon aerodynamic winglets.
                    </p>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="rounded-xl border border-white/10 bg-obsidian-900/80 p-3.5 backdrop-blur-md">
                      <div className="font-mono text-[10px] uppercase text-white/50">0-100 KM/H</div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-superbike-cyan">2.7s</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-obsidian-900/80 p-3.5 backdrop-blur-md">
                      <div className="font-mono text-[10px] uppercase text-white/50">POWER</div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">240.5 HP</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-obsidian-900/80 p-3.5 backdrop-blur-md">
                      <div className="font-mono text-[10px] uppercase text-white/50">RPM REDLINE</div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-white">16,500</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-start lg:justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleResetShowcase}
                      className="inline-flex items-center justify-center rounded-full border border-white/20 bg-obsidian-800/80 px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-white/80 transition hover:border-white/40 hover:text-white"
                    >
                      ✕ BACK TO DUAL APEX
                    </button>
                    <Link
                      href="/search?type=bike"
                      className="inline-flex items-center justify-center rounded-full bg-superbike-cyan px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-cinematic text-obsidian shadow-obsidian-glow-cyan transition hover:brightness-110 active:scale-95"
                    >
                      BROWSE ALL BIKES →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ambient Edge */}
          <div 
            className={`absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-superbike-cyan/60 to-transparent transition-opacity duration-500 ${
              hoveredSide === "bike" ? "opacity-100" : "opacity-0"
            }`} 
          />
        </div>
      </div>

      {/* Bottom Ambient Gradient Blend */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-obsidian to-transparent z-10" />
    </section>
  );
}

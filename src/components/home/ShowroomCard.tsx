"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShowroomVehicle } from "@/lib/showroomVehicles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface Props {
  vehicle: ShowroomVehicle;
  scrollOffset: number;
  onSelectVehicle?: (vehicle: ShowroomVehicle) => void;
}

export function ShowroomCard({ vehicle, scrollOffset, onSelectVehicle }: Props) {
  const { locale } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const isCar = vehicle.type === "car";
  const accentColorClass = isCar
    ? "text-supercar-amber border-supercar-amber/40 bg-supercar-amber/10"
    : "text-superbike-cyan border-superbike-cyan/40 bg-superbike-cyan/10";

  const glowClass = isCar
    ? "group-hover:shadow-obsidian-glow-amber"
    : "group-hover:shadow-obsidian-glow-cyan";

  // Calculate subtle text parallax shift based on horizontal scroll offset
  const parallaxShift = (scrollOffset * 0.15) % 80;

  return (
    <div
      onClick={() => onSelectVehicle?.(vehicle)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex w-[340px] sm:w-[420px] md:w-[460px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-obsidian-850 p-6 shadow-obsidian-card transition-all duration-500 hover:-translate-y-2 hover:border-white/25 cursor-pointer ${glowClass}`}
    >
      {/* Background Parallax Watermark Typography */}
      <div
        className="pointer-events-none absolute -right-6 -top-4 select-none font-display text-7xl sm:text-8xl font-black uppercase tracking-tighter text-white/[0.04] transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${-parallaxShift}px)`,
        }}
        aria-hidden
      >
        {vehicle.watermark}
      </div>

      {/* Top Header: Badge, Category, & Price */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${accentColorClass}`}
          >
            <span>◆</span>
            {vehicle.badge}
          </span>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-white">
            {vehicle.brand}{" "}
            <span className={isCar ? "text-gradient-amber" : "text-gradient-cyan"}>
              {vehicle.model}
            </span>
          </h3>
          <p className="mt-1 font-mono text-xs text-white/50">{vehicle.engine}</p>
        </div>

        <div className="text-right">
          <span className="block font-mono text-xl sm:text-2xl font-black tracking-tight text-white">
            {vehicle.priceDisplay}
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
            EST. ON-ROAD
          </span>
        </div>
      </div>

      {/* Center Transparent Vehicle Profile Image with Contact Shadow */}
      <div className="relative my-6 flex h-48 sm:h-56 items-center justify-center">
        {/* Ambient Underglow */}
        <div
          className={`absolute h-32 w-64 rounded-full filter blur-2xl transition-opacity duration-500 ${
            isCar ? "bg-supercar-amber/15" : "bg-superbike-cyan/15"
          } ${isHovered ? "opacity-100 scale-110" : "opacity-40"}`}
        />

        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="relative z-10 max-h-full w-full object-contain filter drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      {/* Performance Specs Grid (0-100, Power, Top Speed) */}
      <div className="relative z-10 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-obsidian-900/80 p-3 backdrop-blur-md">
        <div className="text-center border-r border-white/10 pr-2">
          <span className="block font-mono text-[10px] uppercase text-white/40 tracking-wider">
            0-100 KM/H
          </span>
          <span
            className={`font-mono text-sm sm:text-base font-bold ${
              isCar ? "text-supercar-amber" : "text-superbike-cyan"
            }`}
          >
            {vehicle.acceleration0to100}
          </span>
        </div>

        <div className="text-center border-r border-white/10 px-1">
          <span className="block font-mono text-[10px] uppercase text-white/40 tracking-wider">
            POWER
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-white">
            {vehicle.power.split(" ")[0]}
          </span>
        </div>

        <div className="text-center pl-2">
          <span className="block font-mono text-[10px] uppercase text-white/40 tracking-wider">
            TOP SPEED
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-white">
            {vehicle.topSpeed}
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-10 mt-5 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectVehicle?.(vehicle);
          }}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-center font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white/15 hover:border-white/30"
        >
          INSPECT SPEC
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectVehicle?.(vehicle);
          }}
          className={`flex-1 rounded-xl py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
            isCar
              ? "bg-supercar-amber text-obsidian hover:bg-supercar-amber/90"
              : "bg-superbike-cyan text-obsidian hover:bg-superbike-cyan/90"
          }`}
        >
          360° STUDIO
        </button>
      </div>
    </div>
  );
}

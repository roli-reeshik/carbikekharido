import React from 'react';
import { TelemetryData } from '../types';
import { Zap, Wind, Navigation, Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface TelemetryHUDProps {
  telemetry: TelemetryData;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -36, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -36, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-20 left-6 z-20 pointer-events-none select-none font-sans"
    >
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 text-white shadow-2xl space-y-4 max-w-[310px]">
        {/* Header: Vehicle & Location */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex flex-col">
            <span className="text-amber-500 font-mono text-[10px] tracking-[0.25em] uppercase font-bold">
              Telemetry Spec
            </span>
            <div className="text-sm font-black tracking-tight flex items-center gap-1.5 text-white">
              <Zap size={14} className="text-amber-500" />
              <span>CHARCOAL STORM</span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-white/5 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur-md">
            60 FPS 4K
          </span>
        </div>

        {/* Big Italic Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Velocity</div>
            <div className="text-3xl font-black italic tracking-tighter text-white">
              {telemetry.speedMph}<span className="text-xs font-mono not-italic text-amber-500 ml-1">MPH</span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Motor Output</div>
            <div className="text-3xl font-black italic tracking-tighter text-white">
              {telemetry.motorPowerKw}<span className="text-xs font-mono not-italic text-slate-400 ml-1">kW</span>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Rows */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
              <Activity size={13} className="text-amber-400" /> Lateral G-Force
            </span>
            <span className="font-bold text-white font-mono">{telemetry.gForceLat > 0 ? `+${telemetry.gForceLat}` : telemetry.gForceLat} G</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
              <Wind size={13} className="text-amber-400" /> Active Wing
            </span>
            <span className="font-bold text-white font-mono">{telemetry.activeWingAngleDeg}° ({telemetry.downforceKg}kg)</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-2xl border border-white/10">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
              <ShieldCheck size={13} className="text-emerald-400" /> Surface Grip
            </span>
            <span className="font-bold text-emerald-400 font-mono">{telemetry.roadGripPct}% Dry</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Navigation size={11} className="text-amber-500" /> Big Sur Coastal Loop
          </span>
          <span className="font-mono text-amber-500 font-bold">1020 HP DUAL-EV</span>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { TelemetryData } from '../types';
import { Activity, Wind, Zap, Disc3 } from 'lucide-react';

interface TelemetryHUDProps {
  telemetry: TelemetryData;
  isNitro: boolean;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry, isNitro }) => {
  const [unit, setUnit] = useState<'mph' | 'kmh'>('mph');

  const speedDisplay = unit === 'kmh' ? Math.round(telemetry.speedKmh) : telemetry.speedMph;
  const rpmPercent = Math.min(100, Math.round((telemetry.rpm / telemetry.maxRpm) * 100));

  // Shift light logic
  const isShiftWarning = rpmPercent > 88;
  const isShiftCritical = rpmPercent > 94;

  return (
    <div
      id="telemetry-hud-cluster"
      className="absolute bottom-8 left-6 sm:left-12 z-30 pointer-events-auto flex flex-col gap-3 font-sans select-none"
    >
      {/* Sleek Interface Primary Metric Bar */}
      <div className="border border-zinc-800 bg-zinc-900/70 backdrop-blur-md rounded-lg p-4 sm:p-5 shadow-2xl min-w-[300px] sm:min-w-[420px]">
        {/* RPM Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-red-600" />
              <span>Tachometer</span>
            </span>
            <span className="font-bold text-zinc-200">
              {telemetry.rpm.toLocaleString()} <span className="text-zinc-600 font-normal">/ {telemetry.maxRpm}</span>
            </span>
          </div>

          <div className="h-1.5 w-full bg-zinc-800 rounded-sm overflow-hidden flex p-[1px]">
            <div
              className={`h-full rounded-sm transition-all duration-75 ${
                isShiftCritical
                  ? 'bg-red-600 animate-pulse'
                  : isShiftWarning
                  ? 'bg-red-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${rpmPercent}%` }}
            />
          </div>

          {/* Shift warning blinker */}
          {isShiftCritical && (
            <div className="text-[10px] text-center text-red-500 font-mono font-bold tracking-widest mt-1.5 animate-pulse">
              ▲ SHIFT UP ▲
            </div>
          )}
        </div>

        {/* Sleek Tri-Column Metrics with Vertical Dividers */}
        <div className="flex items-center justify-between">
          {/* Velocity Column */}
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              Velocity
            </span>
            <div className="flex items-baseline">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-zinc-100">
                {speedDisplay}
              </span>
              <button
                id="speed-unit-toggle"
                onClick={() => setUnit(unit === 'mph' ? 'kmh' : 'mph')}
                className="text-[10px] uppercase font-mono text-zinc-500 hover:text-red-500 ml-1.5 cursor-pointer transition font-bold"
                title="Toggle Speed Unit"
              >
                {unit.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="w-[1px] h-10 bg-zinc-800"></div>

          {/* Torque Column */}
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              Torque
            </span>
            <span className="text-3xl sm:text-4xl font-mono font-bold text-zinc-100">
              {Math.round(118 * (telemetry.throttlePercent / 100) + 12)}
              <span className="text-sm text-zinc-500 ml-1 font-normal">NM</span>
            </span>
          </div>

          <div className="w-[1px] h-10 bg-zinc-800"></div>

          {/* Throttle Column */}
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              Throttle
            </span>
            <span className="text-3xl sm:text-4xl font-mono font-bold text-red-600">
              {telemetry.throttlePercent}%
            </span>
          </div>

          <div className="w-[1px] h-10 bg-zinc-800"></div>

          {/* Gear Column */}
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              Gear
            </span>
            <span className="text-3xl sm:text-4xl font-mono font-black text-zinc-100">
              {telemetry.gear}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Dynamic Badges */}
      <div className="flex gap-2 flex-wrap">
        {/* Downforce Badge */}
        <div className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <Wind className="w-3 h-3 text-zinc-400" />
          <span>AERO: <strong className="text-zinc-100 font-bold">{telemetry.downforceKg} KG</strong></span>
        </div>

        {/* Turbo / Boost Badge */}
        <div className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <Zap className={`w-3 h-3 ${isNitro ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`} />
          <span>
            {isNitro ? 'NITRO' : 'BOOST'}: <strong className={`font-bold ${isNitro ? 'text-red-500' : 'text-zinc-100'}`}>+{telemetry.turboBoostBar} BAR</strong>
          </span>
        </div>

        {/* Live FPS */}
        <div className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <Disc3 className="w-3 h-3 text-red-600 animate-spin" style={{ animationDuration: '4s' }} />
          <span>60 FPS</span>
        </div>
      </div>
    </div>
  );
};


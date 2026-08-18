import React from 'react';
import { SuperbikeSpecs } from '../types';
import { Shield, Zap, Wind, Disc, Award, Cpu } from 'lucide-react';

interface VehicleSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APEX_SPECS: SuperbikeSpecs = {
  modelName: 'APEX CRIMSON HYPERSPORT',
  codename: 'PROJECT PROTO-998 // MK IV',
  engine: '998cc DOHC 16-Valve Inline-4 Crossplane',
  displacement: '998 cc (60.9 cu in)',
  power: '215 HP @ 14,200 RPM (228 HP with Ram-Air)',
  torque: '118 Nm @ 11,500 RPM',
  topSpeed: '335+ KM/H (208+ MPH)',
  dryWeight: '174 kg (383 lbs) Dry Carbon Monocoque',
  acceleration0to100: '2.48 seconds (0-60 mph in 2.3s)',
  frame: 'Toray T1000 Carbon Fiber Monocoque & Magnesium Subframe',
  aerodynamics: 'Active Biplane Carbon Winglets (28 kg downforce @ 250 km/h)',
  brakes: 'Dual 330mm Brembo T-Drive Rotors + Stylema Monobloc Calipers',
  exhaust: 'Akrapovič Full Titanium 4-into-2-into-1 with Carbon End Cap',
};

export const VehicleSpecsModal: React.FC<VehicleSpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="vehicle-specs-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none font-sans"
    >
      <div
        id="vehicle-specs-modal-card"
        className="relative bg-[#050505] border border-zinc-800 p-6 sm:p-8 rounded-lg max-w-2xl w-full shadow-2xl text-zinc-100 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">
                Vehicle Specification // Dossier
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-zinc-100 mt-1 uppercase">
              {APEX_SPECS.modelName}
            </h2>
            <div className="text-xs font-mono text-zinc-500">{APEX_SPECS.codename}</div>
          </div>

          <button
            id="close-specs-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer font-mono text-xs"
          >
            ✕
          </button>
        </div>

        {/* Highlight Spec Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">PEAK OUTPUT</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-red-600">215 HP</div>
            <div className="text-[9px] text-zinc-500 font-mono">@ 14,200 RPM</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">0 - 100 KM/H</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-zinc-100">2.48 SEC</div>
            <div className="text-[9px] text-zinc-500 font-mono">LAUNCH CONTROL</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">TOP VELOCITY</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-zinc-100">335 KM/H</div>
            <div className="text-[9px] text-zinc-500 font-mono">AERO LIMITED</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">DRY WEIGHT</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-red-500">174 KG</div>
            <div className="text-[9px] text-zinc-500 font-mono">CARBON MONOCOQUE</div>
          </div>
        </div>

        {/* Detailed Engineering Breakdown */}
        <div className="space-y-2.5 text-xs font-mono bg-zinc-950 p-4 rounded-lg border border-zinc-800 max-h-[220px] overflow-y-auto">
          <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
            <span className="text-zinc-500">ENGINE ARCHITECTURE</span>
            <span className="text-zinc-200 text-right font-medium">{APEX_SPECS.engine}</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
            <span className="text-zinc-500">AERODYNAMICS</span>
            <span className="text-red-500 text-right font-medium">{APEX_SPECS.aerodynamics}</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
            <span className="text-zinc-500">CHASSIS & FRAME</span>
            <span className="text-zinc-200 text-right font-medium">{APEX_SPECS.frame}</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
            <span className="text-zinc-500">BRAKING SYSTEM</span>
            <span className="text-zinc-200 text-right font-medium">{APEX_SPECS.brakes}</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
            <span className="text-zinc-500">EXHAUST SYSTEM</span>
            <span className="text-zinc-200 text-right font-medium">{APEX_SPECS.exhaust}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">TRACTION CONTROL</span>
            <span className="text-red-500 text-right font-medium">6-Axis IMU Wet Surface Active Vectoring</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
          <span>MATTE BLACK & CRIMSON MOTORSPORT LIVERY</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-red-600 hover:bg-red-500 text-white font-bold transition font-mono uppercase tracking-wider text-xs cursor-pointer"
          >
            RETURN TO LIVE FEED
          </button>
        </div>
      </div>
    </div>
  );
};

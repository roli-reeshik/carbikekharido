import React, { useState, useEffect } from 'react';
import { CameraMode, ColorMood } from '../types';

interface CommercialOverlayProps {
  cameraMode: CameraMode;
  colorMood: ColorMood;
  speedKmh: number;
}

const TAGLINES = [
  'Experience the intersection of raw power and cinematic precision. Matte carbon fiber chassis with crimson-pulsing diagnostics.',
  'Aerodynamic biplane carbon winglets engineered with MotoGP active downforce protocols.',
  '998cc crossplane crankshaft screaming at 14,200 RPM with pure titanium Akrapovič exhaust.',
  'Wet-track dynamic traction recovery system maintaining razor-sharp stability at 300+ km/h.',
  'Ultra-lightweight Toray T1000 carbon monocoque architecture delivering 215 horsepower.',
];

export const CommercialOverlay: React.FC<CommercialOverlayProps> = ({
  cameraMode,
  colorMood,
  speedKmh,
}) => {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [timecode, setTimecode] = useState('00:14:42:08');

  // Cycle commercial marketing taglines smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Timecode generator
  useEffect(() => {
    let frame = 880;
    const interval = setInterval(() => {
      frame++;
      const totalSec = Math.floor(frame / 30);
      const ff = String(frame % 30).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      const mm = String(Math.floor(totalSec / 60) % 60).padStart(2, '0');
      const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      setTimecode(`${hh}:${mm}:${ss}:${ff}`);
    }, 33.3);
    return () => clearInterval(interval);
  }, []);

  const getCameraName = () => {
    switch (cameraMode) {
      case 'low_tracking':
        return 'Camera A / Low Tracking';
      case 'wet_reflection':
        return 'Camera B / Wet Reflection';
      case 'front_pursuit':
        return 'Camera C / Front Pursuit';
      case 'cockpit_hud':
        return 'Camera D / Cockpit POV';
      case 'chase_cam':
        return 'Camera E / Rear Chase';
    }
  };

  return (
    <div
      id="commercial-cinematic-overlay"
      className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between px-6 sm:px-12 pt-24 pb-8 select-none"
    >
      {/* Top Left Active Session & Title Section */}
      <div className="max-w-2xl">
        <div className="flex items-center space-x-4 mb-3 sm:mb-4">
          <span className="px-2 py-0.5 bg-red-600 text-[10px] font-bold tracking-widest uppercase text-white rounded-sm">
            Active Session
          </span>
          <span className="text-zinc-500 text-[10px] tracking-widest uppercase font-mono">
            {timecode}
          </span>
          <span className="hidden sm:inline-block text-zinc-500 text-[10px] tracking-widest uppercase font-mono">
            // {getCameraName()}
          </span>
        </div>

        {/* Hero Display Typography */}
        <h1 className="text-4xl sm:text-7xl lg:text-[88px] leading-none font-black tracking-tighter italic uppercase mb-2 text-zinc-100 drop-shadow-md">
          Apex V-4 <span className="block text-red-600">Nightfall</span>
        </h1>

        {/* Tagline Subtext */}
        <p className="text-zinc-400 text-xs sm:text-sm max-w-lg font-light leading-relaxed transition-opacity duration-700">
          {TAGLINES[taglineIndex]}
        </p>
      </div>

      {/* Footer Meta & Recording Indicator */}
      <div className="flex justify-between items-end">
        {/* Left Camera Status Preview Boxes */}
        <div className="hidden lg:flex space-x-4">
          <div className="p-3 border border-zinc-800 bg-zinc-900/50 backdrop-blur-md rounded-lg">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">{getCameraName()}</div>
            <div className="w-28 h-12 bg-zinc-800/80 relative overflow-hidden rounded flex items-center justify-center border border-zinc-700/30">
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 to-transparent"></div>
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            </div>
          </div>

          <div className="p-3 border border-zinc-800 bg-zinc-900/50 backdrop-blur-md rounded-lg">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">Optics Spectrum</div>
            <div className="w-28 h-12 border border-zinc-700/40 bg-zinc-900/60 rounded flex items-center justify-center space-x-1.5">
              <div className="w-1 h-3 bg-zinc-700"></div>
              <div className="w-1 h-7 bg-red-600"></div>
              <div className="w-1 h-5 bg-zinc-600"></div>
              <div className="w-1 h-8 bg-red-500"></div>
              <div className="w-1 h-4 bg-zinc-700"></div>
            </div>
          </div>
        </div>

        {/* Right Camera Specs & Red Recording Pill */}
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 font-mono space-y-0.5">
            <div>RESOLUTION: 3840 X 2160 [4K]</div>
            <div>FPS: 60.00 | SHUTTER: 1/120</div>
            <div>ISO: 800 | COLOR: V-LOG PRO</div>
          </div>
          <div className="mt-2.5 flex space-x-2 justify-end items-center">
            <div className="w-3 h-3 rounded-full border border-red-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
            </div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
              Live Feed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


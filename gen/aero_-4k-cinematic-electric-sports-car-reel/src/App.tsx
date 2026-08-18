/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CinematicViewport } from './components/CinematicViewport';
import { DirectorControls } from './components/DirectorControls';
import { TelemetryHUD } from './components/TelemetryHUD';
import { AIDirectorPanel } from './components/AIDirectorPanel';
import { CinematicSettings, TelemetryData, CameraAngle, LUTPreset } from './types';
import { cinematicAudio } from './utils/audioSynthesizer';
import { Eye, EyeOff, Sparkles, Sliders, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_SETTINGS: CinematicSettings = {
  isPlaying: true,
  speedMph: 68,
  slowMoRate: 0.5, // 0.5x cinematic slow motion
  shutterAngle: 180,
  cameraAngle: 'profile_tracking',
  lutPreset: 'arri_golden',
  exposure: 0.0,
  warmth: 0.25,
  flareIntensity: 0.95,
  filmGrain: 0.2,
  dustDensity: 0.65,
  sunElevation: 18,
  motionBlur: true,
  chromaticAberration: true,
  cinemaLetterbox: true,
  activeAero: true,
  audioEnabled: false, // User can click to enable audio
  masterVolume: 0.8,
  pureCinemaMode: false,
};

const INITIAL_TELEMETRY: TelemetryData = {
  speedMph: 68,
  motorPowerKw: 310,
  gForceLat: 0.24,
  gForceLong: 0.15,
  batteryPct: 84,
  downforceKg: 185,
  tirePressurePsi: 38.2,
  roadGripPct: 98,
  activeWingAngleDeg: 14,
};

export default function App() {
  const [settings, setSettings] = useState<CinematicSettings>(INITIAL_SETTINGS);
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [showExitPureCinema, setShowExitPureCinema] = useState(false);
  const exitPureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and synchronize audio synthesizer
  useEffect(() => {
    if (settings.audioEnabled) {
      cinematicAudio.init();
    }
    cinematicAudio.updateParameters(
      settings.speedMph,
      settings.slowMoRate,
      settings.isPlaying,
      settings.masterVolume,
      settings.audioEnabled
    );
  }, [
    settings.audioEnabled,
    settings.isPlaying,
    settings.speedMph,
    settings.slowMoRate,
    settings.masterVolume,
  ]);

  const updateSettings = useCallback(
    (updater: (prev: CinematicSettings) => CinematicSettings) => {
      setSettings((prev) => updater(prev));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings((prev) => ({
      ...INITIAL_SETTINGS,
      audioEnabled: prev.audioEnabled,
    }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Keyboard Shortcuts for Film Director
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setSettings((s) => ({ ...s, isPlaying: !s.isPlaying }));
      } else if (e.key === 'p' || e.key === 'P') {
        setSettings((s) => ({ ...s, pureCinemaMode: !s.pureCinemaMode }));
      } else if (e.key === 'm' || e.key === 'M') {
        setSettings((s) => ({ ...s, audioEnabled: !s.audioEnabled }));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        const angles: CameraAngle[] = [
          'profile_tracking',
          'chase_front',
          'cliff_drone',
          'wheel_macro',
          'cockpit_sunset',
        ];
        setSettings((s) => {
          const nextIdx = (angles.indexOf(s.cameraAngle) + 1) % angles.length;
          return { ...s, cameraAngle: angles[nextIdx] };
        });
      } else if (e.key === 'l' || e.key === 'L') {
        const luts: LUTPreset[] = [
          'arri_golden',
          'kodak_vision3',
          'teal_orange',
          'monochrome_noir',
          'bleach_bypass',
          'cyber_charcoal',
        ];
        setSettings((s) => {
          const nextIdx = (luts.indexOf(s.lutPreset) + 1) % luts.length;
          return { ...s, lutPreset: luts[nextIdx] };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  // Handle Pure Cinema mouse hover reveal for exit button
  const handleMouseMove = () => {
    if (!settings.pureCinemaMode) return;
    setShowExitPureCinema(true);
    if (exitPureTimeoutRef.current) clearTimeout(exitPureTimeoutRef.current);
    exitPureTimeoutRef.current = setTimeout(() => {
      setShowExitPureCinema(false);
    }, 2800);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-[#0a0c10] flex flex-col justify-between overflow-hidden font-sans text-white antialiased select-none"
    >
      {/* Frosted Glass Ambient Lighting Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 75% 25%, #f59e0b 0%, transparent 45%), radial-gradient(circle at 20% 80%, #334155 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      />

      {/* Frosted Glass Top Navigation Header */}
      <AnimatePresence>
        {!settings.pureCinemaMode && (
          <motion.header
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-30 flex justify-between items-center px-6 py-3.5 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-xl font-black tracking-tighter text-white">
                VERTEX <span className="text-amber-500 font-extrabold">E-1</span>
              </div>
              <span className="hidden sm:inline-block w-px h-4 bg-white/20" />
              <span className="hidden sm:inline-block text-[11px] font-mono tracking-[0.25em] text-slate-300 uppercase">
                CHARCOAL STORM // 4K 60FPS
              </span>
            </div>

            <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-300">
              <button
                onClick={() => updateSettings((s) => ({ ...s, cameraAngle: 'profile_tracking' }))}
                className={`transition-colors ${
                  settings.cameraAngle === 'profile_tracking' ? 'text-amber-400 font-black' : 'hover:text-white'
                }`}
              >
                Side-Profile
              </button>
              <button
                onClick={() => updateSettings((s) => ({ ...s, cameraAngle: 'chase_front' }))}
                className={`transition-colors ${
                  settings.cameraAngle === 'chase_front' ? 'text-amber-400 font-black' : 'hover:text-white'
                }`}
              >
                Front Chase
              </button>
              <button
                onClick={() => updateSettings((s) => ({ ...s, cameraAngle: 'cliff_drone' }))}
                className={`transition-colors ${
                  settings.cameraAngle === 'cliff_drone' ? 'text-amber-400 font-black' : 'hover:text-white'
                }`}
              >
                Cliff Drone
              </button>
              <button
                onClick={() => updateSettings((s) => ({ ...s, cameraAngle: 'wheel_macro' }))}
                className={`transition-colors ${
                  settings.cameraAngle === 'wheel_macro' ? 'text-amber-400 font-black' : 'hover:text-white'
                }`}
              >
                21" Rim Macro
              </button>
              <button
                onClick={() => updateSettings((s) => ({ ...s, cameraAngle: 'cockpit_sunset' }))}
                className={`transition-colors ${
                  settings.cameraAngle === 'cockpit_sunset' ? 'text-amber-400 font-black' : 'hover:text-white'
                }`}
              >
                Cockpit Horizon
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => updateSettings((s) => ({ ...s, pureCinemaMode: true }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Eye size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Pure Reel</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main 60FPS High-Definition Viewport */}
      <div className="relative flex-1 w-full h-full min-h-0 z-10">
        <CinematicViewport settings={settings} setTelemetry={setTelemetry} />

        {/* Telemetry HUD & AI Director Panel (Hidden in Pure Cinema Mode as requested for pristine seamless commercial reel) */}
        <AnimatePresence>
          {!settings.pureCinemaMode && (
            <>
              <TelemetryHUD key="telemetry-hud" telemetry={telemetry} />
              <AIDirectorPanel key="director-panel" settings={settings} />

              {/* Quick Audio Hint Notification if unmuted */}
              {!settings.audioEnabled && (
                <motion.div
                  key="audio-hint-prompt"
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-6 left-6 z-20 pointer-events-auto"
                >
                  <button
                    onClick={() => setSettings((s) => ({ ...s, audioEnabled: true }))}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-400 border border-white/20 text-xs font-bold uppercase tracking-wider shadow-2xl backdrop-blur-2xl transition-all hover:scale-105"
                  >
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Enable Dual-Motor EV Audio</span>
                  </button>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Floating Minimal Exit Button for Pure Cinema Loop */}
        <AnimatePresence>
          {settings.pureCinemaMode && showExitPureCinema && (
            <motion.div
              key="pure-cinema-exit"
              initial={{ opacity: 0, y: -20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.92 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-6 right-6 z-30 pointer-events-auto"
            >
              <button
                onClick={() => setSettings((s) => ({ ...s, pureCinemaMode: false }))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-bold uppercase tracking-widest backdrop-blur-2xl shadow-2xl transition-all hover:scale-105"
              >
                <Eye size={15} className="text-amber-400" />
                <span>Exit Pure Cinema (Press 'P')</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Bottom Director Control Bar */}
      <AnimatePresence>
        {!settings.pureCinemaMode && (
          <motion.div
            key="director-controls-bar"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full z-30"
          >
            <DirectorControls
              settings={settings}
              updateSettings={updateSettings}
              onReset={resetSettings}
              onToggleFullscreen={toggleFullscreen}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

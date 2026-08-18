import React from 'react';
import { CameraAngle, CinematicSettings, LUTPreset } from '../types';
import {
  Play,
  Pause,
  Camera,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Sparkles,
  Gauge,
  Layers,
  Sun,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

interface DirectorControlsProps {
  settings: CinematicSettings;
  updateSettings: (updater: (prev: CinematicSettings) => CinematicSettings) => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
}

export const DirectorControls: React.FC<DirectorControlsProps> = ({
  settings,
  updateSettings,
  onReset,
  onToggleFullscreen,
}) => {
  const cameraAngles: { id: CameraAngle; label: string; desc: string }[] = [
    { id: 'profile_tracking', label: 'Parallel Profile', desc: 'Sleek lateral tracking parallel with coastal road' },
    { id: 'chase_front', label: '3/4 Chase Low', desc: 'Aggressive front fascia with golden reflections' },
    { id: 'cliff_drone', label: 'Cliffside Vista', desc: 'Epic aerial panorama following highway ribbon' },
    { id: 'wheel_macro', label: '21" Rim & Dust', desc: 'Turbine rim rotational blur & glowing tire dust' },
    { id: 'cockpit_sunset', label: 'Cockpit View', desc: 'Driver perspective over yoke toward golden horizon' },
  ];

  const lutPresets: { id: LUTPreset; label: string; color: string }[] = [
    { id: 'arri_golden', label: 'ARRI Alexa Golden', color: 'bg-amber-500' },
    { id: 'kodak_vision3', label: 'Kodak Vision3 500T', color: 'bg-yellow-600' },
    { id: 'teal_orange', label: 'Teal & Orange Sunset', color: 'bg-cyan-600' },
    { id: 'monochrome_noir', label: 'Silver Nitrate Noir', color: 'bg-slate-400' },
    { id: 'bleach_bypass', label: 'Bleach Bypass', color: 'bg-stone-400' },
    { id: 'cyber_charcoal', label: 'Midnight Carbon', color: 'bg-indigo-600' },
  ];

  const slowMoPresets = [
    { rate: 0.1, label: '0.1x Bullet' },
    { rate: 0.25, label: '0.25x Slo-Mo' },
    { rate: 0.5, label: '0.5x Cinema' },
    { rate: 1.0, label: '1.0x Real-Time' },
    { rate: 2.0, label: '2.0x Warp' },
  ];

  return (
    <div className="w-full bg-white/5 backdrop-blur-2xl border-t border-white/10 p-5 text-white text-sm z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Control Bar: Playback, Slow-Mo Presets, Speed, Camera Angles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          {/* Play/Pause & Speed Info */}
          <div className="flex items-center gap-3">
            <button
              id="btn-play-pause"
              onClick={() => updateSettings((s) => ({ ...s, isPlaying: !s.isPlaying }))}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-xl hover:scale-105 active:scale-95 ${
                settings.isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              {settings.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{settings.isPlaying ? 'PAUSE' : 'PLAY 60FPS'}</span>
            </button>

            {/* Slow-Mo Rate Pills */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
              {slowMoPresets.map((preset) => (
                <button
                  key={preset.rate}
                  onClick={() => updateSettings((s) => ({ ...s, slowMoRate: preset.rate }))}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all whitespace-nowrap ${
                    settings.slowMoRate === preset.rate
                      ? 'bg-white/20 text-amber-400 font-bold border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions (Cinema Mode, Audio, Fullscreen) */}
          <div className="flex items-center gap-2">
            <button
              id="btn-pure-cinema-toggle"
              onClick={() => updateSettings((s) => ({ ...s, pureCinemaMode: !s.pureCinemaMode }))}
              title="Toggle Pure Commercial Loop"
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all ${
                settings.pureCinemaMode
                  ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
              }`}
            >
              {settings.pureCinemaMode ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{settings.pureCinemaMode ? 'Exit Cinema' : 'Pure Cinema Loop'}</span>
            </button>

            <button
              id="btn-audio-toggle"
              onClick={() => updateSettings((s) => ({ ...s, audioEnabled: !s.audioEnabled }))}
              title="EV Motor & Coastal Audio"
              className={`p-2.5 rounded-2xl border transition-all ${
                settings.audioEnabled
                  ? 'bg-white/20 text-amber-400 border-amber-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              {settings.audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              id="btn-fullscreen-toggle"
              onClick={onToggleFullscreen}
              title="Fullscreen"
              className="p-2.5 rounded-2xl bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10 transition-all"
            >
              <Maximize2 size={16} />
            </button>

            <button
              id="btn-reset-defaults"
              onClick={onReset}
              title="Reset Settings"
              className="p-2.5 rounded-2xl bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10 transition-all"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Middle Bar: Camera Angles & LUT Color Grading */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Camera Angles Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-widest font-bold">
              <Camera size={13} className="text-amber-500" />
              <span>Cinematography Angles</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cameraAngles.map((cam) => (
                <button
                  key={cam.id}
                  id={`cam-btn-${cam.id}`}
                  onClick={() => updateSettings((s) => ({ ...s, cameraAngle: cam.id }))}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                    settings.cameraAngle === cam.id
                      ? 'bg-white/15 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-bold text-xs text-white">{cam.label}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-light">{cam.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* LUT Color Grading Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-widest font-bold">
              <Film size={13} className="text-amber-500" />
              <span>Color Grading Film Stock (LUT)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {lutPresets.map((lut) => (
                <button
                  key={lut.id}
                  id={`lut-btn-${lut.id}`}
                  onClick={() => updateSettings((s) => ({ ...s, lutPreset: lut.id }))}
                  className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                    settings.lutPreset === lut.id
                      ? 'bg-white/15 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${lut.color} shrink-0 ring-2 ring-white/20`} />
                  <span className="text-xs truncate">{lut.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Tuning Sliders: Vehicle Speed, Golden Hour Sun, Lens Flare, Tire Dust, Film Grain */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-white/10 text-xs">
          {/* Speed */}
          <div className="space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Gauge size={12} className="text-amber-500" /> Speed</span>
              <span className="font-mono text-amber-400">{settings.speedMph} MPH</span>
            </div>
            <input
              type="range"
              min="0"
              max="140"
              step="1"
              value={settings.speedMph}
              onChange={(e) => updateSettings((s) => ({ ...s, speedMph: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Anamorphic Flare */}
          <div className="space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500" /> Lens Flare</span>
              <span className="font-mono text-amber-400">{Math.round(settings.flareIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings.flareIntensity}
              onChange={(e) => updateSettings((s) => ({ ...s, flareIntensity: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Tire Road Dust */}
          <div className="space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Layers size={12} className="text-amber-500" /> Road Dust</span>
              <span className="font-mono text-amber-400">{Math.round(settings.dustDensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings.dustDensity}
              onChange={(e) => updateSettings((s) => ({ ...s, dustDensity: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Sun Elevation */}
          <div className="space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Sun size={12} className="text-amber-500" /> Sun Angle</span>
              <span className="font-mono text-amber-400">{settings.sunElevation}°</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={settings.sunElevation}
              onChange={(e) => updateSettings((s) => ({ ...s, sunElevation: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* 35mm Film Grain */}
          <div className="space-y-1.5 bg-white/5 p-3 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Film size={12} className="text-amber-500" /> 35mm Grain</span>
              <span className="font-mono text-amber-400">{Math.round(settings.filmGrain * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={settings.filmGrain}
              onChange={(e) => updateSettings((s) => ({ ...s, filmGrain: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Camera,
  Volume2,
  VolumeX,
  Play,
  Flame,
  CloudRain,
  Droplets,
  Eye,
  Sliders,
  Maximize,
  Sparkles,
  Layers,
  Info,
  Download,
  Gauge,
  Film
} from 'lucide-react';
import { CameraMode, ColorMood, SceneSettings, AspectRatioMode } from '../types';

interface DirectorControlsProps {
  settings: SceneSettings;
  onChangeSettings: (newSettings: Partial<SceneSettings>) => void;
  onOpenSpecs: () => void;
  onOpenHelp: () => void;
}

export const DirectorControls: React.FC<DirectorControlsProps> = ({
  settings,
  onChangeSettings,
  onOpenSpecs,
  onOpenHelp,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'camera' | 'speed' | 'environment' | 'optics'>('camera');

  const cameraModes: Array<{ id: CameraMode; label: string; desc: string }> = [
    { id: 'low_tracking', label: 'Low Tracking', desc: 'Low asphalt high-speed profile track' },
    { id: 'wet_reflection', label: 'Wet Reflection', desc: 'Ultra-low wet road mirror reflection' },
    { id: 'front_pursuit', label: 'Front Pursuit', desc: 'Aggressive frontal 3/4 pursuit angle' },
    { id: 'cockpit_hud', label: 'Cockpit POV', desc: 'First person rider cockpit viewport' },
    { id: 'chase_cam', label: 'Rear Chase', desc: 'Dynamic wide rear chase tracking' },
  ];

  const colorMoods: Array<{ id: ColorMood; label: string; accent: string }> = [
    { id: 'dusk_crimson', label: 'Dusk Crimson', accent: '#dc2626' },
    { id: 'tokyo_cyber', label: 'Tokyo Cyber', accent: '#06b6d4' },
    { id: 'monolith_stealth', label: 'Monolith Noir', accent: '#71717a' },
    { id: 'golden_hour', label: 'Golden Dusk', accent: '#f97316' },
  ];

  // Capture canvas image
  const handleSnapshot = () => {
    const canvas = document.getElementById('superbike-cinematic-stage') as HTMLCanvasElement;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `VULCAN_APEX_V4_4K_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      id="director-controls-panel"
      className="absolute bottom-8 right-6 sm:right-12 z-30 pointer-events-auto flex flex-col items-end select-none font-sans"
    >
      {/* Control Deck Floating Toggle if minimized */}
      {!isOpen && (
        <button
          id="director-deck-expand-btn"
          onClick={() => setIsOpen(true)}
          className="bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 border border-zinc-800 hover:border-red-600 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs uppercase tracking-widest font-mono backdrop-blur-md transition-all duration-300 group cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-red-600 group-hover:rotate-45 transition-transform" />
          <span>Director Console</span>
        </button>
      )}

      {/* Main Director Control Deck */}
      {isOpen && (
        <div className="bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 p-4 sm:p-5 rounded-lg shadow-2xl w-[310px] sm:w-[360px] flex flex-col gap-4 text-zinc-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
              <h2 className="font-mono font-bold text-xs tracking-[0.2em] text-zinc-100 uppercase">
                Director Controls
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="audio-toggle-btn"
                onClick={() => onChangeSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-1.5 rounded-sm border transition cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title={settings.soundEnabled ? 'Mute Engine' : 'Unmute Engine Sound'}
              >
                {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                id="specs-btn"
                onClick={onOpenSpecs}
                className="p-1.5 rounded-sm border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Superbike Tech Specs"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              <button
                id="director-minimize-btn"
                onClick={() => setIsOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/90 rounded border border-zinc-800 text-[10px] font-mono tracking-wider">
            <button
              onClick={() => setActiveTab('camera')}
              className={`py-1.5 rounded-sm text-center transition cursor-pointer ${
                activeTab === 'camera' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              CAMERA
            </button>
            <button
              onClick={() => setActiveTab('speed')}
              className={`py-1.5 rounded-sm text-center transition cursor-pointer ${
                activeTab === 'speed' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              THROTTLE
            </button>
            <button
              onClick={() => setActiveTab('environment')}
              className={`py-1.5 rounded-sm text-center transition cursor-pointer ${
                activeTab === 'environment' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              WEATHER
            </button>
            <button
              onClick={() => setActiveTab('optics')}
              className={`py-1.5 rounded-sm text-center transition cursor-pointer ${
                activeTab === 'optics' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              OPTICS
            </button>
          </div>

          {/* Tab 1: Camera Modes */}
          {activeTab === 'camera' && (
            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex justify-between items-center">
                <span>Viewpoint Angles</span>
                <button
                  onClick={() => onChangeSettings({ autoDirector: !settings.autoDirector })}
                  className={`text-[9px] px-2 py-0.5 rounded-sm border transition cursor-pointer ${
                    settings.autoDirector
                      ? 'bg-red-600/20 border-red-500 text-red-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  AUTO {settings.autoDirector ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {cameraModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onChangeSettings({ cameraMode: mode.id, autoDirector: false })}
                    className={`flex items-center justify-between p-2 rounded-sm border text-left transition cursor-pointer ${
                      settings.cameraMode === mode.id
                        ? 'bg-red-600/10 border-red-600 text-white'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold">{mode.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{mode.desc}</div>
                    </div>
                    {settings.cameraMode === mode.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Low Camera Pan Up slider */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>CAMERA PAN ELEVATION</span>
                  <span className="text-red-500 font-bold">{Math.round(settings.cameraPanUp * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.cameraPanUp}
                  onChange={(e) => onChangeSettings({ cameraPanUp: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Throttle & Speed Control */}
          {activeTab === 'speed' && (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Velocity Configuration</div>

              {/* Speed Target Slider */}
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-zinc-400">TARGET SPEED</span>
                  <span className="text-red-600 font-bold">{Math.round(settings.targetSpeed)} KM/H</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="330"
                  step="5"
                  value={settings.targetSpeed}
                  onChange={(e) => onChangeSettings({ targetSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Quick Speed Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => onChangeSettings({ targetSpeed: 0, throttle: 0.1 })}
                  className="py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-zinc-300"
                >
                  IDLE
                </button>
                <button
                  onClick={() => onChangeSettings({ targetSpeed: 120, throttle: 0.5 })}
                  className="py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-zinc-300"
                >
                  120 KM
                </button>
                <button
                  onClick={() => onChangeSettings({ targetSpeed: 220, throttle: 0.85 })}
                  className="py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-zinc-300"
                >
                  220 KM
                </button>
                <button
                  onClick={() => onChangeSettings({ targetSpeed: 320, throttle: 1.0 })}
                  className="py-1.5 rounded-sm bg-zinc-900 border border-red-600/60 hover:border-red-600 transition cursor-pointer text-red-500 font-bold"
                >
                  TOP
                </button>
              </div>

              {/* Nitro Boost Button */}
              <button
                id="nitro-boost-btn"
                onMouseDown={() => onChangeSettings({ nitroBoost: true, targetSpeed: 335, throttle: 1.0 })}
                onMouseUp={() => onChangeSettings({ nitroBoost: false })}
                onTouchStart={() => onChangeSettings({ nitroBoost: true, targetSpeed: 335, throttle: 1.0 })}
                onTouchEnd={() => onChangeSettings({ nitroBoost: false })}
                className={`py-2.5 rounded-sm font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  settings.nitroBoost
                    ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]'
                    : 'bg-zinc-900 border border-zinc-800 hover:border-red-600 text-zinc-200'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${settings.nitroBoost ? 'animate-bounce text-white' : 'text-red-600'}`} />
                <span>{settings.nitroBoost ? 'NITRO ENGAGED' : 'HOLD FOR NITRO BOOST'}</span>
              </button>
            </div>
          )}

          {/* Tab 3: Environment & Dusk Mood */}
          {activeTab === 'environment' && (
            <div className="flex flex-col gap-3">
              {/* Color Grading Moods */}
              <div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1.5">Color Palette</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {colorMoods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => onChangeSettings({ colorMood: mood.id })}
                      className={`p-2 rounded-sm border text-left text-[11px] font-mono flex items-center gap-2 transition cursor-pointer ${
                        settings.colorMood === mood.id
                          ? 'bg-red-600/10 border-red-600 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: mood.accent }}
                      />
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wet Asphalt & Rain Sliders */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-red-500" />
                      <span>WET ASPHALT REFLECTION</span>
                    </span>
                    <span className="text-red-500 font-bold">{Math.round(settings.wetness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.wetness}
                    onChange={(e) => onChangeSettings({ wetness: parseFloat(e.target.value) })}
                    className="w-full accent-red-600 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-zinc-400" />
                      <span>RAIN PARTICLES & MIST</span>
                    </span>
                    <span className="text-zinc-200 font-bold">{Math.round(settings.rainIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.rainIntensity}
                    onChange={(e) => onChangeSettings({ rainIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-red-600 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Optics & Frame Layout */}
          {activeTab === 'optics' && (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Optics & Canvas Format</div>

              {/* Aspect Ratio Mode */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <button
                  onClick={() => onChangeSettings({ aspectRatio: 'cinemascope' })}
                  className={`py-1.5 rounded-sm border text-center transition cursor-pointer ${
                    settings.aspectRatio === 'cinemascope'
                      ? 'bg-red-600 text-white font-bold border-red-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  2.39:1 SCOPE
                </button>
                <button
                  onClick={() => onChangeSettings({ aspectRatio: 'standard' })}
                  className={`py-1.5 rounded-sm border text-center transition cursor-pointer ${
                    settings.aspectRatio === 'standard'
                      ? 'bg-red-600 text-white font-bold border-red-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  16:9 4K
                </button>
                <button
                  onClick={() => onChangeSettings({ aspectRatio: 'imax' })}
                  className={`py-1.5 rounded-sm border text-center transition cursor-pointer ${
                    settings.aspectRatio === 'imax'
                      ? 'bg-red-600 text-white font-bold border-red-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  1.43:1 IMAX
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-1 pt-1 text-[10px] font-mono">
                <button
                  onClick={() => onChangeSettings({ anamorphicFlare: !settings.anamorphicFlare })}
                  className="w-full flex items-center justify-between p-2 rounded-sm bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
                >
                  <span>ANAMORPHIC RED FLARE</span>
                  <span className={settings.anamorphicFlare ? 'text-red-500 font-bold' : 'text-zinc-600'}>
                    {settings.anamorphicFlare ? 'ENABLED' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => onChangeSettings({ showTelemetry: !settings.showTelemetry })}
                  className="w-full flex items-center justify-between p-2 rounded-sm bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
                >
                  <span>TELEMETRY METRICS</span>
                  <span className={settings.showTelemetry ? 'text-red-500 font-bold' : 'text-zinc-600'}>
                    {settings.showTelemetry ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                </button>

                <button
                  onClick={() => onChangeSettings({ showCommercialTitles: !settings.showCommercialTitles })}
                  className="w-full flex items-center justify-between p-2 rounded-sm bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
                >
                  <span>CINEMATIC TITLES</span>
                  <span className={settings.showCommercialTitles ? 'text-red-500 font-bold' : 'text-zinc-600'}>
                    {settings.showCommercialTitles ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Row: 4K Wallpaper Capture & Keyboard Help */}
          <div className="border-t border-zinc-800 pt-3 flex items-center justify-between gap-2">
            <button
              id="capture-4k-btn"
              onClick={handleSnapshot}
              className="flex-1 py-2 px-3 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-mono text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-red-600" />
              <span>Capture 4K Frame</span>
            </button>

            <button
              id="keyboard-help-btn"
              onClick={onOpenHelp}
              className="py-2 px-3 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 font-mono text-[10px] border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
            >
              KEYS [?]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

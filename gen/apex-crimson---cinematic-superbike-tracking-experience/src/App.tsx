import React, { useState, useEffect, useCallback } from 'react';
import { CinematicCanvas } from './components/CinematicCanvas';
import { TelemetryHUD } from './components/TelemetryHUD';
import { CommercialOverlay } from './components/CommercialOverlay';
import { DirectorControls } from './components/DirectorControls';
import { VehicleSpecsModal } from './components/VehicleSpecsModal';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { audioEngine } from './utils/audioEngine';
import { CameraMode, ColorMood, SceneSettings, TelemetryData } from './types';
import { Camera, Volume2, VolumeX, Eye, EyeOff, Film, Zap, Layers, Sparkles, Download, Info } from 'lucide-react';

export default function App() {
  // Initial Scene Settings configured to match prompt precisely
  const [settings, setSettings] = useState<SceneSettings>({
    cameraMode: 'low_tracking',
    colorMood: 'dusk_crimson',
    aspectRatio: 'cinemascope',
    targetSpeed: 195,
    speedKmh: 195,
    throttle: 0.75,
    brake: 0,
    nitroBoost: false,
    wetness: 0.85,
    rainIntensity: 0.35,
    motionBlurAmount: 0.65,
    cameraPanUp: 0.4,
    cameraShake: 0.35,
    anamorphicFlare: true,
    soundEnabled: false,
    soundVolume: 0.7,
    autoDirector: false,
    showTelemetry: true,
    showCommercialTitles: true,
    isCinemaBars: true,
  });

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speedKmh: 195,
    speedMph: 121,
    rpm: 9400,
    maxRpm: 14500,
    gear: 4,
    leanAngle: 0,
    throttlePercent: 75,
    brakePercent: 0,
    gForceLateral: 0.15,
    gForceLongitudinal: 0.42,
    downforceKg: 24,
    turboBoostBar: 1.45,
    distanceKm: 8.4,
    currentFps: 60,
  });

  const [cleanScreenMode, setCleanScreenMode] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleUpdateTelemetry = useCallback((newTelemetry: TelemetryData) => {
    setTelemetry(newTelemetry);
  }, []);

  const handleChangeSettings = useCallback((newSettings: Partial<SceneSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.soundEnabled && !prev.soundEnabled) {
        audioEngine.init();
      }
      return updated;
    });
  }, []);

  // Initialize Web Audio on first user interaction
  const handleUserGesture = () => {
    if (!settings.soundEnabled) {
      audioEngine.init();
    }
  };

  // Keyboard Event Listeners for interactive superbike driving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleUserGesture();

      if (e.repeat && e.key.toLowerCase() !== 'w' && e.key !== 'ArrowUp') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setSettings((prev) => ({
            ...prev,
            targetSpeed: Math.min(335, prev.targetSpeed + 15),
            throttle: 1.0,
            brake: 0,
          }));
          break;
        case 's':
        case 'arrowdown':
          setSettings((prev) => ({
            ...prev,
            targetSpeed: Math.max(0, prev.targetSpeed - 35),
            throttle: 0,
            brake: 0.85,
          }));
          break;
        case ' ': // Space for Nitro
          e.preventDefault();
          setSettings((prev) => ({
            ...prev,
            nitroBoost: true,
            targetSpeed: 335,
            throttle: 1.0,
          }));
          break;
        case 'c': // Cycle camera
          setSettings((prev) => {
            const modes: CameraMode[] = ['low_tracking', 'wet_reflection', 'front_pursuit', 'cockpit_hud', 'chase_cam'];
            const nextIdx = (modes.indexOf(prev.cameraMode) + 1) % modes.length;
            return { ...prev, cameraMode: modes[nextIdx], autoDirector: false };
          });
          break;
        case 'm': // Mute toggle
          setSettings((prev) => {
            const nextVal = !prev.soundEnabled;
            if (nextVal) audioEngine.init();
            return { ...prev, soundEnabled: nextVal };
          });
          break;
        case 'h': // Toggle Clean Screen HUD
          setCleanScreenMode((prev) => !prev);
          break;
        case 'p': // Photo capture
          const canvas = document.getElementById('superbike-cinematic-stage') as HTMLCanvasElement;
          if (canvas) {
            const link = document.createElement('a');
            link.download = `APEX_CRIMSON_4K_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          setSettings((prev) => ({ ...prev, nitroBoost: false }));
          break;
        case 'w':
        case 'arrowup':
          setSettings((prev) => ({ ...prev, throttle: 0.7 }));
          break;
        case 's':
        case 'arrowdown':
          setSettings((prev) => ({ ...prev, brake: 0 }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings.soundEnabled]);

  // Auto-Director camera mode cycler
  useEffect(() => {
    if (!settings.autoDirector) return;
    const modes: CameraMode[] = ['low_tracking', 'wet_reflection', 'front_pursuit', 'cockpit_hud', 'chase_cam'];
    let idx = 0;

    const interval = setInterval(() => {
      idx = (idx + 1) % modes.length;
      setSettings((prev) => ({ ...prev, cameraMode: modes[idx] }));
    }, 7000);

    return () => clearInterval(interval);
  }, [settings.autoDirector]);

  return (
    <main
      onClick={handleUserGesture}
      className="relative w-screen h-screen bg-[#050505] text-zinc-100 overflow-hidden flex flex-col justify-center items-center select-none font-sans"
    >
      {/* Sleek Interface Ambient Red Backdrop Accents & Laser Streaks */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute bottom-0 w-full h-[300px] bg-gradient-to-t from-[#1a0505] to-transparent opacity-40"></div>
        <div className="absolute top-[40%] left-[-10%] w-[120%] h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent blur-sm rotate-[-2deg] opacity-60"></div>
        <div className="absolute top-[45%] left-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent rotate-[-2deg] opacity-30"></div>
        <div className="absolute bottom-[100px] left-[20%] w-[400px] h-[600px] bg-red-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* 60FPS Cinematic WebGL / Canvas Viewport */}
      <CinematicCanvas
        settings={settings}
        onUpdateTelemetry={handleUpdateTelemetry}
      />

      {/* Sleek Top Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex justify-between items-center px-6 sm:px-12 py-5 sm:py-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        {/* Brand Emblem */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-600 flex items-center justify-center rounded-sm shadow-md">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-[0.3em] uppercase text-zinc-100">
              Vulcan <span className="text-red-600 font-black">V-4</span>
            </span>
          </div>
        </div>

        {/* Center Sleek Navigation Tabs */}
        <nav className="hidden md:flex space-x-8 text-[10px] tracking-[0.2em] uppercase font-medium text-zinc-400">
          {(['low_tracking', 'wet_reflection', 'front_pursuit', 'cockpit_hud', 'chase_cam'] as CameraMode[]).map((cam) => (
            <button
              key={cam}
              onClick={() => handleChangeSettings({ cameraMode: cam, autoDirector: false })}
              className={`transition-colors pb-1 cursor-pointer ${
                settings.cameraMode === cam
                  ? 'border-b border-red-600 text-white font-bold'
                  : 'hover:text-white'
              }`}
            >
              {cam.replace('_', ' ')}
            </button>
          ))}
        </nav>

        {/* Right Action Icons & Status */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Sound toggle */}
          <button
            id="top-audio-toggle"
            onClick={() => handleChangeSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-sm border transition cursor-pointer ${
              settings.soundEnabled
                ? 'bg-red-600 border-red-500 text-white shadow-lg'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
            }`}
            title={settings.soundEnabled ? 'Mute Engine' : 'Unmute Engine Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Clean Screen Mode Toggle */}
          <button
            id="clean-screen-toggle"
            onClick={() => setCleanScreenMode(!cleanScreenMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] tracking-widest font-mono-tech transition cursor-pointer ${
              cleanScreenMode
                ? 'bg-red-600/20 border-red-500 text-red-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
            title="Toggle Clean Screen HUD (H)"
          >
            {cleanScreenMode ? <Eye className="w-3 h-3 text-red-500" /> : <EyeOff className="w-3 h-3 text-zinc-400" />}
            <span className="hidden sm:inline">{cleanScreenMode ? 'RESTORE HUD' : 'CLEAN VIEW'}</span>
          </button>

          {/* Specs Modal Trigger */}
          <button
            id="specs-top-btn"
            onClick={() => setIsSpecsOpen(true)}
            className="p-2 rounded-sm bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="View Engineering Dossier"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Commercial Overlay (Taglines, 4K Timecode, Brand) */}
      {!cleanScreenMode && settings.showCommercialTitles && (
        <CommercialOverlay
          cameraMode={settings.cameraMode}
          colorMood={settings.colorMood}
          speedKmh={telemetry.speedKmh}
        />
      )}

      {/* Telemetry Dashboard Cluster */}
      {!cleanScreenMode && settings.showTelemetry && (
        <TelemetryHUD
          telemetry={telemetry}
          isNitro={settings.nitroBoost}
        />
      )}

      {/* Director Console (Sliders, Optics, Weather, Camera) */}
      {!cleanScreenMode && (
        <DirectorControls
          settings={settings}
          onChangeSettings={handleChangeSettings}
          onOpenSpecs={() => setIsSpecsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      )}

      {/* Specs Modal */}
      <VehicleSpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </main>
  );
}

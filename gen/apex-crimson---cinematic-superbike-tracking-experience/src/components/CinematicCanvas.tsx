import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CinematicRenderer } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';
import { SceneSettings, TelemetryData } from '../types';

interface CinematicCanvasProps {
  settings: SceneSettings;
  onUpdateTelemetry: (telemetry: TelemetryData) => void;
  onExportSnapshot?: () => void;
}

export const CinematicCanvas: React.FC<CinematicCanvasProps> = ({
  settings,
  onUpdateTelemetry,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CinematicRenderer | null>(null);

  // Internal physics & telemetry state
  const stateRef = useRef({
    speedKmh: 165,
    rpm: 8500,
    gear: 4 as number | 'N',
    leanAngle: 0,
    throttle: 0.7,
    brake: 0,
    nitroBoost: false,
    distanceKm: 14.8,
    fps: 60,
    lastFrameTime: performance.now(),
    frameCount: 0,
    fpsTimer: performance.now(),
  });

  // Aspect ratio styling
  const getAspectRatioClasses = () => {
    switch (settings.aspectRatio) {
      case 'cinemascope':
        return 'aspect-[2.39/1] max-h-[88vh]';
      case 'standard':
        return 'aspect-[16/9] max-h-[90vh]';
      case 'imax':
        return 'aspect-[1.43/1] max-h-[92vh]';
      default:
        return 'w-full h-full';
    }
  };

  // Resize canvas accurately
  const updateCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Scale for crisp retina / 4K displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CinematicRenderer(canvasRef.current);
    updateCanvasDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateCanvasDimensions]);

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    let animId: number;

    const gearRatios = [0, 2.6, 2.0, 1.6, 1.3, 1.1, 0.95]; // 1 to 6
    const topSpeedsPerGear = [0, 110, 160, 210, 255, 290, 335];

    const loop = (time: number) => {
      const state = stateRef.current;
      const dt = Math.min((time - state.lastFrameTime) / 1000, 0.1);
      state.lastFrameTime = time;

      // FPS calculation
      state.frameCount++;
      if (time - state.fpsTimer >= 500) {
        state.fps = Math.round((state.frameCount * 1000) / (time - state.fpsTimer));
        state.frameCount = 0;
        state.fpsTimer = time;
      }

      // Physics acceleration / braking
      const targetSpeed = settings.targetSpeed;
      const accelRate = (settings.nitroBoost ? 95 : 55) * (settings.throttle || 0.6);
      const brakeRate = 120 * (settings.brake || 0);

      if (state.speedKmh < targetSpeed) {
        state.speedKmh = Math.min(targetSpeed, state.speedKmh + accelRate * dt);
      } else if (state.speedKmh > targetSpeed) {
        state.speedKmh = Math.max(targetSpeed, state.speedKmh - (brakeRate > 0 ? brakeRate : 35) * dt);
      }

      // Calculate Gear & RPM
      let calculatedGear = 1;
      for (let g = 1; g <= 6; g++) {
        if (state.speedKmh < topSpeedsPerGear[g]) {
          calculatedGear = g;
          break;
        }
        calculatedGear = 6;
      }
      state.gear = calculatedGear;

      const minSpeedInGear = calculatedGear === 1 ? 0 : topSpeedsPerGear[calculatedGear - 1] * 0.7;
      const maxSpeedInGear = topSpeedsPerGear[calculatedGear];
      const gearProgress = Math.max(0, Math.min(1, (state.speedKmh - minSpeedInGear) / (maxSpeedInGear - minSpeedInGear || 1)));

      state.rpm = Math.floor(4000 + gearProgress * 9500 + (settings.nitroBoost ? 1000 : 0));
      if (state.speedKmh < 5) state.rpm = 1600; // Idle

      // Dynamic G-force and downforce
      const gLongitudinal = (accelRate / 9.8) * (settings.throttle - settings.brake);
      const gLateral = Math.sin(time * 0.001) * 0.4;
      const downforceKg = Math.round(Math.pow(state.speedKmh / 200, 2) * 28);
      const turboBoostBar = (state.rpm / 14000) * 1.8 + (settings.nitroBoost ? 0.6 : 0);

      state.distanceKm += (state.speedKmh / 3600) * dt;

      // Telemetry payload
      const telemetry: TelemetryData = {
        speedKmh: state.speedKmh,
        speedMph: Math.round(state.speedKmh * 0.621371),
        rpm: state.rpm,
        maxRpm: 14500,
        gear: state.gear,
        leanAngle: Math.sin(time * 0.0012) * 6,
        throttlePercent: Math.round(settings.throttle * 100),
        brakePercent: Math.round(settings.brake * 100),
        gForceLateral: Number(gLateral.toFixed(2)),
        gForceLongitudinal: Number(gLongitudinal.toFixed(2)),
        downforceKg,
        turboBoostBar: Number(turboBoostBar.toFixed(2)),
        distanceKm: Number(state.distanceKm.toFixed(2)),
        currentFps: state.fps,
      };

      // Sound update
      audioEngine.update({
        rpm: state.rpm,
        gear: state.gear,
        speedKmh: state.speedKmh,
        throttle: settings.throttle,
        wetness: settings.wetness,
        nitroBoost: settings.nitroBoost,
        soundEnabled: settings.soundEnabled,
        volume: settings.soundVolume,
      });

      // Render 60fps frame
      if (rendererRef.current) {
        rendererRef.current.render(settings, telemetry, time);
      }

      onUpdateTelemetry(telemetry);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [settings, onUpdateTelemetry]);

  return (
    <div
      ref={containerRef}
      id="cinematic-canvas-container"
      className={`relative flex items-center justify-center w-full h-full overflow-hidden bg-black transition-all duration-500`}
    >
      <div className={`relative w-full h-full flex items-center justify-center ${getAspectRatioClasses()}`}>
        <canvas
          ref={canvasRef}
          id="superbike-cinematic-stage"
          className="w-full h-full object-cover block shadow-2xl"
        />

        {/* Cinematic Cinemascope Letterbox bars */}
        {settings.isCinemaBars && (
          <>
            <div className="absolute top-0 left-0 right-0 h-10 bg-black pointer-events-none z-20 border-b border-white/5" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-black pointer-events-none z-20 border-t border-white/5" />
          </>
        )}
      </div>
    </div>
  );
};

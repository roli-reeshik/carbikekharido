import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraAngle, CinematicSettings, LUTPreset, TelemetryData } from '../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
}

interface CinematicViewportProps {
  settings: CinematicSettings;
  setTelemetry: (data: TelemetryData) => void;
  onSnapshot?: () => void;
}

export const CinematicViewport: React.FC<CinematicViewportProps> = ({
  settings,
  setTelemetry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Simulation state
  const simState = useRef({
    worldTime: 0,
    carX: 0,
    wheelAngle: 0,
    wingAngle: 5,
    cameraShake: { x: 0, y: 0 },
    particles: [] as Particle[],
    roadOffset: 0,
    oceanWavePhase: 0,
    lastTimestamp: performance.now(),
    flareFlicker: 1.0,
  });

  const [canvasDim, setCanvasDim] = useState({ width: 1920, height: 1080 });

  // Handle ResizeObserver for sharp 4K / crisp rendering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDim({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = (now: number) => {
      const state = simState.current;
      const rawDelta = Math.min((now - state.lastTimestamp) / 1000, 0.1);
      state.lastTimestamp = now;

      // Calculate effective delta time factoring slow-mo rate
      const effectiveDt = settings.isPlaying ? rawDelta * settings.slowMoRate : 0;
      state.worldTime += effectiveDt;

      const speedFactor = settings.speedMph / 65;
      const currentSpeedMps = (settings.speedMph * 1609.34) / 3600; // m/s
      const distanceTraveled = currentSpeedMps * effectiveDt;

      // Wheel rotation (radians)
      const wheelRadiusM = 0.35; // 21-inch wheel
      state.wheelAngle = (state.wheelAngle + (distanceTraveled / wheelRadiusM)) % (Math.PI * 2);

      // Active aerodynamic rear wing angle adjustment based on speed
      const targetWing = Math.min(28, 4 + (settings.speedMph / 140) * 24);
      state.wingAngle += (targetWing - state.wingAngle) * Math.min(1, effectiveDt * 3);

      // Camera steadicam subtle organic micro-vibration
      const shakeAmp = (settings.speedMph / 100) * 0.8 * (1 / (settings.slowMoRate || 1));
      state.cameraShake.x = (Math.sin(state.worldTime * 14) * 0.6 + Math.sin(state.worldTime * 29) * 0.4) * shakeAmp;
      state.cameraShake.y = (Math.cos(state.worldTime * 18) * 0.8 + Math.cos(state.worldTime * 33) * 0.3) * shakeAmp;

      // Road texture progress
      state.roadOffset = (state.roadOffset + distanceTraveled * 12) % 200;
      state.oceanWavePhase = (state.oceanWavePhase + effectiveDt * 0.8) % (Math.PI * 2);

      // Flare dynamic shimmer
      state.flareFlicker = 0.95 + Math.sin(state.worldTime * 8) * 0.05 + Math.random() * 0.03;

      // Dust Particle Generation
      if (settings.isPlaying && settings.dustDensity > 0) {
        const spawnCount = Math.floor(settings.dustDensity * speedFactor * 3);
        for (let i = 0; i < spawnCount; i++) {
          const spawnX = canvas.width * 0.32 - 140 - Math.random() * 20;
          const spawnY = canvas.height * 0.72 - 10 + Math.random() * 12;
          const dustParticle: Particle = {
            x: spawnX,
            y: spawnY,
            vx: -(currentSpeedMps * 0.3 + Math.random() * 12) * (0.8 + Math.random() * 0.4),
            vy: -(Math.random() * 14 + 4),
            size: Math.random() * 7 + 3,
            alpha: 0.75 + Math.random() * 0.25,
            maxLife: 1.2 + Math.random() * 0.8,
            life: 0,
            color: Math.random() > 0.4 ? '#fcd34d' : '#fbbf24', // golden sunlit road dust
          };
          state.particles.push(dustParticle);
        }
      }

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life += effectiveDt;
        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * effectiveDt * 40;
        p.y += p.vy * effectiveDt * 40;
        p.vy += 6 * effectiveDt; // subtle gravity
        p.vx *= 0.98;
        p.size += effectiveDt * 12; // expansion
      }

      // Update Telemetry metrics
      const motorKw = Math.round((settings.speedMph / 140) * 580 * (settings.isPlaying ? 1 : 0.05));
      const gLat = Number((Math.sin(state.worldTime * 0.7) * 0.42 * (settings.speedMph / 70)).toFixed(2));
      const gLong = Number((settings.isPlaying ? 0.18 * (settings.speedMph / 65) : 0).toFixed(2));
      const downforce = Math.round(Math.pow(settings.speedMph / 100, 2) * 380);

      setTelemetry({
        speedMph: settings.speedMph,
        motorPowerKw: motorKw,
        gForceLat: gLat,
        gForceLong: gLong,
        batteryPct: 84,
        downforceKg: downforce,
        tirePressurePsi: 38.2,
        roadGripPct: 98,
        activeWingAngleDeg: Math.round(state.wingAngle),
      });

      // Clear Frame
      ctx.save();
      const W = canvas.width;
      const H = canvas.height;

      // Apply LUT / Color Grading Canvas Filter
      applyLUTFilter(ctx, settings);

      // Camera Transform with Steadicam Micro Shake
      ctx.translate(state.cameraShake.x, state.cameraShake.y);

      // Render Scene based on Camera Angle
      switch (settings.cameraAngle) {
        case 'profile_tracking':
          drawProfileTrackingShot(ctx, W, H, state, settings);
          break;
        case 'chase_front':
          drawChaseFrontShot(ctx, W, H, state, settings);
          break;
        case 'cliff_drone':
          drawCliffDroneShot(ctx, W, H, state, settings);
          break;
        case 'wheel_macro':
          drawWheelMacroShot(ctx, W, H, state, settings);
          break;
        case 'cockpit_sunset':
          drawCockpitSunsetShot(ctx, W, H, state, settings);
          break;
        default:
          drawProfileTrackingShot(ctx, W, H, state, settings);
      }

      // Draw Optical Overlays (Golden Hour Anamorphic Flare, Film Grain, Vignette)
      drawOpticalOverlays(ctx, W, H, state, settings);

      // 2.39:1 Cinema Anamorphic Letterbox
      if (settings.cinemaLetterbox) {
        drawCinemaLetterbox(ctx, W, H);
      }

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [settings, setTelemetry]);

  return (
    <div
      ref={containerRef}
      id="cinematic-canvas-container"
      className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        id="cinema-canvas"
        width={canvasDim.width}
        height={canvasDim.height}
        className="w-full h-full object-cover block"
      />
    </div>
  );
};

// ==========================================
// SCENE RENDERERS
// ==========================================

// 1. PRIMARY SHOT: Parallel Profile Tracking Shot (Golden Hour Big Sur / Amalfi Coast)
function drawProfileTrackingShot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: any,
  settings: CinematicSettings
) {
  const horizonY = H * 0.62;

  // --- LAYER 1: Golden Hour Sunset Sky & Atmospheric Glow ---
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#1c1917'); // deep slate zenith
  skyGrad.addColorStop(0.25, '#451a03'); // rich amber dusky dusk
  skyGrad.addColorStop(0.55, '#c2410c'); // intense fiery orange
  skyGrad.addColorStop(0.82, '#f59e0b'); // radiant golden hour glow
  skyGrad.addColorStop(1, '#fef08a'); // soft bright horizon slice
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, horizonY);

  // Golden Sun Disc & Volumetric Radial Bloom
  const sunX = W * 0.82;
  const sunY = horizonY * 0.45 - (settings.sunElevation - 20) * 3;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, W * 0.55);
  sunGlow.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
  sunGlow.addColorStop(0.15, 'rgba(251, 191, 36, 0.65)');
  sunGlow.addColorStop(0.4, 'rgba(234, 88, 12, 0.3)');
  sunGlow.addColorStop(0.8, 'rgba(180, 83, 9, 0.08)');
  sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, horizonY + 100);

  // Crisp Golden Solar Disc
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#fffbeb';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 40;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Layered Sunset Clouds with Warm Sidelight
  drawSunsetClouds(ctx, W, horizonY, state.worldTime * 0.02);

  // --- LAYER 2: Distant Pacific Ocean & Sparkling Sunset Water ---
  const oceanGrad = ctx.createLinearGradient(0, horizonY, 0, horizonY + 110);
  oceanGrad.addColorStop(0, '#1e293b'); // deep twilight marine
  oceanGrad.addColorStop(0.4, '#0f172a');
  oceanGrad.addColorStop(1, '#020617');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, horizonY, W, 110);

  // Ocean Golden Specular Shimmer Path
  drawOceanSunTrack(ctx, sunX, horizonY, W, state.worldTime);

  // --- LAYER 3: Rugged Coastal Pacific Cliffs & Sea Stacks (Multi-tier Parallax) ---
  drawDistantCliffs(ctx, W, horizonY, state.worldTime * 15);
  drawMidgroundCliffs(ctx, W, horizonY, state.worldTime * 35);

  // --- LAYER 4: The Winding Coastal Highway Asphalt & Guardrails ---
  const roadTopY = horizonY + 45;
  const roadHeight = H - roadTopY;

  // Mountain rock face cutting along the road
  const mountainGrad = ctx.createLinearGradient(0, roadTopY - 140, 0, roadTopY);
  mountainGrad.addColorStop(0, '#1c1917');
  mountainGrad.addColorStop(0.6, '#292524');
  mountainGrad.addColorStop(1, '#44403c');
  ctx.fillStyle = mountainGrad;
  ctx.beginPath();
  ctx.moveTo(0, roadTopY);
  ctx.lineTo(W, roadTopY);
  ctx.lineTo(W, roadTopY - 90);
  ctx.quadraticCurveTo(W * 0.7, roadTopY - 160, W * 0.4, roadTopY - 80);
  ctx.quadraticCurveTo(W * 0.15, roadTopY - 140, 0, roadTopY - 70);
  ctx.closePath();
  ctx.fill();

  // Coastal Guardrail Posts whipping by with high-speed blur
  drawCoastalGuardrail(ctx, W, roadTopY - 10, state.roadOffset);

  // Asphalt Surface with Golden Hour Light Grazing
  const roadGrad = ctx.createLinearGradient(0, roadTopY, 0, H);
  roadGrad.addColorStop(0, '#1f2937'); // dark weathered tarmac
  roadGrad.addColorStop(0.4, '#111827');
  roadGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, roadTopY, W, roadHeight);

  // Double Yellow Center Lines & Road Markings with Motion Blur
  drawRoadMarkings(ctx, W, roadTopY, H, state.roadOffset, settings.speedMph);

  // --- LAYER 5: Dust Particles Kicking Up from Tires ---
  drawTireDustParticles(ctx, state.particles);

  // --- LAYER 6: The Sleek Modern Charcoal-Grey Electric Sports Car ---
  // Position the car in prominent profile view (centered horizontally, dynamic lateral stance)
  const carCenterX = W * 0.48;
  const carBaseY = roadTopY + (H - roadTopY) * 0.58;
  const carScale = Math.min(W / 1400, 1.25);

  drawCharcoalElectricSportsCar(ctx, carCenterX, carBaseY, carScale, state, settings);

  // Atmospheric Heat Shimmer / Aerodynamic Vortex over the body
  if (settings.speedMph > 40) {
    drawAerodynamicVortices(ctx, carCenterX, carBaseY, carScale, state.worldTime);
  }
}

// 2. Low-Angle 3/4 Front Chase View
function drawChaseFrontShot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: any,
  settings: CinematicSettings
) {
  // Dramatic low-angle perspective looking up at the front fascia
  const horizonY = H * 0.45;
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#0c0a09');
  skyGrad.addColorStop(0.4, '#7c2d12');
  skyGrad.addColorStop(0.8, '#ea580c');
  skyGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, horizonY);

  // Sun
  const sunX = W * 0.25;
  const sunY = horizonY * 0.5;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, W * 0.6);
  sunGlow.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
  sunGlow.addColorStop(0.3, 'rgba(251, 146, 60, 0.5)');
  sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, horizonY + 80);

  // Asphalt Perspective grid
  const roadTopY = horizonY;
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, roadTopY, W, H - roadTopY);

  // Converging perspective road lanes
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, roadTopY);
  ctx.lineTo(W * 0.1, H);
  ctx.moveTo(W * 0.52, roadTopY);
  ctx.lineTo(W * 0.15, H);
  ctx.stroke();

  // Dynamic 3/4 Perspective Electric Hypercar (Charcoal Grey)
  const cx = W * 0.55;
  const cy = H * 0.72;
  const scale = Math.min(W / 1200, 1.4);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Ambient Occlusion Shadow
  ctx.beginPath();
  ctx.ellipse(0, 75, 280, 45, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.filter = 'blur(12px)';
  ctx.fill();
  ctx.filter = 'none';

  // Front Chassis 3/4 Silhouette (Aggressive low-slung GT styling)
  const bodyGrad = ctx.createLinearGradient(-260, -100, 260, 100);
  bodyGrad.addColorStop(0, '#52525b'); // high gloss charcoal highlight
  bodyGrad.addColorStop(0.3, '#27272a'); // metallic carbon body
  bodyGrad.addColorStop(0.7, '#18181b'); // shadow tone
  bodyGrad.addColorStop(1, '#3f3f46');
  ctx.fillStyle = bodyGrad;

  // Front Hood & Low Nose
  ctx.beginPath();
  ctx.moveTo(-240, 40); // left front splitter
  ctx.quadraticCurveTo(-180, -20, -120, -50); // left fender flare
  ctx.quadraticCurveTo(0, -90, 160, -70); // low hood to windshield
  ctx.quadraticCurveTo(240, -10, 260, 45); // right fender
  ctx.quadraticCurveTo(180, 65, 0, 70); // front air dam
  ctx.closePath();
  ctx.fill();

  // Windshield with Golden Sunset Reflection
  ctx.beginPath();
  ctx.moveTo(-100, -55);
  ctx.quadraticCurveTo(0, -135, 120, -75);
  ctx.lineTo(150, -70);
  ctx.quadraticCurveTo(0, -95, -80, -50);
  ctx.closePath();
  const glassGrad = ctx.createLinearGradient(-100, -130, 120, -50);
  glassGrad.addColorStop(0, 'rgba(251, 146, 60, 0.85)'); // golden reflection
  glassGrad.addColorStop(0.6, 'rgba(30, 41, 59, 0.9)');
  glassGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // Futuristic Thin Blade LED Matrix Headlights
  ctx.strokeStyle = '#38bdf8'; // electric cyan / crisp white LED
  ctx.lineWidth = 5;
  ctx.shadowColor = '#60a5fa';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  // Left light blade
  ctx.moveTo(-200, 25);
  ctx.lineTo(-120, 15);
  ctx.lineTo(-100, 28);
  // Right light blade
  ctx.moveTo(120, 15);
  ctx.lineTo(200, 25);
  ctx.lineTo(220, 38);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Front Carbon Fiber Aerodynamic Splitter & Ducts
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-180, 50, 360, 18);

  ctx.restore();

  // Front tire dust haze
  drawTireDustParticles(ctx, state.particles);
}

// 3. Panoramic Cliffside Drone Vista
function drawCliffDroneShot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: any,
  settings: CinematicSettings
) {
  // Ultra-wide high-altitude coastal perspective
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.35);
  skyGrad.addColorStop(0, '#1c1917');
  skyGrad.addColorStop(0.5, '#9a3412');
  skyGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.35);

  // Vast Pacific Ocean with deep waves and cliff foaming
  const oceanGrad = ctx.createLinearGradient(0, H * 0.35, 0, H);
  oceanGrad.addColorStop(0, '#0f172a');
  oceanGrad.addColorStop(0.5, '#1e293b');
  oceanGrad.addColorStop(1, '#020617');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, H * 0.35, W, H * 0.65);

  // Golden Sun reflection across the vast ocean
  drawOceanSunTrack(ctx, W * 0.7, H * 0.35, W, state.worldTime);

  // Rugged coastal cliffs and sweeping serpentine road curve
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.4);
  ctx.bezierCurveTo(W * 0.4, H * 0.45, W * 0.6, H * 0.7, W, H * 0.55);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Cliff rock highlights
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Curving Coastal Ribbon Highway
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 32;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.48);
  ctx.bezierCurveTo(W * 0.35, H * 0.52, W * 0.65, H * 0.78, W, H * 0.68);
  ctx.stroke();

  // Yellow Center Double-Line
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Miniature Charcoal Car tracking smoothly along the curve
  const t = (state.worldTime * 0.08) % 1;
  // Compute bezier point
  const p0 = { x: 0, y: H * 0.48 };
  const p1 = { x: W * 0.35, y: H * 0.52 };
  const p2 = { x: W * 0.65, y: H * 0.78 };
  const p3 = { x: W, y: H * 0.68 };

  const cx = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
  const cy = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;

  // Car Body Dot with Headlight beams & dust plume
  ctx.save();
  ctx.translate(cx, cy);

  // Headlight golden beam casting forward
  const beamGrad = ctx.createRadialGradient(0, 0, 10, 80, 0, 140);
  beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
  beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(120, -35);
  ctx.lineTo(120, 35);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  // Charcoal Car body
  ctx.fillStyle = '#3f3f46';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Amber glowing tail blade
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 8;
  ctx.fillRect(-22, -4, 4, 8);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// 4. Wheel & Tire Dust Macro Close-Up
function drawWheelMacroShot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: any,
  settings: CinematicSettings
) {
  // Close-up cinematic shot of 21" turbine rim, high-performance Brembo caliper, and dynamic dust kick
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#09090b');
  bgGrad.addColorStop(0.5, '#18181b');
  bgGrad.addColorStop(1, '#27272a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Carbon body arch panel above the wheel
  ctx.fillStyle = '#3f3f46';
  ctx.beginPath();
  ctx.arc(W * 0.45, H * 0.55, H * 0.48, Math.PI, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // Golden hour highlight reflection slicing across the fender arch
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 25;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Road asphalt surface below
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, H * 0.85, W, H * 0.15);

  // Wheel Center & Rotating Rim
  const wx = W * 0.45;
  const wy = H * 0.55;
  const r = H * 0.38;

  // Tire rubber with tread texture
  ctx.beginPath();
  ctx.arc(wx, wy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#09090b';
  ctx.fill();

  // Brembo High-Performance Ceramic Red Brake Caliper
  ctx.save();
  ctx.translate(wx, wy);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, -Math.PI * 0.6, -Math.PI * 0.2);
  ctx.strokeStyle = '#dc2626'; // aggressive gloss red
  ctx.lineWidth = 38;
  ctx.stroke();
  ctx.restore();

  // Rotating Multi-Spoke Forged Carbon/Alloy Turbine Rim
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(state.wheelAngle * 2);

  // Rim Barrel
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 14;
  ctx.stroke();

  // 10-Spoke Directional Aero Blades
  for (let i = 0; i < 10; i++) {
    ctx.rotate((Math.PI * 2) / 10);
    const spokeGrad = ctx.createLinearGradient(0, 0, 0, r * 0.62);
    spokeGrad.addColorStop(0, '#d4d4d8');
    spokeGrad.addColorStop(0.5, '#71717a');
    spokeGrad.addColorStop(1, '#27272a');
    ctx.fillStyle = spokeGrad;
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.lineTo(-6, r * 0.62);
    ctx.lineTo(8, r * 0.62);
    ctx.lineTo(14, 20);
    ctx.closePath();
    ctx.fill();
  }

  // Center Lock Hub with Electric Logo
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore();

  // Intense Tire Friction Dust Plume (Macro Scale)
  drawMacroDustVortices(ctx, wx - r * 0.7, H * 0.84, state.worldTime);
}

// 5. Cockpit Sunset Horizon View
function drawCockpitSunsetShot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: any,
  settings: CinematicSettings
) {
  const horizonY = H * 0.48;

  // Sunset Sky outside windscreen
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#1c1917');
  skyGrad.addColorStop(0.3, '#7c2d12');
  skyGrad.addColorStop(0.7, '#ea580c');
  skyGrad.addColorStop(1, '#fef08a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, horizonY);

  // Setting Sun blinding on horizon
  const sunX = W * 0.5;
  const sunY = horizonY - 20;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, W * 0.5);
  sunGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
  sunGlow.addColorStop(0.2, 'rgba(251, 191, 36, 0.8)');
  sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, horizonY + 50);

  // Pacific Ocean Waves
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, horizonY, W, H * 0.2);

  // Asphalt road speeding toward driver
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, horizonY + 20, W, H - horizonY - 20);

  // Curved Carbon Fiber Dashboard / Yoke Steering Cockpit
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.65);
  ctx.quadraticCurveTo(W * 0.5, H * 0.6, W, H * 0.65);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Glass Heads-Up-Display (HUD) projected on windscreen
  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.font = '600 28px monospace';
  ctx.fillText(`${settings.speedMph} MPH`, W * 0.46, H * 0.42);
  ctx.font = '400 14px monospace';
  ctx.fillText('EV DUAL-MOTOR TORQUE 94% | HIGHWAY 1 COASTAL', W * 0.38, H * 0.46);

  // Digital Sport Yoke Steering Silhouette
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.roundRect(W * 0.38, H * 0.72, W * 0.24, H * 0.22, 24);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ==========================================
// SUB-RENDERERS & VEHICLE ASSETS
// ==========================================

// Precise vector render of the modern charcoal-grey electric sports car in profile
function drawCharcoalElectricSportsCar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  state: any,
  settings: CinematicSettings
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const carLength = 520;
  const carHeight = 125;

  // 1. Realistic Road Shadow with Soft Gradient Occlusion
  ctx.beginPath();
  ctx.ellipse(0, 18, carLength * 0.52, 22, 0, 0, Math.PI * 2);
  const shadowGrad = ctx.createRadialGradient(0, 18, 20, 0, 18, carLength * 0.54);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  // 2. Charcoal-Grey Metallic Body Base Shell
  // Sophisticated multi-stop metallic gradient for luxury automotive paintwork
  const paintGrad = ctx.createLinearGradient(-carLength * 0.5, -carHeight, carLength * 0.5, 30);
  paintGrad.addColorStop(0, '#3f3f46'); // front carbon splitter tone
  paintGrad.addColorStop(0.25, '#71717a'); // hood golden reflection highlight
  paintGrad.addColorStop(0.5, '#27272a'); // deep charcoal metallic midtone
  paintGrad.addColorStop(0.75, '#52525b'); // muscular rear haunch highlight
  paintGrad.addColorStop(1, '#18181b'); // rear diffuser shadow
  ctx.fillStyle = paintGrad;

  // Aerodynamic Low-Slung Fastback Body Contour Path
  ctx.beginPath();
  // Front nose / low splitter
  ctx.moveTo(240, 6);
  // Front bumper curve up to hood
  ctx.quadraticCurveTo(230, -18, 190, -28);
  // Sleek sweeping hood
  ctx.quadraticCurveTo(130, -38, 70, -42);
  // Windshield rake (steep low-drag 26° angle)
  ctx.quadraticCurveTo(20, -78, -40, -82);
  // Fastback curved roofline
  ctx.quadraticCurveTo(-110, -82, -180, -56);
  // Rear deck / ducktail spoiler contour
  ctx.quadraticCurveTo(-220, -42, -245, -34);
  // Rear bumper down to aerodynamic carbon diffuser
  ctx.quadraticCurveTo(-255, 0, -240, 12);
  // Lower side skirt & carbon rocker panels
  ctx.lineTo(-200, 12);
  // Rear wheel arch cutout
  ctx.arc(-145, 12, 48, Math.PI, 0, false);
  // Side rocker sill
  ctx.lineTo(95, 12);
  // Front wheel arch cutout
  ctx.arc(145, 12, 48, Math.PI, 0, false);
  ctx.lineTo(240, 6);
  ctx.closePath();
  ctx.fill();

  // 3. Golden Hour Specular Highlights (Raking sunlight catching curvature)
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)'; // golden ray edge
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  // Roofline golden edge
  ctx.moveTo(70, -42);
  ctx.quadraticCurveTo(20, -78, -40, -82);
  ctx.quadraticCurveTo(-110, -82, -180, -56);
  // Shoulder crease line
  ctx.moveTo(180, -26);
  ctx.quadraticCurveTo(50, -32, -120, -28);
  ctx.quadraticCurveTo(-180, -26, -240, -32);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. Smoked Glass Canopy & Pillarless Greenhouse
  const glassGrad = ctx.createLinearGradient(-120, -80, 50, -40);
  glassGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  glassGrad.addColorStop(0.3, 'rgba(30, 41, 59, 0.85)');
  glassGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.45)'); // sunset golden horizon reflection on glass
  glassGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
  ctx.fillStyle = glassGrad;

  ctx.beginPath();
  ctx.moveTo(58, -42);
  ctx.quadraticCurveTo(15, -74, -36, -78);
  ctx.quadraticCurveTo(-100, -78, -165, -54);
  ctx.quadraticCurveTo(-90, -46, -30, -45);
  ctx.lineTo(58, -42);
  ctx.closePath();
  ctx.fill();

  // Driver Silhouette in Cockpit
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.beginPath();
  ctx.arc(-20, -58, 11, 0, Math.PI * 2); // helmet/head
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-34, -46, 28, 14, 4); // shoulders/seat
  ctx.fill();

  // 5. Active Aerodynamic Carbon Rear Wing (Adjusting angle with speed)
  if (settings.activeAero) {
    ctx.save();
    ctx.translate(-230, -38);
    ctx.rotate((-state.wingAngle * Math.PI) / 180);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-35, -5, 45, 6);
    // Wing endplates
    ctx.fillStyle = '#71717a';
    ctx.fillRect(8, -10, 4, 16);
    ctx.fillRect(-36, -10, 4, 16);
    ctx.restore();
  }

  // 6. Full-Width Ultra-Thin LED Lightbar (Rear Blade & Front Projector)
  // Rear aggressive OLED amber/red blade
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#dc2626';
  ctx.shadowBlur = 16;
  ctx.fillRect(-248, -28, 8, 4);
  ctx.shadowBlur = 0;

  // Front razor-thin LED daytime running light
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 18;
  ctx.fillRect(234, -14, 8, 3);
  ctx.shadowBlur = 0;

  // 7. 21-Inch Multi-Spoke Turbine Wheels with 60FPS Rotational Blur
  drawProfileWheel(ctx, -145, 12, 42, state.wheelAngle, settings.speedMph);
  drawProfileWheel(ctx, 145, 12, 42, state.wheelAngle, settings.speedMph);

  // 8. Carbon Fiber Aero Skirt and Diffuser Fin Details
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-245, 8, 40, 6);
  ctx.fillRect(90, 8, 50, 4);
  ctx.fillRect(-95, 8, 185, 4);

  ctx.restore();
}

// Profile Wheel Rendering with Rim Spokes & Red Caliper
function drawProfileWheel(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  radius: number,
  angle: number,
  speedMph: number
) {
  ctx.save();
  ctx.translate(wx, wy);

  // Tire rubber (dark matte charcoal)
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#09090b';
  ctx.fill();

  // High-Performance Red Brake Caliper (Stationary at top right)
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, -Math.PI * 0.45, -Math.PI * 0.15);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Slotted Carbon Ceramic Brake Rotor
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#3f3f46';
  ctx.fill();

  // Rotating Magnesium Alloy Aero Turbine Rim
  ctx.rotate(angle);

  // Multi-spoke rotational blur when car is in motion
  const spokeCount = 9;
  for (let i = 0; i < spokeCount; i++) {
    ctx.rotate((Math.PI * 2) / spokeCount);
    const bladeGrad = ctx.createLinearGradient(0, 0, 0, radius * 0.78);
    bladeGrad.addColorStop(0, '#e4e4e7');
    bladeGrad.addColorStop(0.5, '#71717a');
    bladeGrad.addColorStop(1, '#27272a');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(-2, radius * 0.76);
    ctx.lineTo(4, radius * 0.76);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();
  }

  // Center Wheel Hub with Cyan EV Accent
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// Background Sunset Clouds with Warm Sidelight
function drawSunsetClouds(ctx: CanvasRenderingContext2D, W: number, horizonY: number, timeOffset: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 380 + timeOffset * 40) % (W + 400)) - 200;
    const cy = horizonY * 0.25 + (i % 3) * 35;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 140, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Ocean Sun Track (Sparkling Golden Path on Water)
function drawOceanSunTrack(
  ctx: CanvasRenderingContext2D,
  sunX: number,
  horizonY: number,
  W: number,
  worldTime: number
) {
  ctx.save();
  const trackGrad = ctx.createRadialGradient(sunX, horizonY + 40, 5, sunX, horizonY + 40, W * 0.35);
  trackGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
  trackGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
  trackGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = trackGrad;
  ctx.fillRect(sunX - W * 0.3, horizonY, W * 0.6, 90);

  // Sparkling wave ripples
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = 0; i < 24; i++) {
    const rx = sunX + (Math.sin(i * 1.7 + worldTime * 2) * 120 * (i / 12));
    const ry = horizonY + 8 + i * 3.5;
    const rw = 12 + Math.sin(i * 3 + worldTime * 4) * 8;
    ctx.fillRect(rx - rw / 2, ry, rw, 1.5);
  }
  ctx.restore();
}

// Distant Layer 1 Cliffs (Big Sur style sea stacks)
function drawDistantCliffs(ctx: CanvasRenderingContext2D, W: number, horizonY: number, offset: number) {
  ctx.save();
  ctx.fillStyle = '#451a03'; // deep warm silhouette
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= W; x += 60) {
    const nx = (x + offset) * 0.003;
    const h = Math.sin(nx * 3) * 45 + Math.cos(nx * 7) * 25 + 65;
    ctx.lineTo(x, horizonY - h);
  }
  ctx.lineTo(W, horizonY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Midground Layer 2 Cliffs with Golden Crest Highlights
function drawMidgroundCliffs(ctx: CanvasRenderingContext2D, W: number, horizonY: number, offset: number) {
  ctx.save();
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 25);
  for (let x = 0; x <= W; x += 40) {
    const nx = (x + offset) * 0.006;
    const h = Math.sin(nx * 4) * 35 + Math.cos(nx * 9) * 18 + 40;
    ctx.lineTo(x, horizonY + 25 - h);
  }
  ctx.lineTo(W, horizonY + 25);
  ctx.closePath();
  ctx.fill();

  // Golden Sunlight Ridge Highlight
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

// Coastal Guardrail Posts whipping by with high-speed motion blur
function drawCoastalGuardrail(ctx: CanvasRenderingContext2D, W: number, railY: number, roadOffset: number) {
  ctx.save();
  // Horizontal steel rail
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, railY);
  ctx.lineTo(W, railY);
  ctx.stroke();

  // Vertical posts moving with parallax
  ctx.fillStyle = '#57534e';
  const postSpacing = 90;
  for (let x = -postSpacing + (roadOffset % postSpacing); x < W + postSpacing; x += postSpacing) {
    ctx.fillRect(x, railY, 8, 22);
  }
  ctx.restore();
}

// Double Yellow Center Lines & Road Markings with Motion Blur
function drawRoadMarkings(
  ctx: CanvasRenderingContext2D,
  W: number,
  roadTopY: number,
  H: number,
  roadOffset: number,
  speedMph: number
) {
  ctx.save();
  const lineY = roadTopY + (H - roadTopY) * 0.78;

  // Solid Double Yellow Road Center Lines
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, lineY - 4);
  ctx.lineTo(W, lineY - 4);
  ctx.moveTo(0, lineY + 4);
  ctx.lineTo(W, lineY + 4);
  ctx.stroke();

  // Dashed lane boundary marks on upper lane
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 4;
  ctx.setLineDash([40, 50]);
  ctx.lineDashOffset = -roadOffset * 2;
  ctx.beginPath();
  ctx.moveTo(0, roadTopY + 30);
  ctx.lineTo(W, roadTopY + 30);
  ctx.stroke();
  ctx.restore();
}

// Tire Dust Particle System
function drawTireDustParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  for (const p of particles) {
    const alpha = (1 - p.life / p.maxLife) * p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Aerodynamic Vortices Streamlines
function drawAerodynamicVortices(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  worldTime: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const yOff = -60 + i * 20;
    ctx.beginPath();
    ctx.moveTo(-180, yOff);
    ctx.quadraticCurveTo(-260, yOff + Math.sin(worldTime * 12 + i) * 8, -340, yOff + 15);
    ctx.stroke();
  }
  ctx.restore();
}

// Macro Dust Vortices for Wheel Close-up
function drawMacroDustVortices(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const px = x - i * 18 - (time * 80) % 60;
    const py = y - Math.sin(i * 0.8 + time * 6) * 28 - i * 4;
    const size = 12 + i * 3;
    const dustGrad = ctx.createRadialGradient(px, py, 2, px, py, size);
    dustGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
    dustGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.3)');
    dustGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dustGrad;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Optical Overlays (Golden Anamorphic Lens Flare, Film Grain, Vignette)
function drawOpticalOverlays(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: any,
  settings: CinematicSettings
) {
  // 1. Horizontal Anamorphic Lens Flare Streak (Golden / Blue Cine Flare)
  if (settings.flareIntensity > 0) {
    const sunX = W * 0.82;
    const sunY = H * 0.35;
    const flareWidth = W * 0.85 * settings.flareIntensity * state.flareFlicker;

    ctx.save();
    // Long horizontal anamorphic streak
    const flareGrad = ctx.createLinearGradient(sunX - flareWidth, sunY, sunX + flareWidth, sunY);
    flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    flareGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.15)'); // subtle anamorphic cyan fringe
    flareGrad.addColorStop(0.48, 'rgba(254, 240, 138, 0.85)'); // radiant gold core
    flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    flareGrad.addColorStop(0.52, 'rgba(254, 240, 138, 0.85)');
    flareGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.2)');
    flareGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = flareGrad;
    ctx.fillRect(sunX - flareWidth, sunY - 4, flareWidth * 2, 8);

    // Secondary lens orb ghost reflection
    const ghostX = W - sunX;
    const ghostY = H - sunY;
    const ghostGrad = ctx.createRadialGradient(ghostX, ghostY, 5, ghostX, ghostY, 65);
    ghostGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    ghostGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ghostGrad;
    ctx.beginPath();
    ctx.arc(ghostX, ghostY, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Cinematic Vignette (Dark corner falloff)
  ctx.save();
  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.4, W * 0.5, H * 0.5, W * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.35)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 3. Film Grain Emulation
  if (settings.filmGrain > 0) {
    drawProceduralFilmGrain(ctx, W, H, settings.filmGrain);
  }
}

// Procedural 35mm Film Grain
function drawProceduralFilmGrain(ctx: CanvasRenderingContext2D, W: number, H: number, intensity: number) {
  ctx.save();
  const grainCount = Math.floor(W * H * 0.00015 * intensity);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < grainCount; i++) {
    const gx = Math.random() * W;
    const gy = Math.random() * H;
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }
  ctx.restore();
}

// 2.39:1 Cinema Anamorphic Letterbox Bars
function drawCinemaLetterbox(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const targetAspect = 2.39;
  const currentAspect = W / H;

  if (currentAspect < targetAspect) {
    // Top and bottom black bars
    const visibleH = W / targetAspect;
    const barH = (H - visibleH) / 2;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, barH);
    ctx.fillRect(0, H - barH, W, barH);
  }
}

// Apply LUT Filter on Canvas Context
function applyLUTFilter(ctx: CanvasRenderingContext2D, settings: CinematicSettings) {
  let filterString = '';

  // Exposure & Warmth adjustments
  const brightness = 100 + settings.exposure * 30;
  const contrast = 105;
  const saturate = 100 + settings.warmth * 25;
  const sepia = settings.warmth > 0 ? settings.warmth * 18 : 0;

  switch (settings.lutPreset) {
    case 'arri_golden':
      filterString = `brightness(${brightness * 1.02}%) contrast(${contrast * 1.05}%) saturate(${saturate * 1.15}%) sepia(${sepia + 12}%)`;
      break;
    case 'kodak_vision3':
      filterString = `brightness(${brightness * 0.98}%) contrast(${contrast * 1.1}%) saturate(${saturate * 1.08}%) hue-rotate(-4deg)`;
      break;
    case 'teal_orange':
      filterString = `brightness(${brightness}%) contrast(${contrast * 1.25}%) saturate(${saturate * 1.25}%) hue-rotate(-8deg)`;
      break;
    case 'monochrome_noir':
      filterString = `grayscale(100%) contrast(140%) brightness(${brightness * 0.9}%)`;
      break;
    case 'bleach_bypass':
      filterString = `saturate(35%) contrast(145%) brightness(${brightness * 1.05}%)`;
      break;
    case 'cyber_charcoal':
      filterString = `contrast(130%) saturate(110%) hue-rotate(15deg) brightness(${brightness * 0.95}%)`;
      break;
    default:
      filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  }

  ctx.filter = filterString;
}

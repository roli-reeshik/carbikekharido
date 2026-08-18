import { CameraMode, ColorMood, SceneSettings, TelemetryData } from '../types';

export class CinematicRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private elapsedTime = 0;

  // Parallax offsets
  private skyOffset = 0;
  private skylineFarOffset = 0;
  private skylineMidOffset = 0;
  private gantryOffset = 0;
  private roadTextureOffset = 0;
  private laneMarkerOffset = 0;
  private streetlampOffset = 0;
  private trafficOffset = 0;

  // Rain particles & tire spray
  private rainDrops: Array<{ x: number; y: number; length: number; speed: number; opacity: number }> = [];
  private sprayParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; alpha: number }> = [];
  private lensDrops: Array<{ x: number; y: number; r: number; alpha: number; slideY: number }> = [];

  // Exhaust fire timer
  private exhaustFlameIntensity = 0;

  // Neon billboard cache / definitions
  private billboards = [
    { text: 'APEX // HYPERTECH', color: '#ff1744', sub: 'ZERO EMISSION RACING' },
    { text: 'CYBER MOTORSPORTS', color: '#00e5ff', sub: 'TOKYO 2049' },
    { text: 'NEURONIC DYNAMICS', color: '#d500f9', sub: 'CARBON MONOCOQUE' },
    { text: 'CRIMSON OVERDRIVE', color: '#ff3d00', sub: 'SYNAPSE SUSPENSION' },
    { text: 'SHINJUKU EXPRESSWAY', color: '#76ff03', sub: 'SECTOR 7 FAST LANE' },
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not obtain 2D canvas context');
    this.ctx = context;

    this.initParticles();
  }

  private initParticles() {
    this.rainDrops = [];
    for (let i = 0; i < 200; i++) {
      this.rainDrops.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        length: 20 + Math.random() * 35,
        speed: 18 + Math.random() * 22,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }

    this.lensDrops = [];
    for (let i = 0; i < 18; i++) {
      this.lensDrops.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        r: 3 + Math.random() * 7,
        alpha: 0.15 + Math.random() * 0.4,
        slideY: 0.05 + Math.random() * 0.15,
      });
    }
  }

  public render(
    settings: SceneSettings,
    telemetry: TelemetryData,
    time: number
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width === 0 || height === 0) return;

    if (!this.lastTime) this.lastTime = time;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    this.elapsedTime += dt;

    const speedNorm = telemetry.speedKmh / 300; // 0 to ~1+
    const speedPixelsPerSec = (telemetry.speedKmh * 8 + 40);

    // Update parallax offsets
    this.skyOffset = (this.skyOffset + dt * speedPixelsPerSec * 0.02) % width;
    this.skylineFarOffset = (this.skylineFarOffset + dt * speedPixelsPerSec * 0.08) % width;
    this.skylineMidOffset = (this.skylineMidOffset + dt * speedPixelsPerSec * 0.35) % width;
    this.gantryOffset = (this.gantryOffset + dt * speedPixelsPerSec * 0.8) % 3200;
    this.streetlampOffset = (this.streetlampOffset + dt * speedPixelsPerSec * 1.2) % 600;
    this.laneMarkerOffset = (this.laneMarkerOffset + dt * speedPixelsPerSec * 2.2) % 200;
    this.trafficOffset = (this.trafficOffset + dt * speedPixelsPerSec * 0.4) % width;

    // Trigger exhaust flame on high throttle / shifts / nitro
    if (settings.nitroBoost || (telemetry.throttlePercent > 85 && Math.random() < 0.25)) {
      this.exhaustFlameIntensity = Math.min(1, this.exhaustFlameIntensity + 0.3);
    } else {
      this.exhaustFlameIntensity = Math.max(0, this.exhaustFlameIntensity - dt * 3.5);
    }

    // Camera low-to-ground offset and pan up
    // Pan up as speed climbs or based on settings.cameraPanUp
    const baseCameraHeight = height * 0.65;
    const panUpOffset = (settings.cameraPanUp * 0.4 + speedNorm * 0.15) * height * 0.25;
    const cameraShake = (Math.sin(time * 0.025) * 1.2 + Math.cos(time * 0.04) * 0.8) * (speedNorm * 3.5 * settings.cameraShake);
    const cameraY = baseCameraHeight - panUpOffset + cameraShake;

    // Clear background
    ctx.save();

    // 1. Draw Background Sky & Atmospheric Dusk
    this.drawSky(width, height, settings.colorMood);

    // 2. Distant Skyscraper Skyline & City Glow
    this.drawSkylineFar(width, cameraY, settings.colorMood);

    // 3. Midground Futuristic Neon Architecture & Billboards
    this.drawSkylineMid(width, cameraY, settings.colorMood);

    // 4. Distant Traffic Light Streaks
    this.drawDistantTraffic(width, cameraY);

    // 5. Wet Asphalt Highway, Reflections & Lane Markers
    this.drawWetHighway(width, height, cameraY, settings, telemetry);

    // 6. Overhead Gantries & Neon Highway Signs
    this.drawHighwayGantries(width, cameraY, settings.colorMood);

    // 7. Streetlamps casting dynamic pools of light
    this.drawStreetlamps(width, height, cameraY);

    // 8. Superbike & Rider (Perspective depends on Camera Mode)
    this.drawVehicle(width, height, cameraY, settings, telemetry, time);

    // 9. Tire Spray Mist & Rain Particles
    this.drawSprayAndRain(width, height, cameraY, settings, telemetry, dt);

    // 10. Cinematic Post Effects (Anamorphic Flares, Speed Blur, Vignette, Lens Droplets)
    this.drawPostEffects(width, height, settings, telemetry);

    ctx.restore();
  }

  // ==========================================
  // 1. SKY & DUSK HORIZON
  // ==========================================
  private drawSky(width: number, height: number, mood: ColorMood) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, height);

    if (mood === 'dusk_crimson') {
      grad.addColorStop(0, '#040308');
      grad.addColorStop(0.35, '#0b0714');
      grad.addColorStop(0.55, '#1e0816');
      grad.addColorStop(0.7, '#380a1d');
      grad.addColorStop(0.85, '#6a0d25');
      grad.addColorStop(1, '#1a050d');
    } else if (mood === 'tokyo_cyber') {
      grad.addColorStop(0, '#020610');
      grad.addColorStop(0.35, '#051124');
      grad.addColorStop(0.6, '#0f243a');
      grad.addColorStop(0.75, '#1e1438');
      grad.addColorStop(0.9, '#300f38');
      grad.addColorStop(1, '#080512');
    } else if (mood === 'monolith_stealth') {
      grad.addColorStop(0, '#030303');
      grad.addColorStop(0.4, '#0a0a0c');
      grad.addColorStop(0.7, '#15151b');
      grad.addColorStop(0.9, '#242023');
      grad.addColorStop(1, '#0e0e11');
    } else {
      // golden_hour
      grad.addColorStop(0, '#090918');
      grad.addColorStop(0.3, '#1d122b');
      grad.addColorStop(0.55, '#42163b');
      grad.addColorStop(0.75, '#872a39');
      grad.addColorStop(0.9, '#d9532f');
      grad.addColorStop(1, '#3b1216');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Atmospheric distant horizon glow
    const horizonGlow = ctx.createRadialGradient(
      width * 0.5, height * 0.6, 20,
      width * 0.5, height * 0.6, width * 0.7
    );
    horizonGlow.addColorStop(0, mood === 'tokyo_cyber' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(225, 29, 72, 0.22)');
    horizonGlow.addColorStop(0.6, 'rgba(15, 23, 42, 0.05)');
    horizonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // ==========================================
  // 2. FAR SKYLINE
  // ==========================================
  private drawSkylineFar(width: number, cameraY: number, mood: ColorMood) {
    const ctx = this.ctx;
    ctx.save();

    const buildingCount = 28;
    const bWidth = width / 18;
    const baseHorizon = cameraY - 40;

    ctx.fillStyle = mood === 'tokyo_cyber' ? '#070b18' : '#08050e';

    for (let i = -2; i < buildingCount + 2; i++) {
      const x = ((i * bWidth - this.skylineFarOffset) % (width + bWidth * 3)) - bWidth;
      const bHeight = 90 + Math.sin(i * 3.7) * 70 + Math.cos(i * 8.1) * 40;
      const y = baseHorizon - bHeight;

      ctx.fillRect(x, y, bWidth * 0.92, bHeight + 60);

      // Blinking red aviation beacon on tallest spires
      if (i % 3 === 0) {
        ctx.fillStyle = 'rgba(255, 30, 60, 0.85)';
        ctx.fillRect(x + bWidth * 0.45, y - 12, 2.5, 12);
        ctx.beginPath();
        ctx.arc(x + bWidth * 0.45 + 1.25, y - 12, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mood === 'tokyo_cyber' ? '#070b18' : '#08050e';
      }

      // Windows matrix
      ctx.fillStyle = mood === 'tokyo_cyber' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(251, 191, 36, 0.08)';
      for (let wy = y + 15; wy < baseHorizon - 10; wy += 14) {
        for (let wx = x + 6; wx < x + bWidth * 0.85; wx += 10) {
          if ((Math.sin(wx * 1.3 + wy * 0.7) > 0.1)) {
            ctx.fillRect(wx, wy, 3, 5);
          }
        }
      }
      ctx.fillStyle = mood === 'tokyo_cyber' ? '#070b18' : '#08050e';
    }

    ctx.restore();
  }

  // ==========================================
  // 3. MIDGROUND SKYLINE & NEON BILLBOARDS
  // ==========================================
  private drawSkylineMid(width: number, cameraY: number, mood: ColorMood) {
    const ctx = this.ctx;
    ctx.save();

    const buildingCount = 14;
    const bWidth = width / 8;
    const baseHorizon = cameraY - 10;

    for (let i = -1; i < buildingCount + 1; i++) {
      const x = ((i * bWidth - this.skylineMidOffset) % (width + bWidth * 2)) - bWidth;
      const bHeight = 160 + Math.sin(i * 2.1) * 110 + (i % 2 === 0 ? 50 : 0);
      const y = baseHorizon - bHeight;

      // Dark futuristic monolith building
      const grad = ctx.createLinearGradient(x, y, x + bWidth, y);
      grad.addColorStop(0, '#06050b');
      grad.addColorStop(0.5, '#0e0b16');
      grad.addColorStop(1, '#050409');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, bWidth * 0.94, bHeight + 40);

      // Edge glow accent
      ctx.strokeStyle = mood === 'tokyo_cyber' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(225, 29, 72, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, bWidth * 0.94, bHeight + 40);

      // Neon Billboard on every second building
      if (i % 2 === 0 && bHeight > 140) {
        const billboard = this.billboards[(Math.abs(i)) % this.billboards.length];
        const bbWidth = bWidth * 0.75;
        const bbHeight = 46;
        const bbX = x + (bWidth * 0.94 - bbWidth) / 2;
        const bbY = y + 25;

        // Billboard panel
        ctx.fillStyle = 'rgba(10, 10, 16, 0.92)';
        ctx.fillRect(bbX, bbY, bbWidth, bbHeight);
        ctx.strokeStyle = billboard.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bbX, bbY, bbWidth, bbHeight);

        // Neon Glow around billboard
        ctx.shadowColor = billboard.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = billboard.color;
        ctx.font = 'bold 11px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(billboard.text, bbX + bbWidth / 2, bbY + 20);

        ctx.shadowBlur = 0;
        ctx.font = '8px "Space Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(billboard.sub, bbX + bbWidth / 2, bbY + 35);
      }

      // Vertical neon striping on skyscrapers
      if (i % 3 === 1) {
        ctx.fillStyle = mood === 'tokyo_cyber' ? 'rgba(56, 189, 248, 0.6)' : 'rgba(244, 63, 94, 0.6)';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(x + bWidth * 0.85, y + 10, 2.5, bHeight * 0.8);
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 4. DISTANT TRAFFIC LIGHT TRAILS
  // ==========================================
  private drawDistantTraffic(width: number, cameraY: number) {
    const ctx = this.ctx;
    ctx.save();

    const trafficY = cameraY - 15;
    ctx.lineWidth = 2.5;

    // Distant red taillights trailing to the left
    for (let i = 0; i < 7; i++) {
      const tx = ((i * 280 + this.trafficOffset * 0.7) % (width + 300)) - 100;
      const tLen = 60 + (i % 3) * 35;

      const redGrad = ctx.createLinearGradient(tx, trafficY, tx + tLen, trafficY);
      redGrad.addColorStop(0, 'transparent');
      redGrad.addColorStop(0.3, 'rgba(239, 68, 68, 0.4)');
      redGrad.addColorStop(1, 'rgba(255, 30, 60, 0.95)');

      ctx.strokeStyle = redGrad;
      ctx.beginPath();
      ctx.moveTo(tx, trafficY + (i % 2) * 4);
      ctx.lineTo(tx + tLen, trafficY + (i % 2) * 4);
      ctx.stroke();
    }

    // Oncoming white headlights trailing
    for (let j = 0; j < 5; j++) {
      const hx = width - (((j * 340 + this.trafficOffset * 1.1) % (width + 300)) - 100);
      const hLen = 80 + (j % 2) * 40;

      const whiteGrad = ctx.createLinearGradient(hx, trafficY - 6, hx - hLen, trafficY - 6);
      whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      whiteGrad.addColorStop(0.7, 'rgba(224, 242, 254, 0.5)');
      whiteGrad.addColorStop(1, 'transparent');

      ctx.strokeStyle = whiteGrad;
      ctx.beginPath();
      ctx.moveTo(hx, trafficY - 6 - (j % 2) * 3);
      ctx.lineTo(hx - hLen, trafficY - 6 - (j % 2) * 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // 5. WET HIGHWAY ASPHALT & SPECULAR REFLECTIONS
  // ==========================================
  private drawWetHighway(
    width: number,
    height: number,
    cameraY: number,
    settings: SceneSettings,
    telemetry: TelemetryData
  ) {
    const ctx = this.ctx;
    ctx.save();

    const roadTopY = cameraY - 10;
    const roadHeight = height - roadTopY;

    // Asphalt Base with dark wet sheen
    const asphaltGrad = ctx.createLinearGradient(0, roadTopY, 0, height);
    asphaltGrad.addColorStop(0, '#060609');
    asphaltGrad.addColorStop(0.2, '#0a0910');
    asphaltGrad.addColorStop(0.6, '#0f0e16');
    asphaltGrad.addColorStop(1, '#050508');

    ctx.fillStyle = asphaltGrad;
    ctx.fillRect(0, roadTopY, width, roadHeight);

    // Guardrail / Jersey Barrier on far edge
    ctx.fillStyle = '#181822';
    ctx.fillRect(0, roadTopY - 14, width, 14);
    ctx.fillStyle = 'rgba(225, 29, 72, 0.7)';
    // Reflective cat eyes along barrier
    for (let bx = 0; bx < width; bx += 80) {
      const rx = (bx - this.streetlampOffset * 0.5 + width) % width;
      ctx.fillRect(rx, roadTopY - 8, 8, 3);
    }

    // Wet Asphalt Specular Reflections (Skyscraper neon mirror reflections on wet ground)
    if (settings.wetness > 0.05) {
      const reflectionAlpha = settings.wetness * 0.45;

      // Vertical neon light streak reflections in the wet asphalt
      for (let i = 0; i < 9; i++) {
        const refX = ((i * (width / 7) - this.skylineMidOffset * 0.8 + width) % width);
        const refColor = i % 2 === 0 ? 'rgba(244, 63, 94,' : 'rgba(6, 182, 212,';
        const refWidth = 45 + (i % 3) * 30;

        const refGrad = ctx.createLinearGradient(refX, roadTopY, refX, height);
        refGrad.addColorStop(0, `${refColor} ${reflectionAlpha * 0.7})`);
        refGrad.addColorStop(0.3, `${refColor} ${reflectionAlpha * 0.4})`);
        refGrad.addColorStop(0.7, `${refColor} ${reflectionAlpha * 0.15})`);
        refGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = refGrad;
        ctx.fillRect(refX - refWidth / 2, roadTopY, refWidth, roadHeight);
      }

      // Bike's Own Crimson Underglow & Taillight Reflection on the Wet Pavement
      const bikeRefX = width * (settings.cameraMode === 'front_pursuit' ? 0.5 : 0.42);
      const bikeUnderglowGrad = ctx.createRadialGradient(
        bikeRefX, roadTopY + 70, 10,
        bikeRefX, roadTopY + 90, 220
      );
      bikeUnderglowGrad.addColorStop(0, 'rgba(255, 20, 60, 0.6)');
      bikeUnderglowGrad.addColorStop(0.35, 'rgba(225, 29, 72, 0.3)');
      bikeUnderglowGrad.addColorStop(0.8, 'rgba(159, 18, 57, 0.08)');
      bikeUnderglowGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = bikeUnderglowGrad;
      ctx.fillRect(bikeRefX - 250, roadTopY + 20, 500, roadHeight - 20);
    }

    // Dynamic Road Texture Streaks (Simulating wet tarmac asphalt grain at 60fps)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let ty = roadTopY + 10; ty < height; ty += 12) {
      const speedShift = (this.roadTextureOffset + ty * 3) % 80;
      for (let tx = -80; tx < width + 80; tx += 60) {
        ctx.fillRect(tx + speedShift, ty, 30, 1.5);
      }
    }

    // Reflective Dashed Lane Markers with Speed Motion Blur
    const markerY = roadTopY + roadHeight * 0.58;
    const markerHeight = 8;
    const markerLength = 110 + (telemetry.speedKmh / 300) * 80; // lengthen with speed blur
    const markerSpacing = 240;

    for (let mx = -markerSpacing; mx < width + markerSpacing; mx += markerSpacing) {
      const curX = ((mx - this.laneMarkerOffset + width + markerSpacing * 2) % (width + markerSpacing)) - markerSpacing;

      // Glow on wet lane line
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 12;

      // Line gradient with motion blur fade
      const lineGrad = ctx.createLinearGradient(curX, markerY, curX + markerLength, markerY);
      lineGrad.addColorStop(0, 'rgba(240, 240, 255, 0.1)');
      lineGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
      lineGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.9)');
      lineGrad.addColorStop(1, 'rgba(240, 240, 255, 0.2)');

      ctx.fillStyle = lineGrad;
      ctx.fillRect(curX, markerY, markerLength, markerHeight);

      // Reflection of marker right below it on wet ground
      if (settings.wetness > 0.2) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(curX, markerY + markerHeight + 3, markerLength, markerHeight * 0.7);
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ==========================================
  // 6. HIGHWAY GANTRIES & OVERHEAD SIGNS
  // ==========================================
  private drawHighwayGantries(width: number, cameraY: number, mood: ColorMood) {
    const ctx = this.ctx;
    ctx.save();

    const gantryX = width - (this.gantryOffset % (width + 1200));

    if (gantryX > -300 && gantryX < width + 300) {
      const gantryY = cameraY - 140;

      // Metal Truss Support Pillars
      ctx.fillStyle = '#111218';
      ctx.fillRect(gantryX, gantryY, 20, 200);

      // Horizontal Truss Span
      ctx.fillStyle = '#181a24';
      ctx.fillRect(gantryX - 600, gantryY, 650, 24);

      // Green & Blue Illuminated Expressway Signs
      const signW = 180;
      const signH = 65;
      const signX = gantryX - 340;
      const signY = gantryY + 15;

      ctx.fillStyle = '#064e3b';
      ctx.fillRect(signX, signY, signW, signH);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.strokeRect(signX, signY, signW, signH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TOKYO BAY // ROUTE C1', signX + 12, signY + 22);

      ctx.font = '9px "Space Mono", monospace';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('SPEED LIMIT: UNRESTRICTED', signX + 12, signY + 40);
      ctx.fillText('RADAR ACTIVE [1.2 KM]', signX + 12, signY + 54);

      // Warning Speed indicator LED
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(signX + signW - 18, signY + 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // 7. STREETLAMPS
  // ==========================================
  private drawStreetlamps(width: number, height: number, cameraY: number) {
    const ctx = this.ctx;
    ctx.save();

    const lampSpacing = 500;
    for (let lx = -lampSpacing; lx < width + lampSpacing; lx += lampSpacing) {
      const curX = ((lx - this.streetlampOffset + width + lampSpacing * 2) % (width + lampSpacing)) - lampSpacing;
      const lampY = cameraY - 180;

      // Curved carbon steel pole
      ctx.strokeStyle = '#1e222e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(curX, cameraY);
      ctx.lineTo(curX, lampY + 25);
      ctx.quadraticCurveTo(curX, lampY, curX + 45, lampY);
      ctx.stroke();

      // Lamp head fixture
      ctx.fillStyle = '#0f1117';
      ctx.fillRect(curX + 35, lampY - 4, 30, 8);

      // Glowing LED emitter
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.fillRect(curX + 38, lampY + 3, 24, 4);

      // Light Cone cast down onto wet highway
      ctx.shadowBlur = 0;
      const coneGrad = ctx.createRadialGradient(
        curX + 50, cameraY + 40, 20,
        curX + 50, cameraY + 60, 240
      );
      coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      coneGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.06)');
      coneGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(curX + 50, lampY + 5);
      ctx.lineTo(curX - 160, height);
      ctx.lineTo(curX + 260, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // 8. SUPERBIKE & RIDER CINEMATIC PROFILE
  // ==========================================
  private drawVehicle(
    width: number,
    height: number,
    cameraY: number,
    settings: SceneSettings,
    telemetry: TelemetryData,
    time: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    // Determine position based on camera mode
    let bikeX = width * 0.42;
    let bikeY = cameraY + 30;
    let scale = 1.0;
    let rotation = 0;

    // Suspension dynamics
    // Acceleration causes rear squat (tail drops slightly, nose lifts)
    // Braking causes front dive (nose drops)
    const accelPitch = (telemetry.throttlePercent / 100) * -0.035 + (telemetry.brakePercent / 100) * 0.045;
    rotation += accelPitch;

    // Lean angle from steering
    const leanRad = (telemetry.leanAngle * Math.PI) / 180;

    if (settings.cameraMode === 'low_tracking') {
      // Primary low ground tracking profile: superbike centered with low camera perspective
      bikeX = width * 0.40;
      bikeY = cameraY + 25;
      scale = 1.05;
    } else if (settings.cameraMode === 'wet_reflection') {
      // Ultra-low wet asphalt reflection mode (camera right on the road, viewing both bike & reflection)
      bikeX = width * 0.42;
      bikeY = cameraY - 15;
      scale = 1.15;
    } else if (settings.cameraMode === 'front_pursuit') {
      // Front 3/4 chase shot
      bikeX = width * 0.50;
      bikeY = cameraY + 15;
      scale = 1.25;
      this.drawFrontPursuitSuperbike(ctx, bikeX, bikeY, scale, settings, telemetry, time);
      ctx.restore();
      return;
    } else if (settings.cameraMode === 'cockpit_hud') {
      // First person cockpit view
      this.drawCockpitView(ctx, width, height, cameraY, settings, telemetry, time);
      ctx.restore();
      return;
    } else if (settings.cameraMode === 'chase_cam') {
      // Rear chase cam
      bikeX = width * 0.35;
      bikeY = cameraY + 40;
      scale = 0.95;
    }

    ctx.translate(bikeX, bikeY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // --- DRAW SUPERBIKE SIDE PROFILE ---

    // 1. Carbon Wheels & Brembo Brakes
    const wheelRadius = 55;
    const rearWheelX = -135;
    const frontWheelX = 145;
    const wheelY = 35;

    // Wheel spin angle based on speed
    const spinAngle = (this.elapsedTime * (telemetry.speedKmh * 0.25)) % (Math.PI * 2);

    // Front Wheel
    this.drawWheel(ctx, frontWheelX, wheelY, wheelRadius, spinAngle, telemetry.speedKmh, false);

    // Rear Wheel
    this.drawWheel(ctx, rearWheelX, wheelY, wheelRadius + 2, spinAngle, telemetry.speedKmh, true);

    // 2. Swingarm & Mono-Shock Suspension
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rearWheelX, wheelY);
    ctx.lineTo(-30, 10);
    ctx.stroke();

    // Crimson rear mono-shock spring
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-45, 18);
    ctx.lineTo(-20, -10);
    ctx.stroke();

    // Drive Chain with metallic highlights
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rearWheelX, wheelY - 12);
    ctx.lineTo(-30, 4);
    ctx.lineTo(rearWheelX, wheelY + 12);
    ctx.stroke();

    // 3. Akrapovič Titanium Exhaust & Headers
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(10, 15);
    ctx.quadraticCurveTo(-15, 32, -85, 20);
    ctx.stroke();

    // Carbon fiber exhaust silencer with crimson end-cap
    const exhaustGrad = ctx.createLinearGradient(-85, 20, -115, 10);
    exhaustGrad.addColorStop(0, '#18181b');
    exhaustGrad.addColorStop(0.8, '#09090b');
    exhaustGrad.addColorStop(1, '#e11d48'); // Crimson end ring

    ctx.fillStyle = exhaustGrad;
    ctx.beginPath();
    ctx.moveTo(-75, 22);
    ctx.lineTo(-120, 8);
    ctx.lineTo(-120, -4);
    ctx.lineTo(-75, 12);
    ctx.closePath();
    ctx.fill();

    // Exhaust Blue/Orange Flame burst on hard acceleration
    if (this.exhaustFlameIntensity > 0.05) {
      const flameLen = 45 * this.exhaustFlameIntensity + (Math.sin(time * 0.1) * 15);
      const flameGrad = ctx.createLinearGradient(-120, 2, -120 - flameLen, 0);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.2, '#38bdf8'); // Blue core
      flameGrad.addColorStop(0.6, '#f97316'); // Orange
      flameGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-120, 6);
      ctx.lineTo(-120 - flameLen, 2 + Math.sin(time * 0.2) * 3);
      ctx.lineTo(-120, -2);
      ctx.closePath();
      ctx.fill();

      // Exhaust glow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(-125, 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 4. Inverted Front Forks (Öhlins Gold/Titanium Nitro)
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(frontWheelX, wheelY);
    ctx.lineTo(85, -60);
    ctx.stroke();

    // Upper fork clamp & triple tree (Matte black)
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(105, -35);
    ctx.lineTo(80, -68);
    ctx.stroke();

    // Clip-on handlebars
    ctx.fillStyle = '#27272a';
    ctx.fillRect(72, -72, 18, 6);

    // 5. Engine Core (998cc Inline-4 Crossplane Cylinder Block & Sump)
    ctx.fillStyle = '#121216';
    ctx.beginPath();
    ctx.moveTo(-25, 5);
    ctx.lineTo(45, 5);
    ctx.lineTo(55, -25);
    ctx.lineTo(-20, -20);
    ctx.closePath();
    ctx.fill();

    // Engine clutch cover ring (Crimson CNC Anodized)
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(8, -5, 14, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Matte Black Main Bodywork & Fuel Tank
    const matteBlackGrad = ctx.createLinearGradient(0, -90, 0, 30);
    matteBlackGrad.addColorStop(0, '#27272a');
    matteBlackGrad.addColorStop(0.3, '#18181b');
    matteBlackGrad.addColorStop(0.7, '#09090b');
    matteBlackGrad.addColorStop(1, '#050507');

    ctx.fillStyle = matteBlackGrad;
    ctx.beginPath();
    // Start at fuel tank
    ctx.moveTo(-15, -78);
    ctx.quadraticCurveTo(20, -92, 55, -82); // Tank hump
    ctx.lineTo(105, -65);                  // Nose fairing
    ctx.lineTo(145, -35);                  // Front beak
    ctx.lineTo(125, -15);                  // Air intake scoop
    ctx.lineTo(80, 15);                    // Lower bellypan front
    ctx.lineTo(-10, 18);                   // Lower bellypan rear
    ctx.lineTo(-20, -15);                  // Rear mid-frame
    ctx.lineTo(-85, -65);                  // Tail cowl underside
    ctx.lineTo(-115, -75);                 // Tail tip
    ctx.lineTo(-85, -80);                  // Tail top
    ctx.lineTo(-30, -58);                  // Seat pocket
    ctx.closePath();
    ctx.fill();

    // 7. Sharp Crimson Red Aero Accents & Geometric Panels
    const crimsonGrad = ctx.createLinearGradient(0, -90, 100, 0);
    crimsonGrad.addColorStop(0, '#f43f5e');
    crimsonGrad.addColorStop(0.5, '#e11d48');
    crimsonGrad.addColorStop(1, '#9f1239');

    // Crimson Tank Shroud
    ctx.fillStyle = crimsonGrad;
    ctx.beginPath();
    ctx.moveTo(5, -85);
    ctx.lineTo(48, -78);
    ctx.lineTo(35, -55);
    ctx.lineTo(-5, -62);
    ctx.closePath();
    ctx.fill();

    // Crimson Side Fairing Streak
    ctx.beginPath();
    ctx.moveTo(65, -58);
    ctx.lineTo(115, -42);
    ctx.lineTo(95, -20);
    ctx.lineTo(52, -35);
    ctx.closePath();
    ctx.fill();

    // Crimson Tail Cowl Accent
    ctx.beginPath();
    ctx.moveTo(-65, -72);
    ctx.lineTo(-112, -75);
    ctx.lineTo(-90, -82);
    ctx.lineTo(-55, -68);
    ctx.closePath();
    ctx.fill();

    // 8. MotoGP-Style Carbon Aerodynamic Winglets (Generating 25kg downforce)
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(110, -42);
    ctx.lineTo(135, -40);
    ctx.lineTo(142, -30);
    ctx.lineTo(118, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower secondary winglet
    ctx.beginPath();
    ctx.moveTo(95, -28);
    ctx.lineTo(118, -26);
    ctx.lineTo(122, -18);
    ctx.lineTo(100, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 9. Aerodynamic Tinted Windscreen (Dark Smoke Polycarbonate with purple/blue reflection)
    const screenGrad = ctx.createLinearGradient(80, -95, 130, -55);
    screenGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    screenGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.85)');
    screenGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');

    ctx.fillStyle = screenGrad;
    ctx.beginPath();
    ctx.moveTo(85, -68);
    ctx.quadraticCurveTo(110, -95, 125, -60);
    ctx.lineTo(105, -58);
    ctx.closePath();
    ctx.fill();

    // 10. Razor Crimson LED Taillight
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 16;
    ctx.fillRect(-118, -77, 8, 4);

    // Trailing aerodynamic crimson light streak behind the tail
    const streakGrad = ctx.createLinearGradient(-118, -75, -240, -75);
    streakGrad.addColorStop(0, 'rgba(255, 23, 68, 0.9)');
    streakGrad.addColorStop(0.4, 'rgba(225, 29, 72, 0.4)');
    streakGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = streakGrad;
    ctx.fillRect(-240, -77, 122, 3);
    ctx.shadowBlur = 0;

    // 11. Dual Projector LED Headlights casting beam forward
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(142, -35, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Forward Light Beam on Road
    const beamGrad = ctx.createRadialGradient(145, -35, 5, 450, 40, 380);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    beamGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.35)');
    beamGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.08)');
    beamGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(145, -35);
    ctx.lineTo(600, -10);
    ctx.lineTo(550, 120);
    ctx.lineTo(145, -25);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // 12. Aerodynamic Track-Tucked Rider
    this.drawRider(ctx, time, telemetry);

    // Draw specular reflections on the chassis from passing streetlights
    const specAlpha = (Math.sin(time * 0.008) + 1) * 0.25;
    ctx.fillStyle = `rgba(255, 255, 255, ${specAlpha})`;
    ctx.beginPath();
    ctx.moveTo(15, -88);
    ctx.lineTo(45, -82);
    ctx.lineTo(35, -80);
    ctx.lineTo(8, -85);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // WHEEL & BRAKE RENDERER WITH RADIAL MOTION BLUR
  // ==========================================
  private drawWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    angle: number,
    speedKmh: number,
    isRear: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Deep grooved wet tire rubber
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Tire wet specular sheen ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Crimson rim tape stripe
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner carbon rim cavity
    ctx.fillStyle = '#050507';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 12, 0, Math.PI * 2);
    ctx.fill();

    // Drilled ventilated brake disc (Brembo 330mm T-Drive)
    const discRadius = radius - 22;
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crimson Brembo Stylema Monobloc Caliper (Stationary, does not rotate)
    ctx.fillStyle = '#e11d48';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    if (isRear) {
      ctx.roundRect(-discRadius - 4, -8, 18, 16, [4]);
    } else {
      ctx.roundRect(discRadius - 12, -22, 18, 26, [4]);
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Brembo white text logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('BREMBO', isRear ? -discRadius + 1 : discRadius - 8, isRear ? 2 : -8);

    // Carbon Wheel Spokes with Speed Motion Blur
    const spokeCount = 6;
    const blurAlpha = Math.max(0.2, 1 - speedKmh / 220);

    ctx.rotate(angle);

    for (let i = 0; i < spokeCount; i++) {
      ctx.rotate((Math.PI * 2) / spokeCount);

      // Main Carbon Spoke
      ctx.strokeStyle = `rgba(39, 39, 42, ${blurAlpha + 0.3})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, radius - 14);
      ctx.stroke();

      // Motion Blur trail fan if moving fast
      if (speedKmh > 40) {
        ctx.fillStyle = 'rgba(225, 29, 72, 0.12)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 14, 0, 0.35);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Wheel Hub Center Nut (CNC Titanium)
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // RIDER IN MATTE BLACK & CRIMSON LEATHERS
  // ==========================================
  private drawRider(ctx: CanvasRenderingContext2D, time: number, telemetry: TelemetryData) {
    ctx.save();

    // Matte black race suit body
    ctx.fillStyle = '#0f1015';

    // Lower body / thighs in full aggressive aerodynamic tuck
    ctx.beginPath();
    ctx.moveTo(-45, -55);
    ctx.lineTo(15, -42);
    ctx.lineTo(-10, -22);
    ctx.lineTo(-40, -25);
    ctx.closePath();
    ctx.fill();

    // Knee slider with titanium puck touching the tarmac
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(10, -26, 6, 0, Math.PI * 2);
    ctx.fill();

    // Torso flat against the fuel tank
    ctx.fillStyle = '#14161f';
    ctx.beginPath();
    ctx.moveTo(-35, -60);
    ctx.lineTo(40, -68);
    ctx.lineTo(30, -82);
    ctx.lineTo(-25, -78);
    ctx.closePath();
    ctx.fill();

    // Aerodynamic Speed Hump on Rider's Back
    ctx.fillStyle = '#090a0f';
    ctx.beginPath();
    ctx.moveTo(-30, -78);
    ctx.quadraticCurveTo(-15, -92, 10, -84);
    ctx.lineTo(0, -78);
    ctx.closePath();
    ctx.fill();

    // Crimson accent stripes on race suit
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-20, -76);
    ctx.lineTo(25, -70);
    ctx.stroke();

    // Forearms extended forward gripping the clip-ons
    ctx.fillStyle = '#0c0d12';
    ctx.beginPath();
    ctx.moveTo(35, -75);
    ctx.lineTo(75, -70);
    ctx.lineTo(72, -64);
    ctx.lineTo(30, -66);
    ctx.closePath();
    ctx.fill();

    // Carbon Racing Gloves
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(75, -70, 5, 0, Math.PI * 2);
    ctx.fill();

    // Aerodynamic Helmet (Full tuck behind the windscreen)
    const helmetX = 42;
    const helmetY = -85;

    // Matte Black Shell
    ctx.fillStyle = '#09090c';
    ctx.beginPath();
    ctx.arc(helmetX, helmetY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Rear Helmet Aero Spoiler
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(helmetX - 10, helmetY - 8);
    ctx.lineTo(helmetX - 22, helmetY - 4);
    ctx.lineTo(helmetX - 12, helmetY + 6);
    ctx.closePath();
    ctx.fill();

    // Iridium Chrome Visor reflecting Neon City Lights
    const visorGrad = ctx.createLinearGradient(helmetX - 5, helmetY - 6, helmetX + 16, helmetY + 4);
    visorGrad.addColorStop(0, '#38bdf8');  // Cyan reflection
    visorGrad.addColorStop(0.5, '#f43f5e'); // Crimson reflection
    visorGrad.addColorStop(1, '#ca8a04');  // Golden dusk reflection

    ctx.fillStyle = visorGrad;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(helmetX + 2, helmetY - 6);
    ctx.quadraticCurveTo(helmetX + 16, helmetY - 2, helmetX + 12, helmetY + 6);
    ctx.lineTo(helmetX + 2, helmetY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ==========================================
  // ALTERNATIVE CAMERA: FRONTAL PURSUIT
  // ==========================================
  private drawFrontPursuitSuperbike(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    settings: SceneSettings,
    telemetry: TelemetryData,
    time: number
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Lean angle tilt
    ctx.rotate((telemetry.leanAngle * Math.PI) / 180 * 0.6);

    // Front Tire coming straight at the camera
    ctx.fillStyle = '#0a0a0d';
    ctx.beginPath();
    ctx.ellipse(0, 50, 24, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wet tire tread reflections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 50, 18, 52, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Front Brembo calipers & Twin 330mm Rotors
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-28, 40, 10, 24);
    ctx.fillRect(18, 40, 10, 24);

    // Front Gold Öhlins Suspension Forks
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-34, -10, 8, 60);
    ctx.fillRect(26, -10, 8, 60);

    // Aggressive Front Nose Fairing (Matte Black with Crimson Accents)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(-65, -25);
    ctx.lineTo(-45, -75);
    ctx.lineTo(45, -75);
    ctx.lineTo(65, -25);
    ctx.closePath();
    ctx.fill();

    // Sharp Crimson Aero Winglets (Extended wide for massive downforce)
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(-55, -25);
    ctx.lineTo(-95, -15);
    ctx.lineTo(-90, -5);
    ctx.lineTo(-50, -15);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(55, -25);
    ctx.lineTo(95, -15);
    ctx.lineTo(90, -5);
    ctx.lineTo(50, -15);
    ctx.closePath();
    ctx.fill();

    // Dual Razor LED Headlights (Piercing white/blue lights directly at camera)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;

    // Left Headlight
    ctx.beginPath();
    ctx.moveTo(-42, -35);
    ctx.lineTo(-12, -28);
    ctx.lineTo(-16, -22);
    ctx.lineTo(-46, -26);
    ctx.closePath();
    ctx.fill();

    // Right Headlight
    ctx.beginPath();
    ctx.moveTo(42, -35);
    ctx.lineTo(12, -28);
    ctx.lineTo(16, -22);
    ctx.lineTo(46, -26);
    ctx.closePath();
    ctx.fill();

    // Windscreen & Rider Helmet
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, -95);
    ctx.lineTo(-30, -65);
    ctx.lineTo(30, -65);
    ctx.closePath();
    ctx.fill();

    // Helmet visor dead-ahead
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, -80, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gigantic Lens Flare radiating from the dual headlights
    const flareGrad = ctx.createRadialGradient(0, -28, 5, 0, -28, 280);
    flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    flareGrad.addColorStop(0.15, 'rgba(56, 189, 248, 0.6)');
    flareGrad.addColorStop(0.5, 'rgba(225, 29, 72, 0.25)');
    flareGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = flareGrad;
    ctx.fillRect(-280, -308, 560, 560);

    ctx.restore();
  }

  // ==========================================
  // ALTERNATIVE CAMERA: COCKPIT / FIRST-PERSON POV
  // ==========================================
  private drawCockpitView(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraY: number,
    settings: SceneSettings,
    telemetry: TelemetryData,
    time: number
  ) {
    ctx.save();

    const cockpitY = height * 0.68;

    // Clip-on handlebar clamp & steering damper
    ctx.fillStyle = '#09090b';
    ctx.fillRect(width * 0.15, cockpitY + 80, width * 0.7, 90);

    // Left and Right Handgrips & Bar-end Mirrors
    ctx.fillStyle = '#18181b';
    ctx.fillRect(width * 0.05, cockpitY + 60, 110, 35);
    ctx.fillRect(width * 0.95 - 110, cockpitY + 60, 110, 35);

    // Crimson CNC Clutch & Front Brake Levers
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(width * 0.08, cockpitY + 50, 80, 8);
    ctx.fillRect(width * 0.92 - 80, cockpitY + 50, 80, 8);

    // Brembo Radial Brake Fluid Reservoir (Translucent with amber fluid)
    ctx.fillStyle = 'rgba(217, 119, 6, 0.85)';
    ctx.beginPath();
    ctx.arc(width * 0.82, cockpitY + 30, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Central Color TFT Display Dashboard
    const dashW = 280;
    const dashH = 140;
    const dashX = (width - dashW) / 2;
    const dashY = cockpitY - 20;

    // Bezel
    ctx.fillStyle = '#050508';
    ctx.roundRect(dashX, dashY, dashW, dashH, [12]);
    ctx.fill();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Screen Content
    ctx.fillStyle = '#0a0a10';
    ctx.roundRect(dashX + 8, dashY + 8, dashW - 16, dashH - 16, [8]);
    ctx.fill();

    // Tachometer Arc on Screen
    const rpmRatio = telemetry.rpm / telemetry.maxRpm;
    ctx.strokeStyle = rpmRatio > 0.85 ? '#ef4444' : '#00e5ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(dashX + dashW / 2, dashY + 70, 55, Math.PI * 0.8, Math.PI * (0.8 + rpmRatio * 1.4));
    ctx.stroke();

    // Digital Speed
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(telemetry.speedKmh)}`, dashX + dashW / 2, dashY + 70);

    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('KM/H', dashX + dashW / 2, dashY + 86);

    // Gear
    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.fillText(`GEAR ${telemetry.gear}`, dashX + dashW / 2, dashY + 112);

    // Tinted Windscreen Arc in upper viewport
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, cockpitY - 140, width * 0.48, Math.PI * 0.9, Math.PI * 0.1, true);
    ctx.stroke();

    // Rain beads sliding up the windscreen at high speed
    if (settings.wetness > 0.1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 24; i++) {
        const rx = (width * 0.25 + (i * 47 + time * 0.1) % (width * 0.5));
        const ry = (cockpitY - 200 + (i * 31 - time * 0.4) % 180);
        ctx.beginPath();
        ctx.ellipse(rx, ry, 2.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 9. TIRE WATER SPRAY & RAIN PARTICLES
  // ==========================================
  private drawSprayAndRain(
    width: number,
    height: number,
    cameraY: number,
    settings: SceneSettings,
    telemetry: TelemetryData,
    dt: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    const speedNorm = telemetry.speedKmh / 300;

    // Spawn Tire Spray Particles when road is wet
    if (settings.wetness > 0.05 && telemetry.speedKmh > 20) {
      const bikeX = width * 0.40;
      const rearTireX = bikeX - 135;
      const frontTireX = bikeX + 145;
      const tireY = cameraY + 65;

      const particleCount = Math.floor(settings.wetness * speedNorm * 6) + 1;
      for (let i = 0; i < particleCount; i++) {
        // Rear tire spray (massive rooster tail)
        this.sprayParticles.push({
          x: rearTireX + (Math.random() * 10 - 5),
          y: tireY + (Math.random() * 8 - 4),
          vx: -(speedNorm * 320 + Math.random() * 180),
          vy: -(Math.random() * 60 + 15),
          life: 0,
          maxLife: 0.4 + Math.random() * 0.5,
          size: 2.5 + Math.random() * 5,
          alpha: 0.4 + Math.random() * 0.4,
        });

        // Front tire spray
        this.sprayParticles.push({
          x: frontTireX + (Math.random() * 8 - 4),
          y: tireY,
          vx: -(speedNorm * 260 + Math.random() * 120),
          vy: -(Math.random() * 35 + 5),
          life: 0,
          maxLife: 0.3 + Math.random() * 0.3,
          size: 2 + Math.random() * 3.5,
          alpha: 0.3,
        });
      }
    }

    // Update & Draw Spray Particles
    for (let i = this.sprayParticles.length - 1; i >= 0; i--) {
      const p = this.sprayParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.sprayParticles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += dt * 18; // expands as mist

      const progress = p.life / p.maxLife;
      const currentAlpha = (1 - progress) * p.alpha * settings.wetness;

      // Crimson / neon illuminated mist
      ctx.fillStyle = `rgba(244, 63, 94, ${currentAlpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // White water core
      ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rain Particles
    if (settings.rainIntensity > 0.02) {
      const angle = Math.PI * 0.18; // slanted wind angle due to speed
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
      ctx.lineWidth = 1.4;

      for (const drop of this.rainDrops) {
        drop.x -= drop.speed * (speedNorm * 2.2 + 1.2);
        drop.y += drop.speed * 1.5;

        if (drop.x < 0) drop.x = width + Math.random() * 100;
        if (drop.y > height) drop.y = -drop.length;

        ctx.strokeStyle = `rgba(224, 242, 254, ${drop.opacity * settings.rainIntensity})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * sinA, drop.y + drop.length * cosA);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ==========================================
  // 10. CINEMATIC POST EFFECTS & OPTICS
  // ==========================================
  private drawPostEffects(
    width: number,
    height: number,
    settings: SceneSettings,
    telemetry: TelemetryData
  ) {
    const ctx = this.ctx;
    ctx.save();

    const speedNorm = telemetry.speedKmh / 300;

    // 1. Horizontal Anamorphic Blue / Crimson Flare Streaks (Panavision cinema look)
    if (settings.anamorphicFlare) {
      const flareY = height * 0.62;
      const flareGrad = ctx.createLinearGradient(0, flareY, width, flareY);
      flareGrad.addColorStop(0, 'transparent');
      flareGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.06)');
      flareGrad.addColorStop(0.42, 'rgba(255, 23, 68, 0.28)');
      flareGrad.addColorStop(0.48, 'rgba(255, 255, 255, 0.75)');
      flareGrad.addColorStop(0.54, 'rgba(56, 189, 248, 0.35)');
      flareGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.06)');
      flareGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 2, width, 4);

      // Secondary subtle flare line
      ctx.fillRect(0, flareY + 25, width, 1.5);
    }

    // 2. High-Speed Peripheral Motion Blur & Chromatic Aberration Vignette
    if (settings.motionBlurAmount > 0.05 && speedNorm > 0.3) {
      const edgeVignette = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.35,
        width / 2, height / 2, width * 0.75
      );
      edgeVignette.addColorStop(0, 'transparent');
      edgeVignette.addColorStop(0.8, `rgba(5, 5, 8, ${speedNorm * settings.motionBlurAmount * 0.45})`);
      edgeVignette.addColorStop(1, `rgba(225, 29, 72, ${speedNorm * settings.motionBlurAmount * 0.25})`);

      ctx.fillStyle = edgeVignette;
      ctx.fillRect(0, 0, width, height);

      // Speed lines on outer edges
      ctx.strokeStyle = `rgba(255, 255, 255, ${speedNorm * 0.12})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 15; i++) {
        const sy = (i * 73 + this.elapsedTime * 400) % height;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(80 + Math.random() * 120, sy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(width, sy);
        ctx.lineTo(width - (80 + Math.random() * 120), sy);
        ctx.stroke();
      }
    }

    // 3. Realistic Water Droplets on Camera Lens with Gravity Slide
    if (settings.rainIntensity > 0.1 || settings.wetness > 0.5) {
      for (const drop of this.lensDrops) {
        drop.y += drop.slideY;
        if (drop.y > height + 20) {
          drop.y = -10;
          drop.x = Math.random() * width;
        }

        // Droplet Glass Refraction
        const dropGrad = ctx.createRadialGradient(
          drop.x - drop.r * 0.3, drop.y - drop.r * 0.3, drop.r * 0.1,
          drop.x, drop.y, drop.r
        );
        dropGrad.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha * 0.9})`);
        dropGrad.addColorStop(0.5, `rgba(56, 189, 248, ${drop.alpha * 0.3})`);
        dropGrad.addColorStop(1, `rgba(0, 0, 0, ${drop.alpha * 0.5})`);

        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Cinematic Dark Edge Vignette
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.3,
      width / 2, height / 2, width * 0.72
    );
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.7, 'rgba(5, 5, 8, 0.45)');
    vignette.addColorStop(1, 'rgba(2, 2, 4, 0.85)');

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}

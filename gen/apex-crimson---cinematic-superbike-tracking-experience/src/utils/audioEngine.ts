/**
 * Real-time Web Audio Synthesizer for Superbike Engine, Exhaust, Wet Tire Spray & Aerodynamic Wind.
 */

class SuperbikeAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = false;
  private masterGain: GainNode | null = null;

  // Engine oscillators & nodes
  private engineGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private waveshaper: WaveShaperNode | null = null;

  // Wet road tire spray noise nodes
  private tireSprayGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  // Wind rush noise nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Turbo / supercharger whine
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  private lastGear = 1;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- 1. Superbike Engine Synthesizer ---
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // Waveshaper for throaty crossplane rasp
      this.waveshaper = this.ctx.createWaveShaper();
      this.waveshaper.curve = this.makeDistortionCurve(18);

      // Oscillators (Crossplane 4-cylinder harmonics)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'sawtooth';
      this.osc3.frequency.setValueAtTime(135, this.ctx.currentTime);

      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      this.osc1.connect(this.waveshaper);
      this.osc2.connect(this.waveshaper);
      this.osc3.connect(this.waveshaper);
      this.subOsc.connect(this.waveshaper);

      this.waveshaper.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();
      this.subOsc.start();

      // --- 2. Turbo Whine Generator ---
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboOsc.start();

      // --- 3. Wet Tire Spray Noise & Wind ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Tire Spray
      const tireNoiseSource = this.ctx.createBufferSource();
      tireNoiseSource.buffer = noiseBuffer;
      tireNoiseSource.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      this.tireFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.tireSprayGain = this.ctx.createGain();
      this.tireSprayGain.gain.setValueAtTime(0, this.ctx.currentTime);

      tireNoiseSource.connect(this.tireFilter);
      this.tireFilter.connect(this.tireSprayGain);
      this.tireSprayGain.connect(this.masterGain);
      tireNoiseSource.start();

      // Wind Rush
      const windNoiseSource = this.ctx.createBufferSource();
      windNoiseSource.buffer = noiseBuffer;
      windNoiseSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

      windNoiseSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      windNoiseSource.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized automatically:', e);
    }
  }

  private makeDistortionCurve(amount = 20) {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public update(params: {
    rpm: number;
    gear: number | string;
    speedKmh: number;
    throttle: number;
    wetness: number;
    nitroBoost: boolean;
    soundEnabled: boolean;
    volume: number;
  }) {
    if (!this.isInitialized || !this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended' && params.soundEnabled) {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const currentVol = params.soundEnabled ? params.volume : 0;
    this.masterGain.gain.setTargetAtTime(currentVol, t, 0.05);

    if (!params.soundEnabled || currentVol <= 0.001) return;

    // Detect gear shift pop
    const gearNum = typeof params.gear === 'number' ? params.gear : 1;
    if (gearNum !== this.lastGear) {
      this.triggerGearPop();
      this.lastGear = gearNum;
    }

    // Engine Pitch calculation
    // Idle around 1500 RPM (~40Hz base), Max 14500 RPM (~380Hz base)
    const normRpm = Math.max(0.1, Math.min(1.0, params.rpm / 14500));
    const baseFreq = 35 + normRpm * 320;

    if (this.osc1 && this.osc2 && this.osc3 && this.subOsc) {
      this.osc1.frequency.setTargetAtTime(baseFreq, t, 0.03);
      this.osc2.frequency.setTargetAtTime(baseFreq * 2.01, t, 0.03);
      this.osc3.frequency.setTargetAtTime(baseFreq * 3.02, t, 0.03);
      this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.03);
    }

    // Engine Filter cutoff expands with throttle & RPM
    if (this.engineFilter) {
      const targetCutoff = 350 + params.throttle * 3200 + normRpm * 2800 + (params.nitroBoost ? 1500 : 0);
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, t, 0.04);
    }

    // Engine Volume
    if (this.engineGain) {
      const baseGain = 0.22 + params.throttle * 0.45 + (params.nitroBoost ? 0.2 : 0);
      this.engineGain.gain.setTargetAtTime(baseGain, t, 0.04);
    }

    // Turbo Whine
    if (this.turboOsc && this.turboGain) {
      const turboPitch = 1200 + normRpm * 4500 + (params.nitroBoost ? 1800 : 0);
      this.turboOsc.frequency.setTargetAtTime(turboPitch, t, 0.05);
      const turboVol = (params.throttle * 0.12 + (params.nitroBoost ? 0.18 : 0)) * (params.speedKmh > 50 ? 1 : 0.2);
      this.turboGain.gain.setTargetAtTime(turboVol, t, 0.08);
    }

    // Wet Tire Spray
    if (this.tireSprayGain && this.tireFilter) {
      const speedFactor = Math.min(1, params.speedKmh / 220);
      const wetFactor = params.wetness;
      const tireVol = speedFactor * wetFactor * 0.28;
      this.tireSprayGain.gain.setTargetAtTime(tireVol, t, 0.06);
      this.tireFilter.frequency.setTargetAtTime(1400 + speedFactor * 1600, t, 0.06);
    }

    // Wind Rush
    if (this.windGain && this.windFilter) {
      const speedRatio = Math.min(1, params.speedKmh / 300);
      const windVol = Math.pow(speedRatio, 1.6) * 0.35;
      this.windGain.gain.setTargetAtTime(windVol, t, 0.08);
      this.windFilter.frequency.setTargetAtTime(300 + speedRatio * 1800, t, 0.08);
    }
  }

  private triggerGearPop() {
    if (!this.ctx || !this.engineGain) return;
    const t = this.ctx.currentTime;
    // Brief duck and explosive pop
    this.engineGain.gain.setValueAtTime(0.05, t);
    this.engineGain.gain.exponentialRampToValueAtTime(0.55, t + 0.05);
    this.engineGain.gain.exponentialRampToValueAtTime(0.35, t + 0.14);
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }
}

export const audioEngine = new SuperbikeAudioEngine();

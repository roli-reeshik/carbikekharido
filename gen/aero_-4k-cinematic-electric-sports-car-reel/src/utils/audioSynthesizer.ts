// Web Audio API based synthesized electric vehicle and coastal ambient audio engine

class CinematicAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Motor Synthesizer Nodes
  private motorMasterGain: GainNode | null = null;
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  // Ocean Surf White-noise generator
  private oceanGain: GainNode | null = null;
  private oceanFilter: BiquadFilterNode | null = null;
  private oceanNoiseNode: AudioBufferSourceNode | null = null;

  // Road friction texture noise
  private roadGain: GainNode | null = null;
  private roadFilter: BiquadFilterNode | null = null;

  // Sub-bass cinematic drone
  private droneGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;

  private masterGain: GainNode | null = null;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Dual-Motor EV Harmonic Whine
      this.motorMasterGain = this.ctx.createGain();
      this.motorMasterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.motorFilter = this.ctx.createBiquadFilter();
      this.motorFilter.type = 'lowpass';
      this.motorFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.motorFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.motorOsc1 = this.ctx.createOscillator();
      this.motorOsc1.type = 'sine';
      this.motorOsc1.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.motorOsc2 = this.ctx.createOscillator();
      this.motorOsc2.type = 'triangle';
      this.motorOsc2.frequency.setValueAtTime(240, this.ctx.currentTime);

      const subMotor = this.ctx.createOscillator();
      subMotor.type = 'sine';
      subMotor.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.motorOsc1.connect(this.motorFilter);
      this.motorOsc2.connect(this.motorFilter);
      subMotor.connect(this.motorFilter);
      this.motorFilter.connect(this.motorMasterGain);
      this.motorMasterGain.connect(this.masterGain);

      this.motorOsc1.start();
      this.motorOsc2.start();
      subMotor.start();

      // 2. Coastal Ocean Surf (Pink/White noise generator)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      this.oceanNoiseNode = this.ctx.createBufferSource();
      this.oceanNoiseNode.buffer = noiseBuffer;
      this.oceanNoiseNode.loop = true;

      this.oceanFilter = this.ctx.createBiquadFilter();
      this.oceanFilter.type = 'bandpass';
      this.oceanFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.oceanFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.oceanGain = this.ctx.createGain();
      this.oceanGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.oceanNoiseNode.connect(this.oceanFilter);
      this.oceanFilter.connect(this.oceanGain);
      this.oceanGain.connect(this.masterGain);
      this.oceanNoiseNode.start();

      // 3. Road & Tire Friction
      const roadNoiseSource = this.ctx.createBufferSource();
      roadNoiseSource.buffer = noiseBuffer;
      roadNoiseSource.loop = true;

      this.roadFilter = this.ctx.createBiquadFilter();
      this.roadFilter.type = 'lowpass';
      this.roadFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.roadGain = this.ctx.createGain();
      this.roadGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

      roadNoiseSource.connect(this.roadFilter);
      this.roadFilter.connect(this.roadGain);
      this.roadGain.connect(this.masterGain);
      roadNoiseSource.start();

      // 4. Cinematic Sub Ambient Drone (warm golden hour mood)
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // 55Hz (A1)

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.1, this.ctx.currentTime);

      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio initialization skipped:", e);
    }
  }

  public updateParameters(speedMph: number, slowMoRate: number, isPlaying: boolean, volume: number, enabled: boolean) {
    if (!this.ctx || !this.isInitialized) return;

    if (this.ctx.state === 'suspended' && enabled && isPlaying) {
      this.ctx.resume();
    }

    const effectiveVolume = (enabled && isPlaying) ? volume : 0.0001;
    const now = this.ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(effectiveVolume * 0.8, now, 0.08);
    }

    if (!isPlaying || !enabled) return;

    // Calculate motor frequency based on speed and slow-mo factor
    const baseFreq = 80 + (speedMph / 120) * 360;
    const slowMoScaledFreq = baseFreq * (0.4 + slowMoRate * 0.6);

    if (this.motorOsc1) {
      this.motorOsc1.frequency.setTargetAtTime(slowMoScaledFreq, now, 0.1);
    }
    if (this.motorOsc2) {
      this.motorOsc2.frequency.setTargetAtTime(slowMoScaledFreq * 2.01, now, 0.1);
    }
    if (this.motorFilter) {
      this.motorFilter.frequency.setTargetAtTime(800 + (speedMph * 15), now, 0.1);
    }

    // Road friction scales with speed
    if (this.roadGain) {
      const roadLevel = Math.min(0.3, 0.05 + (speedMph / 140) * 0.25) * slowMoRate;
      this.roadGain.gain.setTargetAtTime(roadLevel, now, 0.1);
    }

    // Ocean swell subtle rhythmic modulation
    if (this.oceanGain) {
      const time = Date.now() / 3000;
      const swell = 0.12 + Math.sin(time) * 0.05;
      this.oceanGain.gain.setTargetAtTime(swell, now, 0.2);
    }
  }

  public stop() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }
}

export const cinematicAudio = new CinematicAudioEngine();

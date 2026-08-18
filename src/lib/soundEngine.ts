// Audio Engine for CarBikeKharido Cinematic Transitions
// Safely plays HTML5 audio assets (/assets/car-rev.mp3 & /assets/bike-rev.mp3)
// with zero-dependency Web Audio API synthetic fallback for rich roars.

let activeAudio: HTMLAudioElement | null = null;
let activeAudioCtx: AudioContext | null = null;

export function stopAllSounds() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }
  if (activeAudioCtx) {
    try {
      activeAudioCtx.close();
    } catch {}
    activeAudioCtx = null;
  }
}

export function playCarRevSound() {
  stopAllSounds();

  try {
    const audio = new Audio("/assets/car-rev.mp3");
    audio.volume = 0.85;
    activeAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Audio synthesis if mp3 asset is unavailable
        playSyntheticCarEngine();
      });
    }
  } catch {
    playSyntheticCarEngine();
  }
}

export function playBikeRevSound() {
  stopAllSounds();

  try {
    const audio = new Audio("/assets/bike-rev.mp3");
    audio.volume = 0.85;
    activeAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Audio synthesis if mp3 asset is unavailable
        playSyntheticBikeEngine();
      });
    }
  } catch {
    playSyntheticBikeEngine();
  }
}

function playSyntheticCarEngine() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    activeAudioCtx = ctx;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "triangle";

    // V8/V12 twin-turbo ramp up
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(320, now + 0.6);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 1.2);

    osc2.frequency.setValueAtTime(130, now);
    osc2.frequency.exponentialRampToValueAtTime(640, now + 0.6);
    osc2.frequency.exponentialRampToValueAtTime(280, now + 1.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.6);
    filter.frequency.exponentialRampToValueAtTime(600, now + 1.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.4);
    osc2.stop(now + 1.4);
  } catch {}
}

function playSyntheticBikeEngine() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    activeAudioCtx = ctx;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    // 16,500 RPM screamer sweep
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.5);
    osc.frequency.exponentialRampToValueAtTime(380, now + 1.1);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(900, now + 1.1);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.3);
  } catch {}
}

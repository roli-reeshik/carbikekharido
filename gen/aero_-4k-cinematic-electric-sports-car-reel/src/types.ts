export type CameraAngle = 
  | 'profile_tracking' 
  | 'chase_front' 
  | 'cliff_drone' 
  | 'wheel_macro' 
  | 'cockpit_sunset';

export type LUTPreset = 
  | 'arri_golden' 
  | 'kodak_vision3' 
  | 'teal_orange' 
  | 'monochrome_noir' 
  | 'bleach_bypass' 
  | 'cyber_charcoal';

export interface CinematicSettings {
  isPlaying: boolean;
  speedMph: number;
  slowMoRate: number; // 0.1 to 2.0
  shutterAngle: number; // 90 to 360 degrees
  cameraAngle: CameraAngle;
  lutPreset: LUTPreset;
  exposure: number; // -1.0 to 1.0
  warmth: number; // -1.0 to 1.0
  flareIntensity: number; // 0 to 1.5
  filmGrain: number; // 0 to 1.0
  dustDensity: number; // 0 to 1.5
  sunElevation: number; // 5 to 45 degrees
  motionBlur: boolean;
  chromaticAberration: boolean;
  cinemaLetterbox: boolean;
  activeAero: boolean;
  audioEnabled: boolean;
  masterVolume: number; // 0 to 1
  pureCinemaMode: boolean; // Hide all overlays for pristine commercial loop
}

export interface TelemetryData {
  speedMph: number;
  motorPowerKw: number;
  gForceLat: number;
  gForceLong: number;
  batteryPct: number;
  downforceKg: number;
  tirePressurePsi: number;
  roadGripPct: number;
  activeWingAngleDeg: number;
}

export interface DirectorAnalysis {
  cinematographerNotes: string;
  lightingBreakdown: string;
  audioDirectorCues: string;
  directorScore: string;
  shotComposition: string;
}

export type CameraMode = 
  | 'low_tracking'      // Low ground tracking profile (Primary)
  | 'wet_reflection'   // Ultra-low wet asphalt reflection
  | 'front_pursuit'    // Low front 3/4 aggressive pursuit
  | 'cockpit_hud'      // First person cockpit view
  | 'chase_cam';       // Rear 3/4 chase shot

export type ColorMood = 
  | 'dusk_crimson'     // Matte black, crimson neon, deep twilight
  | 'tokyo_cyber'      // Cyan, magenta, rain reflections
  | 'monolith_stealth' // Dark monochromatic with amber accents
  | 'golden_hour';     // Warm sunset dusk with long violet shadows

export type AspectRatioMode = 'cinemascope' | 'standard' | 'imax';

export interface SceneSettings {
  cameraMode: CameraMode;
  colorMood: ColorMood;
  aspectRatio: AspectRatioMode;
  targetSpeed: number; // 0 to 320 km/h
  speedKmh: number;
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  nitroBoost: boolean;
  wetness: number; // 0 to 1
  rainIntensity: number; // 0 to 1
  motionBlurAmount: number; // 0 to 1
  cameraPanUp: number; // 0 to 1
  cameraShake: number; // 0 to 1
  anamorphicFlare: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  autoDirector: boolean;
  showTelemetry: boolean;
  showCommercialTitles: boolean;
  isCinemaBars: boolean;
}

export interface TelemetryData {
  speedKmh: number;
  speedMph: number;
  rpm: number;
  maxRpm: number;
  gear: number | 'N';
  leanAngle: number; // degrees -35 to +35
  throttlePercent: number;
  brakePercent: number;
  gForceLateral: number;
  gForceLongitudinal: number;
  downforceKg: number;
  turboBoostBar: number;
  distanceKm: number;
  currentFps: number;
}

export interface SuperbikeSpecs {
  modelName: string;
  codename: string;
  engine: string;
  displacement: string;
  power: string;
  torque: string;
  topSpeed: string;
  dryWeight: string;
  acceleration0to100: string;
  frame: string;
  aerodynamics: string;
  brakes: string;
  exhaust: string;
}

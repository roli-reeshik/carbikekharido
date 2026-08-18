/** Structured two-wheeler specification parsed from a source model page. */

export type RidingPosture = "upright" | "sport" | "cruiser" | "adventure" | "step-through";

export type BikeBodyType =
  | "commuter"
  | "sports"
  | "naked"
  | "cruiser"
  | "adventure"
  | "touring"
  | "scooter"
  | "moped"
  | "cafe-racer"
  | "roadster"
  | "off-road";

/** Every field is optional — coverage varies by model and a partial row is still useful. */
export interface ParsedBikeSpec {
  displacementCc?: number;
  engineType?: string;
  cylinders?: number;
  maxPowerPs?: number;
  maxPowerRpm?: number;
  maxTorqueNm?: number;
  maxTorqueRpm?: number;
  topSpeedKmph?: number;
  coolingSystem?: string;
  startingSystem?: string;
  transmissionType?: string;
  gears?: number;
  driveType?: string;
  emissionNorm?: string;

  mileageCityKmpl?: number;
  mileageHighwayKmpl?: number;
  mileageOverallKmpl?: number;

  seatHeightMm?: number;
  kerbWeightKg?: number;
  groundClearanceMm?: number;
  wheelbaseMm?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  fuelTankL?: number;
  fuelReserveL?: number;

  frontBrake?: string;
  rearBrake?: string;
  absType?: string;
  tyreFront?: string;
  tyreRear?: string;
  wheelType?: string;
  frontSuspension?: string;
  rearSuspension?: string;

  warrantyYears?: number;
  warrantyKm?: number;
  firstServiceKm?: number;
  serviceIntervalKm?: number;

  batteryKwh?: number;
  claimedRangeKm?: number;
  chargeTimeHrs?: number;
  motorKw?: number;

  bodyTypeRaw?: string;
  bodyType?: BikeBodyType;
  ridingPosture?: RidingPosture;
  powerToWeight?: number;
  isElectric?: boolean;
  /** Unreleased model — the source has few or no specs published yet. */
  isUpcoming?: boolean;

  /** Prices in rupees, as published for Delhi. */
  exShowroomMinInr?: number;
  exShowroomMaxInr?: number;
  onRoadMinInr?: number;
  onRoadMaxInr?: number;

  ratingAvg?: number;
  ratingCount?: number;
}

/** Identity of the catalog model a spec row belongs to. */
export interface BikeSpecIdentity {
  modelId: string;
  brandSlug: string;
  modelSlug: string;
  modelName: string;
  sourceUrl: string;
  source: string;
}

export interface BikeSpecScrapeResult extends BikeSpecIdentity {
  spec: ParsedBikeSpec;
  /** Raw label → value pairs captured from the page, before normalization. */
  rawSpecs: Record<string, string>;
  /** 0-100 share of core fields successfully parsed. */
  completeness: number;
}

/**
 * Fields every two-wheeler should have regardless of drivetrain. These back the
 * Rider Fit engine, so their absence is what should raise the alarm when a
 * model's markup drifts.
 */
const SHARED_CORE_FIELDS: (keyof ParsedBikeSpec)[] = [
  "seatHeightMm",
  "kerbWeightKg",
  "groundClearanceMm",
  "wheelbaseMm",
  "frontBrake",
  "rearBrake",
  "bodyTypeRaw",
];

/** Combustion-only core fields. */
export const CORE_SPEC_FIELDS_ICE: (keyof ParsedBikeSpec)[] = [
  ...SHARED_CORE_FIELDS,
  "displacementCc",
  "maxPowerPs",
  "maxTorqueNm",
  "fuelTankL",
  "mileageOverallKmpl",
];

/**
 * Electric core fields. Scored separately because an EV legitimately has no
 * displacement, fuel tank or kmpl figure — grading it against the combustion
 * list would flag every electric model as a parse failure.
 */
export const CORE_SPEC_FIELDS_EV: (keyof ParsedBikeSpec)[] = [
  ...SHARED_CORE_FIELDS,
  "motorKw",
  "batteryKwh",
  "claimedRangeKm",
  "chargeTimeHrs",
];

/** Core field list appropriate to the drivetrain. */
export function coreFieldsFor(isElectric: boolean | undefined): (keyof ParsedBikeSpec)[] {
  return isElectric ? CORE_SPEC_FIELDS_EV : CORE_SPEC_FIELDS_ICE;
}

/** Rider Fit — can this person actually ride this bike? */

/** How confidently the rider can get their feet down at a stop. */
export type ReachVerdict =
  | "flat-both-bent" // both feet flat with bend in the knees — maximum confidence
  | "flat-both" // both feet flat
  | "balls-both" // balls of both feet
  | "tiptoe-both" // tiptoe both sides, or flat on one foot
  | "tiptoe-marginal" // barely touching — demands care on camber and gravel
  | "unreachable"; // not safely reachable

/** How hard the bike is to hold up, paddle and U-turn at walking pace. */
export type ManageabilityVerdict =
  | "very-easy"
  | "easy"
  | "moderate"
  | "demanding"
  | "very-demanding";

export type RidingExperience = "beginner" | "returning" | "experienced";

/** What the rider mostly intends to do with the bike. */
export type RidingIntent = "commute" | "touring" | "sport" | "adventure" | "leisure";

export interface RiderProfile {
  /** Rider height in centimetres. */
  heightCm: number;
  /** Rider weight in kilograms. Drives suspension sag and manageability. */
  weightKg?: number;
  /**
   * Measured inner-leg length in centimetres. Preferred when known — estimating
   * it from height is the largest source of error in the whole model.
   */
  inseamCm?: number;
  experience?: RidingExperience;
  intent?: RidingIntent;
}

/** The subset of a bike's specs that Rider Fit needs. */
export interface FitBikeSpec {
  modelId: string;
  modelName: string;
  brandSlug: string;
  seatHeightMm: number;
  kerbWeightKg: number;
  ridingPosture?: string | null;
  bodyType?: string | null;
  groundClearanceMm?: number | null;
  isElectric?: boolean;
  /** Engine size in cc. Null on electrics, where power stands in for it. */
  displacementCc?: number | null;
  maxPowerPs?: number | null;
  /** Owner review count — the best available proxy for how many people buy it. */
  ratingCount?: number | null;
  ratingAvg?: number | null;
  /** Lowest ex-showroom price in rupees, Delhi. */
  exShowroomMinInr?: number | null;
  onRoadMinInr?: number | null;
}

export interface ReachScore {
  verdict: ReachVerdict;
  /** Positive means the seat sits above the rider's usable inseam, in mm. */
  gapMm: number;
  /** Seat height after estimated suspension sag, in mm. */
  effectiveSeatHeightMm: number;
  /** Inseam used, in mm — measured when supplied, otherwise estimated. */
  usableInseamMm: number;
  /** 0-100. */
  score: number;
  reason: string;
}

export interface ManageabilityScore {
  verdict: ManageabilityVerdict;
  /** Bike kerb weight divided by rider weight. */
  ratio: number;
  /** 0-100. */
  score: number;
  reason: string;
}

/** How well the machine suits what the rider says they will do with it. */
export interface IntentScore {
  /** 0-100. */
  score: number;
  posture?: string;
  bodyType?: string;
  /** True when the bike is too small-engined for the stated intent. */
  underpowered: boolean;
  reason: string;
}

/** Coarse fit banding. Results are ordered by band, then by popularity. */
export type FitTier = "excellent" | "good" | "workable" | "poor";

export interface FitResult {
  bike: FitBikeSpec;
  reach: ReachScore;
  manageability: ManageabilityScore;
  intent: IntentScore;
  /** 0-100 overall, weighted toward reach because it governs safety. */
  overall: number;
  tier: FitTier;
  /** Plain-language summary a rider can act on. */
  summary: string;
  /** True when the bike is a poor physical match regardless of other merits. */
  cautioned: boolean;
}

/** Assumptions the estimate rests on, surfaced so the number is never a black box. */
export interface FitAssumptions {
  inseamEstimated: boolean;
  weightAssumed: boolean;
  notes: string[];
}

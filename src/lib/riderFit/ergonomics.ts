/**
 * The Rider Fit model — pure functions, no data access.
 *
 * This answers the question every showroom visit really settles: can I get my
 * feet down, and can I hold this thing up? Published seat height alone cannot
 * answer it, because the figure is measured unladen and says nothing about how
 * far the seat spreads the rider's legs.
 *
 * The model is deliberately transparent and conservative. Every number below is
 * an approximation of a physical effect, and each one is documented so the UI
 * can explain itself rather than presenting a score on faith.
 */
import type {
  FitAssumptions,
  FitBikeSpec,
  FitResult,
  FitTier,
  IntentScore,
  ManageabilityScore,
  ManageabilityVerdict,
  ReachScore,
  ReachVerdict,
  RiderProfile,
  RidingIntent,
} from "./types";

/**
 * Inseam as a fraction of stature. Anthropometric studies put the inner-leg
 * ratio at roughly 0.45-0.47 across adult populations; 0.46 is the midpoint.
 * Only used when the rider has not measured their own inseam.
 */
const INSEAM_RATIO = 0.46;

/**
 * Straddling a seat splays the legs outward, so a rider cannot use their full
 * standing inseam to reach the ground. Seat width would model this directly but
 * no source publishes it, so riding posture stands in as a proxy.
 *
 * This matters a great deal: a step-through scooter lets the legs hang almost
 * straight down, while a wide-tanked adventure bike pushes the thighs well
 * apart. Applying one flat penalty to both would wrongly rule scooters out for
 * exactly the shorter riders who most depend on them.
 *
 * Values are deliberately conservative — for a safety feature it is better to
 * warn a rider who turns out to be fine than to reassure one who drops the bike.
 */
const STRADDLE_FACTOR_BY_POSTURE: Record<string, number> = {
  "step-through": 0.99,
  cruiser: 0.96,
  upright: 0.95,
  sport: 0.95,
  adventure: 0.93,
};

const STRADDLE_FACTOR_DEFAULT = 0.95;

function straddleFactor(bike: FitBikeSpec): number {
  const posture = bike.ridingPosture ?? "";
  return STRADDLE_FACTOR_BY_POSTURE[posture] ?? STRADDLE_FACTOR_DEFAULT;
}

/** Assumed rider weight when not supplied, near the Indian adult male median. */
const DEFAULT_RIDER_WEIGHT_KG = 70;

const MIN_SAG_MM = 15;
const MAX_SAG_MM = 45;

/**
 * Weighting of the three sub-scores. Reach leads because it governs safety, but
 * intent carries real weight: for a tall rider almost everything clears the
 * reach and manageability bars, so those two stop discriminating and whatever
 * is left decides the ranking.
 */
const WEIGHT_REACH = 0.5;
const WEIGHT_MANAGEABILITY = 0.25;
const WEIGHT_INTENT = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation from one range onto another, clamped to the output. */
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return clamp(outMin + t * (outMax - outMin), Math.min(outMin, outMax), Math.max(outMin, outMax));
}

/** Estimated inner-leg length in mm from stature in cm. */
export function estimateInseamMm(heightCm: number): number {
  return Math.round(heightCm * 10 * INSEAM_RATIO);
}

/**
 * Suspension compression under the rider, in mm.
 *
 * A heavy rider on a light bike compresses the springs more, which lowers the
 * seat and genuinely improves reach — an effect published seat height ignores.
 */
export function estimateSagMm(riderWeightKg: number, kerbWeightKg: number): number {
  if (kerbWeightKg <= 0) return MIN_SAG_MM;
  const raw = (riderWeightKg / kerbWeightKg) * 60;
  return Math.round(clamp(raw, MIN_SAG_MM, MAX_SAG_MM));
}

const REACH_REASONS: Record<ReachVerdict, string> = {
  "flat-both-bent": "Both feet flat with your knees still bent — maximum confidence at a stop.",
  "flat-both": "Both feet flat on the ground.",
  "balls-both": "Balls of both feet down. Stable once you are used to it.",
  "tiptoe-both": "Tiptoe on both sides, or one foot flat if you lean the bike over.",
  "tiptoe-marginal": "Barely tiptoeing. Uneven ground, camber and gravel will feel unnerving.",
  unreachable: "You will not get a foot down safely at a stop.",
};

/**
 * Classify the gap between the seat and the rider's usable inseam.
 *
 * Thresholds are in millimetres of shortfall: negative means the inseam exceeds
 * the seat height, so the knee still has bend when the foot is flat.
 */
function classifyReach(gapMm: number): ReachVerdict {
  if (gapMm <= -30) return "flat-both-bent";
  if (gapMm <= 0) return "flat-both";
  if (gapMm <= 25) return "balls-both";
  if (gapMm <= 55) return "tiptoe-both";
  if (gapMm <= 90) return "tiptoe-marginal";
  return "unreachable";
}

export function scoreReach(profile: RiderProfile, bike: FitBikeSpec): ReachScore {
  const inseamMm = profile.inseamCm
    ? Math.round(profile.inseamCm * 10)
    : estimateInseamMm(profile.heightCm);

  const usableInseamMm = Math.round(inseamMm * straddleFactor(bike));
  const riderWeight = profile.weightKg ?? DEFAULT_RIDER_WEIGHT_KG;
  const sagMm = estimateSagMm(riderWeight, bike.kerbWeightKg);
  const effectiveSeatHeightMm = bike.seatHeightMm - sagMm;

  const gapMm = Math.round(effectiveSeatHeightMm - usableInseamMm);
  const verdict = classifyReach(gapMm);

  // Full marks once both feet are flat; falls away as the shortfall grows.
  const score = Math.round(gapMm <= 0 ? 100 : mapRange(gapMm, 0, 110, 100, 0));

  return {
    verdict,
    gapMm,
    effectiveSeatHeightMm,
    usableInseamMm,
    score,
    reason: REACH_REASONS[verdict],
  };
}

/**
 * Ratio of bike kerb weight to rider weight, banded.
 *
 * Ratio matters more than absolute mass for holding a bike up and paddling it
 * around a parking space, but very heavy bikes are demanding for everyone, so
 * an absolute penalty is applied on top.
 */
function classifyManageability(ratio: number): ManageabilityVerdict {
  if (ratio < 1.5) return "very-easy";
  if (ratio < 2.2) return "easy";
  if (ratio < 3.0) return "moderate";
  if (ratio < 3.8) return "demanding";
  return "very-demanding";
}

export function scoreManageability(profile: RiderProfile, bike: FitBikeSpec): ManageabilityScore {
  const riderWeight = profile.weightKg ?? DEFAULT_RIDER_WEIGHT_KG;
  const ratio = Math.round((bike.kerbWeightKg / riderWeight) * 100) / 100;
  const verdict = classifyManageability(ratio);

  let score = Math.round(mapRange(ratio, 1.2, 4.2, 100, 20));

  // Absolute mass penalty: past ~200 kg the bike is a handful regardless of who
  // is sitting on it, and a beginner has no technique to fall back on.
  if (bike.kerbWeightKg > 200) score -= Math.min(25, (bike.kerbWeightKg - 200) / 4);
  if (profile.experience === "beginner" && bike.kerbWeightKg > 180) score -= 10;
  if (profile.experience === "experienced") score += 8;

  score = Math.round(clamp(score, 0, 100));

  const reason =
    verdict === "very-easy" || verdict === "easy"
      ? `At ${bike.kerbWeightKg} kg it is light for your build — easy to paddle and hold up.`
      : verdict === "moderate"
        ? `At ${bike.kerbWeightKg} kg it is manageable, though you will notice it in car parks.`
        : `At ${bike.kerbWeightKg} kg it is heavy for your build — low-speed manoeuvres take real technique.`;

  return { verdict, ratio, score, reason };
}

/**
 * How well each body type serves each intent, 0-1.
 *
 * Body type is used in preference to riding posture because posture is far too
 * coarse to carry this: two thirds of the catalog is nominally "upright", which
 * lumps a 97cc Splendor in with a 650cc tourer. Scoring on posture alone handed
 * commuter bikes a perfect match for touring.
 */
const INTENT_BODY_SUITABILITY: Record<RidingIntent, Record<string, number>> = {
  commute: {
    commuter: 1,
    scooter: 1,
    moped: 0.85,
    roadster: 0.7,
    "cafe-racer": 0.45,
    sports: 0.5,
    cruiser: 0.5,
    adventure: 0.5,
    touring: 0.4,
    "off-road": 0.2,
  },
  touring: {
    touring: 1,
    adventure: 0.9,
    cruiser: 0.85,
    roadster: 0.55,
    sports: 0.5,
    "cafe-racer": 0.4,
    "off-road": 0.3,
    commuter: 0.25,
    scooter: 0.2,
    moped: 0.05,
  },
  sport: {
    sports: 1,
    "cafe-racer": 0.8,
    roadster: 0.8,
    adventure: 0.5,
    "off-road": 0.4,
    touring: 0.4,
    cruiser: 0.3,
    commuter: 0.2,
    scooter: 0.15,
    moped: 0.05,
  },
  adventure: {
    adventure: 1,
    "off-road": 0.9,
    touring: 0.6,
    roadster: 0.4,
    cruiser: 0.3,
    sports: 0.3,
    "cafe-racer": 0.25,
    commuter: 0.2,
    scooter: 0.15,
    moped: 0.05,
  },
  leisure: {
    cruiser: 1,
    roadster: 0.8,
    "cafe-racer": 0.8,
    touring: 0.75,
    adventure: 0.7,
    sports: 0.6,
    scooter: 0.5,
    commuter: 0.45,
    "off-road": 0.4,
    moped: 0.2,
  },
};

/** Fallback when body type is unpublished, keyed on the coarser posture field. */
const INTENT_POSTURE_SUITABILITY: Record<RidingIntent, Record<string, number>> = {
  commute: { "step-through": 1, upright: 0.9, sport: 0.5, cruiser: 0.5, adventure: 0.5 },
  touring: { cruiser: 0.85, adventure: 0.85, upright: 0.5, sport: 0.5, "step-through": 0.2 },
  sport: { sport: 1, upright: 0.5, adventure: 0.45, cruiser: 0.3, "step-through": 0.15 },
  adventure: { adventure: 1, upright: 0.4, sport: 0.35, cruiser: 0.3, "step-through": 0.15 },
  leisure: { cruiser: 1, upright: 0.65, adventure: 0.7, sport: 0.6, "step-through": 0.5 },
};

/**
 * Engine size, in cc, at which a bike becomes credible for an intent and at
 * which it is fully capable. Below the first figure the machine is out of its
 * depth however well its ergonomics suit the rider — you cannot tour on a 97cc
 * commuter, and no amount of upright seating changes that.
 */
const INTENT_CC_RAMP: Record<RidingIntent, { floor: number; full: number } | null> = {
  commute: null,
  touring: { floor: 150, full: 250 },
  sport: { floor: 125, full: 200 },
  adventure: { floor: 150, full: 250 },
  leisure: { floor: 100, full: 160 },
};

/** Rough cc-equivalent of an electric motor, for intent capability only. */
const PS_TO_CC_EQUIVALENT = 12;

/**
 * Capability multiplier, 0.35-1, from engine size against the intent's ramp.
 *
 * Electrics have no displacement, so peak power stands in via a rough
 * equivalence. When neither figure is published the bike is left unpenalised —
 * missing data should not read as a verdict.
 */
function capabilityFactor(bike: FitBikeSpec, intent: RidingIntent): number {
  const ramp = INTENT_CC_RAMP[intent];
  if (!ramp) return 1;

  const cc =
    bike.displacementCc ??
    (bike.maxPowerPs ? Math.round(bike.maxPowerPs * PS_TO_CC_EQUIVALENT) : null);
  if (!cc) return 1;

  return mapRange(cc, ramp.floor, ramp.full, 0.35, 1);
}

export function scoreIntentMatch(profile: RiderProfile, bike: FitBikeSpec): IntentScore {
  const posture = bike.ridingPosture ?? undefined;
  const bodyType = bike.bodyType ?? undefined;

  if (!profile.intent) {
    return {
      score: 75,
      posture,
      bodyType,
      underpowered: false,
      reason: bodyType ? `${titleCase(bodyType)} bike.` : "Riding position not published.",
    };
  }

  const intent = profile.intent;
  const suitability =
    (bodyType ? INTENT_BODY_SUITABILITY[intent][bodyType] : undefined) ??
    (posture ? INTENT_POSTURE_SUITABILITY[intent][posture] : undefined);

  if (suitability === undefined) {
    return {
      score: 60,
      posture,
      bodyType,
      underpowered: false,
      reason: "Not enough published detail to judge how well it suits your riding.",
    };
  }

  const capability = capabilityFactor(bike, intent);
  const score = Math.round(clamp(suitability * capability * 100, 0, 100));
  const underpowered = capability < 0.7;

  return { score, posture, bodyType, underpowered, reason: intentReason(bike, intent, suitability, underpowered) };
}

function intentReason(
  bike: FitBikeSpec,
  intent: RidingIntent,
  suitability: number,
  underpowered: boolean
): string {
  const label = bike.bodyType ? titleCase(bike.bodyType) : "This bike";
  const activity = INTENT_LABEL[intent];

  if (underpowered && bike.displacementCc) {
    return `${bike.displacementCc}cc is small for ${activity} — fine around town, strained on the open road.`;
  }
  if (suitability >= 0.85) return `${label} — squarely built for ${activity}.`;
  if (suitability >= 0.6) return `${label} — workable for ${activity} without being built for it.`;
  return `${label} — not the natural choice for ${activity}.`;
}

const INTENT_LABEL: Record<RidingIntent, string> = {
  commute: "daily commuting",
  touring: "long-distance touring",
  sport: "spirited riding",
  adventure: "rough roads",
  leisure: "weekend cruising",
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

/** Assumptions behind a result, so the UI can show its working. */
export function describeAssumptions(profile: RiderProfile): FitAssumptions {
  const notes: string[] = [];
  const inseamEstimated = !profile.inseamCm;
  const weightAssumed = profile.weightKg === undefined;

  if (inseamEstimated) {
    notes.push(
      `Inseam estimated at ${Math.round(estimateInseamMm(profile.heightCm) / 10)} cm from your height. Measuring it gives a far more accurate result.`
    );
  }
  if (weightAssumed) {
    notes.push(`Rider weight assumed to be ${DEFAULT_RIDER_WEIGHT_KG} kg.`);
  }
  notes.push("Allows for suspension sag and for the seat spreading your legs.");

  return { inseamEstimated, weightAssumed, notes };
}

/** Score one bike against one rider. */
export function scoreFit(profile: RiderProfile, bike: FitBikeSpec): FitResult {
  const reach = scoreReach(profile, bike);
  const manageability = scoreManageability(profile, bike);
  const intent = scoreIntentMatch(profile, bike);

  let overall = Math.round(
    reach.score * WEIGHT_REACH +
      manageability.score * WEIGHT_MANAGEABILITY +
      intent.score * WEIGHT_INTENT
  );

  // A bike built for a different job should never be labelled an excellent
  // match, however comfortably the rider sits on it.
  if (intent.score < 35) overall = Math.min(overall, 58);
  else if (intent.score < 55) overall = Math.min(overall, 72);

  // A bike the rider cannot put a foot down on is not a good match no matter how
  // well it scores elsewhere, so the headline number is capped rather than averaged.
  const cautioned =
    reach.verdict === "unreachable" ||
    reach.verdict === "tiptoe-marginal" ||
    manageability.verdict === "very-demanding";

  if (reach.verdict === "unreachable") overall = Math.min(overall, 25);
  else if (reach.verdict === "tiptoe-marginal") overall = Math.min(overall, 50);

  if (profile.experience === "beginner" && cautioned) overall = Math.min(overall, 45);

  const finalScore = clamp(overall, 0, 100);

  return {
    bike,
    reach,
    manageability,
    intent,
    overall: finalScore,
    tier: toTier(finalScore),
    summary: buildSummary(reach, manageability, profile),
    cautioned,
  };
}

/**
 * Band a fit score.
 *
 * Ranking by raw score alone surfaces absurdities — a 22 kg machine with a
 * 454 mm seat "fits" everyone perfectly. Fit is a qualifier, not a preference
 * ordering, so results are banded and then ordered by real-world popularity.
 */
export function toTier(overall: number): FitTier {
  if (overall >= 80) return "excellent";
  if (overall >= 65) return "good";
  if (overall >= 50) return "workable";
  return "poor";
}

function buildSummary(
  reach: ReachScore,
  manageability: ManageabilityScore,
  profile: RiderProfile
): string {
  const parts = [reach.reason, manageability.reason];

  if (profile.experience === "beginner" && reach.verdict === "tiptoe-marginal") {
    parts.push("For a first bike, look for something you can flat-foot.");
  }
  return parts.join(" ");
}

export const RIDER_FIT_CONSTANTS = {
  INSEAM_RATIO,
  STRADDLE_FACTOR_BY_POSTURE,
  STRADDLE_FACTOR_DEFAULT,
  DEFAULT_RIDER_WEIGHT_KG,
  WEIGHT_REACH,
  WEIGHT_MANAGEABILITY,
  WEIGHT_INTENT,
};

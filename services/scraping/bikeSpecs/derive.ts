/**
 * Fields we compute rather than scrape.
 *
 * Body type and riding posture are published inconsistently across model pages
 * (and not at all on the catalog index, where `bodyType` is null for all 1,251
 * models), so deriving them from geometry is more reliable than trusting a
 * field that is frequently absent.
 */
import type { BikeBodyType, ParsedBikeSpec, RidingPosture } from "./types";

/** Source label fragment → canonical body type, checked in order. */
const BODY_TYPE_PATTERNS: [RegExp, BikeBodyType][] = [
  [/moped/i, "moped"],
  [/scooter|scootie/i, "scooter"],
  [/cafe\s*racer/i, "cafe-racer"],
  [/adventure|adv\b|dual\s*sport/i, "adventure"],
  [/tour(er|ing)/i, "touring"],
  [/cruiser|bobber/i, "cruiser"],
  [/off\s*road|motocross|dirt|enduro|trail/i, "off-road"],
  [/super\s*bike|sports?\b|supersport/i, "sports"],
  [/naked|street\s*fighter/i, "naked"],
  [/roadster/i, "roadster"],
  [/commuter|mileage|economy/i, "commuter"],
];

export function normalizeBodyType(raw: string | undefined): BikeBodyType | undefined {
  if (!raw) return undefined;
  for (const [pattern, value] of BODY_TYPE_PATTERNS) {
    if (pattern.test(raw)) return value;
  }
  return undefined;
}

const KW_TO_PS = 1.35962;

/**
 * Body type when the source omits it — as it does for the Honda Activa, India's
 * best-selling two-wheeler.
 *
 * A small-displacement machine with an automatic transmission and no gearbox is
 * a scooter; that combination does not occur on a geared motorcycle.
 */
export function deriveBodyTypeFallback(spec: ParsedBikeSpec): BikeBodyType | undefined {
  const automatic = /automatic|cvt|twist|variomatic/i.test(spec.transmissionType ?? "");
  const smallEngine = spec.displacementCc === undefined || spec.displacementCc <= 250;

  if (automatic && !spec.gears && smallEngine) return "scooter";
  return undefined;
}

/**
 * Riding posture drives the Rider Fit engine's ergonomics score and the
 * "handlebar type" comparison.
 *
 * Body type is used when it is decisive; otherwise posture is inferred from
 * geometry, where a tall seat with high ground clearance reads as adventure and
 * a low seat on a long wheelbase reads as cruiser.
 */
export function deriveRidingPosture(spec: ParsedBikeSpec): RidingPosture | undefined {
  const body = spec.bodyType;

  if (body === "scooter" || body === "moped") return "step-through";
  if (body === "cruiser") return "cruiser";
  if (body === "adventure" || body === "off-road") return "adventure";
  if (body === "sports" || body === "cafe-racer") return "sport";
  if (body === "naked" || body === "roadster" || body === "commuter") return "upright";

  const { seatHeightMm: seat, groundClearanceMm: clearance, wheelbaseMm: wheelbase } = spec;

  if (seat && clearance && seat >= 820 && clearance >= 180) return "adventure";
  if (seat && wheelbase && seat <= 730 && wheelbase >= 1450) return "cruiser";
  if (seat && seat >= 800) return "sport";
  if (seat) return "upright";

  return undefined;
}

/**
 * Metric horsepower per tonne of kerb weight — the figure that actually
 * predicts how a bike accelerates, and one no Indian site currently publishes.
 */
export function derivePowerToWeight(spec: ParsedBikeSpec): number | undefined {
  const { maxPowerPs: ps, kerbWeightKg: kg } = spec;
  if (!ps || !kg || kg <= 0) return undefined;
  const value = (ps / kg) * 1000;
  if (!Number.isFinite(value) || value <= 0 || value >= 9999) return undefined;
  return Math.round(value * 1000) / 1000;
}

/** A traction battery, or "electric" appearing in the fuel or body type, marks an EV. */
export function deriveIsElectric(spec: ParsedBikeSpec, hints: DeriveHints = {}): boolean {
  if (spec.batteryKwh !== undefined || spec.motorKw !== undefined) return true;
  if (spec.claimedRangeKm !== undefined && spec.displacementCc === undefined) return true;

  const text = [hints.fuelTypeRaw, spec.bodyTypeRaw].filter(Boolean).join(" ");
  return /electric|\bev\b/i.test(text);
}

/** Signals from outside the spec table that inform derived fields. */
export interface DeriveHints {
  fuelTypeRaw?: string;
}

/** Apply every derived field in dependency order. */
export function applyDerivedFields(spec: ParsedBikeSpec, hints: DeriveHints = {}): ParsedBikeSpec {
  const bodyType =
    spec.bodyType ?? normalizeBodyType(spec.bodyTypeRaw) ?? deriveBodyTypeFallback(spec);

  const withBody: ParsedBikeSpec = { ...spec, bodyType };

  // Electric models publish output in kW under a motor label rather than a
  // "Max Power" figure. Converting gives EVs a comparable power number so they
  // can appear in power-to-weight rankings alongside combustion bikes.
  const maxPowerPs =
    withBody.maxPowerPs ??
    (withBody.motorKw ? Math.round(withBody.motorKw * KW_TO_PS * 100) / 100 : undefined);

  const withPower: ParsedBikeSpec = { ...withBody, maxPowerPs };

  return {
    ...withPower,
    ridingPosture: deriveRidingPosture(withPower),
    powerToWeight: derivePowerToWeight(withPower),
    isElectric: deriveIsElectric(withPower, hints),
  };
}

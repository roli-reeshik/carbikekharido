/**
 * Parse a BikeDekho model page into a structured spec row.
 *
 * Specs live in `window.__INITIAL_STATE__` as nested `{ text, value }` pairs,
 * spread across `specsTechnicalJson.specification` (the detailed, authoritative
 * block) and several summary widgets. Rather than depending on exact paths —
 * which drift whenever the source redesigns — we walk the tree collecting every
 * label/value pair, then read known labels out of that flat map.
 */
import {
  parseBatteryKwh,
  parseEmissionNorm,
  parseFrontRear,
  parseGears,
  parseHours,
  parseInteger,
  parseNumber,
  parsePower,
  parseRangeMidpoint,
  parseServiceKm,
  parseText,
  parseTorque,
  parseWarranty,
  normalizeLabel,
} from "./normalize";
import { applyDerivedFields } from "./derive";
import { coreFieldsFor, ParsedBikeSpec } from "./types";

/**
 * Pull the `window.__INITIAL_STATE__` object out of a page by brace-matching
 * (the value is JS, not a script tag we can JSON.parse wholesale).
 */
export function extractInitialState(html: string): Record<string, unknown> | null {
  const marker = "window.__INITIAL_STATE__ = ";
  const start = html.indexOf(marker);
  if (start < 0) return null;

  const jsonStart = start + marker.length;
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = jsonStart; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const MAX_WALK_DEPTH = 14;

/** Collect `{ text, value }` pairs into a normalized-label map, keeping first-seen. */
function collectInto(node: unknown, out: Map<string, string>, depth = 0): void {
  if (depth > MAX_WALK_DEPTH || !node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) collectInto(item, out, depth + 1);
    return;
  }

  const obj = node as Record<string, unknown>;
  const text = obj.text ?? obj.displayText ?? obj.key;
  const value = obj.value;
  if (typeof text === "string" && typeof value === "string" && text.trim() && value.trim()) {
    const label = normalizeLabel(text);
    if (label && !out.has(label)) out.set(label, value.trim());
  }

  for (const v of Object.values(obj)) collectInto(v, out, depth + 1);
}

/**
 * Flatten the page state into `normalized label → value`.
 *
 * The detailed `specification` block is walked first so that when a label
 * appears in both a summary widget and the full table (e.g. "Fuel Gauge" is
 * "No" in the summary but "Digital" in the detail), the detailed value wins.
 */
export function collectSpecPairs(state: Record<string, unknown>): Record<string, string> {
  const out = new Map<string, string>();
  const technical = state.specsTechnicalJson as Record<string, unknown> | undefined;

  if (technical?.specification) collectInto(technical.specification, out);
  if (technical?.keySpecs) collectInto(technical.keySpecs, out);
  collectInto(state, out);

  return Object.fromEntries(out);
}

/** Read the first label present, so we can express source preference order. */
function pick(pairs: Record<string, string>, ...labels: string[]): string | undefined {
  for (const label of labels) {
    const v = pairs[label];
    if (v) return v;
  }
  return undefined;
}

/**
 * Exact match first, then prefix match.
 *
 * Some labels carry a qualifier the exact map cannot anticipate, such as
 * "Charging Time(0-80%)" normalizing to "charging time 0 80%".
 */
function pickLike(pairs: Record<string, string>, ...labels: string[]): string | undefined {
  const exact = pick(pairs, ...labels);
  if (exact) return exact;

  const keys = Object.keys(pairs);
  for (const label of labels) {
    const hit = keys.find((k) => k.startsWith(label));
    if (hit && pairs[hit]) return pairs[hit];
  }
  return undefined;
}

/** Map a flattened label/value map onto structured fields. */
export function mapSpecPairs(pairs: Record<string, string>): ParsedBikeSpec {
  const spec: ParsedBikeSpec = {};

  // --- Engine and transmission ---------------------------------------------
  spec.displacementCc = parseInteger(pick(pairs, "displacement", "engine displacement"), {
    min: 20,
    max: 2500,
  });
  spec.engineType = parseText(pick(pairs, "engine type"));
  spec.cylinders = parseInteger(pick(pairs, "number of cylinders", "no of cylinders"), {
    min: 1,
    max: 8,
  });

  const power = parsePower(pick(pairs, "max power", "maximum power", "power"));
  spec.maxPowerPs = power.ps;
  spec.maxPowerRpm = power.rpm;

  const torque = parseTorque(pick(pairs, "max torque", "maximum torque", "torque"));
  spec.maxTorqueNm = torque.nm;
  spec.maxTorqueRpm = torque.rpm;

  spec.topSpeedKmph = parseInteger(pick(pairs, "claimed top speed", "top speed"), {
    min: 20,
    max: 400,
  });
  spec.coolingSystem = parseText(pick(pairs, "cooling system"), 80);
  spec.startingSystem = parseText(pick(pairs, "starting system", "starting type"), 80);
  spec.transmissionType = parseText(pick(pairs, "transmission type", "transmission"), 60);
  spec.gears = parseGears(pick(pairs, "gearbox", "no of gears", "gears"));
  spec.driveType = parseText(pick(pairs, "drive type", "final drive"), 60);
  spec.emissionNorm = parseEmissionNorm(
    pick(pairs, "emission norm compliance", "emission type", "emission standard")
  );

  // --- Mileage --------------------------------------------------------------
  spec.mileageCityKmpl = parseRangeMidpoint(
    pick(pairs, "city mileage tested", "mileage city", "city mileage"),
    { min: 5, max: 200 }
  );
  spec.mileageHighwayKmpl = parseRangeMidpoint(
    pick(pairs, "highway mileage tested", "mileage highway", "highway mileage"),
    { min: 5, max: 200 }
  );
  spec.mileageOverallKmpl = parseRangeMidpoint(
    pick(pairs, "overall mileage", "mileage arai", "arai mileage", "estimated mileage", "mileage"),
    { min: 5, max: 200 }
  );

  // --- Dimensions -----------------------------------------------------------
  spec.seatHeightMm = parseInteger(pick(pairs, "seat height"), { min: 400, max: 1200 });
  spec.kerbWeightKg = parseNumber(pick(pairs, "kerb weight", "curb weight"), {
    min: 20,
    max: 600,
  });
  spec.groundClearanceMm = parseInteger(pick(pairs, "ground clearance"), { min: 50, max: 400 });
  spec.wheelbaseMm = parseInteger(pick(pairs, "wheelbase"), { min: 800, max: 2000 });
  spec.lengthMm = parseInteger(pick(pairs, "length"), { min: 1000, max: 3500 });
  spec.widthMm = parseInteger(pick(pairs, "width"), { min: 400, max: 1500 });
  spec.heightMm = parseInteger(pick(pairs, "height"), { min: 500, max: 2000 });
  spec.fuelTankL = parseNumber(pick(pairs, "fuel tank capacity", "fuel capacity"), {
    min: 0.5,
    max: 60,
  });
  spec.fuelReserveL = parseNumber(pick(pairs, "fuel tank reserve capacity", "reserve capacity"), {
    min: 0.1,
    max: 20,
  });

  // --- Brakes, tyres, suspension --------------------------------------------
  spec.frontBrake = parseText(pick(pairs, "front brake", "front brake type"), 60);
  spec.rearBrake = parseText(pick(pairs, "rear brake", "rear brake type"), 60);
  spec.absType = parseText(pick(pairs, "abs type", "abs", "braking tech", "braking system"), 60);
  spec.wheelType = parseText(pick(pairs, "wheel type", "wheels type"), 60);

  const tyreSize = parseFrontRear(pick(pairs, "tyre size", "tyre size front rear"));
  spec.tyreFront = parseText(tyreSize.front ?? pick(pairs, "tyre size front"), 80);
  spec.tyreRear = parseText(tyreSize.rear ?? pick(pairs, "tyre size rear"), 80);

  spec.frontSuspension = parseText(pick(pairs, "front suspension"), 300);
  spec.rearSuspension = parseText(pick(pairs, "rear suspension"), 300);

  // --- Ownership -------------------------------------------------------------
  const warranty = parseWarranty(pick(pairs, "vehicle warranty", "warranty", "standard warranty"));
  spec.warrantyYears = warranty.years;
  spec.warrantyKm = warranty.km;
  spec.firstServiceKm = parseServiceKm(pick(pairs, "1st service", "first service"));

  // The gap between the 2nd and 3rd service is the steady-state interval; the
  // 1st service is an early running-in check and would understate ownership cost.
  const second = parseServiceKm(pick(pairs, "2nd service", "second service"));
  const third = parseServiceKm(pick(pairs, "3rd service", "third service"));
  if (second && third && third > second) spec.serviceIntervalKm = third - second;
  else if (second) spec.serviceIntervalKm = second;

  // --- Electric ---------------------------------------------------------------
  spec.batteryKwh = parseBatteryKwh(
    pickLike(pairs, "battery capacity", "battery", "battery capacity kwh")
  );
  spec.claimedRangeKm = parseRangeMidpoint(
    pickLike(pairs, "claimed range", "riding range", "range per charge", "range"),
    { min: 10, max: 1000 }
  );
  spec.chargeTimeHrs = parseHours(
    pickLike(pairs, "charging time", "charge time", "full charge time")
  );

  // The source publishes peak and continuous output under labels it sometimes
  // transposes (the Ola S1 Pro lists "Motor Power" 5.5 kW and "Continuous
  // Power" 11 kW, which is the wrong way round). Taking the larger of the two
  // reliably yields peak output without trusting either label.
  const motorCandidates = ["motor power", "peak power", "max power", "continuous power"]
    .map((label) => pickLike(pairs, label))
    .filter((v): v is string => Boolean(v) && /kw/i.test(v as string))
    .map((v) => parseNumber(v, { min: 0.1, max: 100 }))
    .filter((n): n is number => n !== undefined);

  if (motorCandidates.length) spec.motorKw = Math.max(...motorCandidates);

  // --- Classification ----------------------------------------------------------
  spec.bodyTypeRaw = parseText(pick(pairs, "body type", "bike type"), 80);

  return spec;
}

/** Share of the drivetrain-appropriate core fields that parsed, as 0-100. */
export function scoreCompleteness(spec: ParsedBikeSpec): number {
  const fields = coreFieldsFor(spec.isElectric);
  const filled = fields.filter((f) => {
    const v = spec[f];
    return v !== undefined && v !== null && v !== "";
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export interface ParsedPage {
  spec: ParsedBikeSpec;
  rawSpecs: Record<string, string>;
  completeness: number;
}

interface DataLayerFacts {
  isUpcoming?: boolean;
  bodyTypeRaw?: string;
}

interface RatingFacts {
  ratingAvg?: number;
  ratingCount?: number;
}

interface PriceFacts {
  exShowroomMinInr?: number;
  exShowroomMaxInr?: number;
  onRoadMinInr?: number;
  onRoadMaxInr?: number;
}

/** Reject placeholder and obviously wrong figures. */
function priceOrUndefined(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 5000 || n > 10_000_000) return undefined;
  return Math.round(n);
}

/**
 * Ex-showroom and on-road prices from the `overView` block, in rupees for Delhi.
 *
 * Worth capturing carefully: the catalog index has no price for any two-wheeler,
 * so without this a buyer cannot filter bikes by budget anywhere on the site.
 */
function readPrices(state: Record<string, unknown>): PriceFacts {
  const ov = state.overView as Record<string, unknown> | undefined;
  if (!ov || ov.priceNotAvailable === true) return {};

  return {
    exShowroomMinInr: priceOrUndefined(ov.exShowroomPrice_min ?? ov.exShowRoomPrice),
    exShowroomMaxInr: priceOrUndefined(ov.exShowroomPrice_max ?? ov.maxExshowroomPrice),
    onRoadMinInr: priceOrUndefined(ov.minOnRoadPrice),
    onRoadMaxInr: priceOrUndefined(ov.maxOnRoadPrice),
  };
}

/**
 * Owner rating and review count.
 *
 * The two page layouts expose this differently: `/specifications` carries a
 * ready-made `overviewData.starRating`, while the overview page has only a
 * `userReviews` block with a star histogram. Both are read, because review
 * count is the best available proxy for how many people actually buy a model —
 * which is what separates a Splendor from a nameless e-scooter.
 */
function readRating(state: Record<string, unknown>): RatingFacts {
  const overview = state.overviewData as Record<string, unknown> | undefined;
  const star = overview?.starRating as Record<string, unknown> | undefined;

  if (star) {
    return {
      ratingAvg: parseNumber(String(star.rating ?? ""), { min: 0, max: 5 }),
      ratingCount: parseInteger(String(star.reviewCount ?? ""), { min: 0 }),
    };
  }

  const reviews = state.userReviews as Record<string, unknown> | undefined;
  if (!reviews) return {};

  const count = parseInteger(String(reviews.reviewCount ?? ""), { min: 0 });

  // Derive the mean from the star histogram, where `index` is the star value
  // and `value` the number of reviews awarding it.
  let avg: number | undefined;
  const histogram = reviews.ratingStarList;
  if (Array.isArray(histogram)) {
    let weighted = 0;
    let votes = 0;
    for (const entry of histogram) {
      const row = entry as Record<string, unknown>;
      const stars = Number(row.index);
      const n = Number(row.value);
      if (Number.isFinite(stars) && Number.isFinite(n) && n > 0) {
        weighted += stars * n;
        votes += n;
      }
    }
    if (votes > 0) avg = Math.round((weighted / votes) * 100) / 100;
  }

  return { ratingAvg: avg, ratingCount: count };
}

/**
 * The page's analytics payload carries two facts the spec tables do not:
 * whether the model is on sale (`model_type_new` is "current" or "upcoming")
 * and a normalized body type that is present even when the spec table omits it.
 */
function readDataLayer(state: Record<string, unknown>): DataLayerFacts {
  const layer = state.dataLayer;
  const first = Array.isArray(layer) ? layer[0] : layer;
  if (!first || typeof first !== "object") return {};

  const row = first as Record<string, unknown>;
  const modelType = typeof row.model_type_new === "string" ? row.model_type_new : undefined;
  const bodyType = typeof row.body_type_new === "string" ? row.body_type_new : undefined;

  return {
    isUpcoming: modelType ? /upcoming/i.test(modelType) : undefined,
    bodyTypeRaw: parseText(bodyType, 80),
  };
}

/** Full page → structured spec, derived fields applied. */
export function parseBikeSpecPage(html: string): ParsedPage | null {
  const state = extractInitialState(html);
  if (!state) return null;

  const rawSpecs = collectSpecPairs(state);
  if (!Object.keys(rawSpecs).length) return null;

  const facts = readDataLayer(state);
  const mapped = mapSpecPairs(rawSpecs);
  mapped.bodyTypeRaw = mapped.bodyTypeRaw ?? facts.bodyTypeRaw;

  const spec = applyDerivedFields(mapped, { fuelTypeRaw: rawSpecs["fuel type"] });
  spec.isUpcoming = facts.isUpcoming ?? false;

  const rating = readRating(state);
  if (rating.ratingAvg !== undefined) spec.ratingAvg = rating.ratingAvg;
  if (rating.ratingCount !== undefined) spec.ratingCount = rating.ratingCount;

  Object.assign(spec, readPrices(state));

  return { spec, rawSpecs, completeness: scoreCompleteness(spec) };
}

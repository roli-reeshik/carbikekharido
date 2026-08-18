/**
 * Value parsers for two-wheeler spec strings.
 *
 * Source values are free text with inconsistent units, e.g.
 *   "349 cc" · "20.21 PS @ 6100 rpm" · "9.8 bhp @ 7500 rpm" · "27 Nm @ 4000 rpm"
 *   "3 Years or 30,000 Km" · "Front :-100/90-19,  Rear :-120/80-18"
 * Every parser returns undefined rather than throwing so one odd model cannot
 * fail a whole batch.
 */

const PS_PER_BHP = 1.01387;
const NM_PER_KGM = 9.80665;

/** Lowercase, collapse whitespace and strip punctuation so labels match reliably. */
export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[().,:/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNumber(raw: string): number | undefined {
  const m = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

/** Plain numeric value, optionally bounded to reject nonsense. */
export function parseNumber(
  raw: string | undefined,
  opts: { min?: number; max?: number } = {}
): number | undefined {
  if (!raw) return undefined;
  const n = firstNumber(raw);
  if (n === undefined) return undefined;
  if (opts.min !== undefined && n < opts.min) return undefined;
  if (opts.max !== undefined && n > opts.max) return undefined;
  return n;
}

export function parseInteger(
  raw: string | undefined,
  opts: { min?: number; max?: number } = {}
): number | undefined {
  const n = parseNumber(raw, opts);
  return n === undefined ? undefined : Math.round(n);
}

/**
 * A value that may be expressed as a range ("35-40 kmpl"). Returns the midpoint,
 * which is the honest reading of a manufacturer estimate.
 */
export function parseRangeMidpoint(
  raw: string | undefined,
  opts: { min?: number; max?: number } = {}
): number | undefined {
  if (!raw) return undefined;
  const m = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const mid = (Number(m[1]) + Number(m[2])) / 2;
    if (opts.min !== undefined && mid < opts.min) return undefined;
    if (opts.max !== undefined && mid > opts.max) return undefined;
    return Math.round(mid * 100) / 100;
  }
  return parseNumber(raw, opts);
}

export interface PowerReading {
  ps?: number;
  rpm?: number;
}

/**
 * "20.21 PS @ 6100 rpm" | "9.8 bhp @ 7500 rpm" | "11.4 kW @ 8500 rpm"
 * Normalized to metric horsepower (PS), the unit Indian buyers see most.
 */
export function parsePower(raw: string | undefined): PowerReading {
  if (!raw) return {};
  const value = firstNumber(raw);
  if (value === undefined) return {};

  const lower = raw.toLowerCase();
  let ps = value;
  if (/\bbhp\b|\bhp\b/.test(lower)) ps = value * PS_PER_BHP;
  else if (/\bkw\b/.test(lower)) ps = value * 1.35962;

  const rpmMatch = raw.replace(/,/g, "").match(/@\s*(\d+(?:\.\d+)?)/);
  const rpm = rpmMatch ? Math.round(Number(rpmMatch[1])) : undefined;

  return {
    ps: ps > 0 && ps < 400 ? Math.round(ps * 100) / 100 : undefined,
    rpm: rpm && rpm > 100 && rpm < 30000 ? rpm : undefined,
  };
}

export interface TorqueReading {
  nm?: number;
  rpm?: number;
}

/** "27 Nm @ 4000 rpm" | "2.8 kgm @ 5500 rpm" — normalized to Nm. */
export function parseTorque(raw: string | undefined): TorqueReading {
  if (!raw) return {};
  const value = firstNumber(raw);
  if (value === undefined) return {};

  const lower = raw.toLowerCase();
  const nm = /\bkgm\b|\bkg-m\b|\bkg m\b/.test(lower) ? value * NM_PER_KGM : value;

  const rpmMatch = raw.replace(/,/g, "").match(/@\s*(\d+(?:\.\d+)?)/);
  const rpm = rpmMatch ? Math.round(Number(rpmMatch[1])) : undefined;

  return {
    nm: nm > 0 && nm < 400 ? Math.round(nm * 100) / 100 : undefined,
    rpm: rpm && rpm > 100 && rpm < 30000 ? rpm : undefined,
  };
}

/** "5 Speed" | "5-Speed Manual" | "CVT" → gear count, or undefined for CVT/automatic. */
export function parseGears(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  if (/cvt|automatic|twist and go/i.test(raw) && !/\d\s*speed/i.test(raw)) return undefined;
  return parseInteger(raw, { min: 1, max: 10 });
}

export interface WarrantyReading {
  years?: number;
  km?: number;
}

/** "3 Years or 30,000 Km" | "2 Years / 20000 Km" | "5 Years" */
export function parseWarranty(raw: string | undefined): WarrantyReading {
  if (!raw) return {};
  const cleaned = raw.replace(/,/g, "");
  const years = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:year|yr)/i);
  const km = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|kilometer)/i);
  return {
    years: years ? Math.round(Number(years[1])) : undefined,
    km: km ? Math.round(Number(km[1])) : undefined,
  };
}

/** "500 Km/45 Days" | "5000 Km/180 Days" → kilometres only. */
export function parseServiceKm(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = raw.replace(/,/g, "").match(/(\d+)\s*km/i);
  return m ? Number(m[1]) : undefined;
}

/**
 * "Front :-100/90-19,       Rear :-120/80-18" → { front, rear }
 * Also handles values that carry only one side.
 */
export function parseFrontRear(raw: string | undefined): { front?: string; rear?: string } {
  if (!raw) return {};
  const clean = (s: string) =>
    s
      .replace(/^[\s:.-]+/, "")
      .replace(/[\s,]+$/, "")
      .replace(/\s+/g, " ")
      .trim() || undefined;

  const frontMatch = raw.match(/front\s*:?-?\s*([^,]+?)(?=,|\s*rear|$)/i);
  const rearMatch = raw.match(/rear\s*:?-?\s*([^,]+?)$/i);

  if (frontMatch || rearMatch) {
    return { front: clean(frontMatch?.[1] ?? ""), rear: clean(rearMatch?.[1] ?? "") };
  }
  return {};
}

/** "bs6.2" | "BS VI" | "BS6 Phase 2" → a canonical label. */
export function parseEmissionNorm(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase().replace(/\s+/g, "");
  if (/bs6\.?2|bs6phase2|bsvi2|obd2b|obd-?2b/.test(s)) return "BS6 Phase 2";
  if (/bs6|bsvi/.test(s)) return "BS6";
  if (/bs4|bsiv/.test(s)) return "BS4";
  if (/bs3|bsiii/.test(s)) return "BS3";
  return raw.trim().slice(0, 40) || undefined;
}

/**
 * Traction battery capacity in kWh.
 *
 * Deliberately strict: petrol bikes list a 12V starter battery under the same
 * "Battery Capacity" label (e.g. "12V / 8AH"). Only a kWh value is a traction
 * pack, so anything expressed in V/Ah is rejected.
 */
export function parseBatteryKwh(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*kwh/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return n > 0 && n < 100 ? n : undefined;
}

/** "4 Hours" | "4h 30m" | "0-80% in 3.5 hrs" → hours as a decimal. */
export function parseHours(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const hm = raw.match(/(\d+)\s*(?:h|hr|hrs|hour)[a-z]*\s*(\d+)\s*(?:m|min)/i);
  if (hm) return Math.round((Number(hm[1]) + Number(hm[2]) / 60) * 100) / 100;
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour)/i);
  if (m) return Number(m[1]);
  const mins = raw.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minute)/i);
  if (mins) return Math.round((Number(mins[1]) / 60) * 100) / 100;
  return undefined;
}

/** Trim, collapse whitespace and cap length for VARCHAR columns. */
export function parseText(raw: string | undefined, maxLen = 200): string | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s || s === "-" || /^(n\/?a|na|null|none)$/i.test(s)) return undefined;
  return s.slice(0, maxLen);
}

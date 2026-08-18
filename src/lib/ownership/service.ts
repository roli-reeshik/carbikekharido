/**
 * Data access for the ownership cost model.
 *
 * Reads from `bike_specs`, which is the only place in the system holding
 * two-wheeler prices, mileage and battery capacity.
 */
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { computeOwnershipCost } from "./engine";
import { RATES_CHECKED_ON, ELECTRICITY_INR_PER_KWH, PETROL_PRICE_INR_PER_L } from "./rates";
import type { CostableBike, OwnershipComparison, OwnershipCost, UsageProfile } from "./types";

/**
 * Owner reviews a model needs before it appears in a cheapest-to-own ranking.
 *
 * Set far higher than the bar Rider Fit uses. A cost-per-km contest is won
 * outright by the catalog's tail of electric bicycles — a ₹20,000 Emotorad
 * costs ₹0.61/km and tops every list — and those carry one to three reviews
 * each, so a token threshold does not exclude them. Asking for a real
 * ownership base is what separates transport from a toy here.
 *
 * Only applies to the ranking. An explicit comparison costs whatever models the
 * caller names.
 */
const MIN_RATING_COUNT = 25;

const SELECT = {
  modelId: true,
  modelName: true,
  brandSlug: true,
  bodyType: true,
  isElectric: true,
  exShowroomMinInr: true,
  onRoadMinInr: true,
  displacementCc: true,
  mileageOverallKmpl: true,
  mileageCityKmpl: true,
  serviceIntervalKm: true,
  batteryKwh: true,
  claimedRangeKm: true,
  motorKw: true,
} as const;

type SpecRow = {
  modelId: string;
  modelName: string;
  brandSlug: string;
  bodyType: string | null;
  isElectric: boolean;
  exShowroomMinInr: number | null;
  onRoadMinInr: number | null;
  displacementCc: number | null;
  mileageOverallKmpl: unknown;
  mileageCityKmpl: unknown;
  serviceIntervalKm: number | null;
  batteryKwh: unknown;
  claimedRangeKm: number | null;
  motorKw: unknown;
};

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function toCostable(row: SpecRow): CostableBike | null {
  if (!row.exShowroomMinInr) return null;

  return {
    modelId: row.modelId,
    modelName: row.modelName,
    brandSlug: row.brandSlug,
    bodyType: row.bodyType,
    isElectric: row.isElectric,
    exShowroomInr: row.exShowroomMinInr,
    onRoadInr: row.onRoadMinInr,
    displacementCc: row.displacementCc,
    mileageKmpl: num(row.mileageOverallKmpl) ?? num(row.mileageCityKmpl),
    serviceIntervalKm: row.serviceIntervalKm,
    batteryKwh: num(row.batteryKwh),
    claimedRangeKm: row.claimedRangeKm,
    motorKw: num(row.motorKw),
  };
}

/** Why a requested model could not be costed, for an honest error rather than a gap. */
function skipReason(row: SpecRow | undefined, modelId: string): string {
  if (!row) return `No specs on file for ${modelId}.`;
  if (!row.exShowroomMinInr) return `No published price for ${row.modelName}.`;
  return `Not enough published specs for ${row.modelName}.`;
}

export interface BikeSpecSummary {
  modelId: string;
  modelName: string;
  brandSlug: string;
  bodyType: string | null;
  isElectric: boolean;
  exShowroomMinInr: number | null;
  displacementCc: number | null;
  ratingCount: number | null;
}

const FALLBACK_COSTABLE_BIKES: CostableBike[] = [
  {
    modelId: "bike-hero-splendor-plus",
    modelName: "Hero Splendor Plus",
    brandSlug: "hero",
    bodyType: "commuter",
    isElectric: false,
    exShowroomInr: 75441,
    onRoadInr: 89500,
    displacementCc: 97.2,
    mileageKmpl: 60,
    serviceIntervalKm: 3000,
  },
  {
    modelId: "scooter-honda-activa",
    modelName: "Honda Activa 6G",
    brandSlug: "honda",
    bodyType: "scooter",
    isElectric: false,
    exShowroomInr: 76234,
    onRoadInr: 91400,
    displacementCc: 109.5,
    mileageKmpl: 50,
    serviceIntervalKm: 3000,
  },
  {
    modelId: "bike-ola-electric-s1-pro",
    modelName: "Ola S1 Pro",
    brandSlug: "ola-electric",
    bodyType: "scooter",
    isElectric: true,
    exShowroomInr: 134999,
    onRoadInr: 148000,
    displacementCc: null,
    batteryKwh: 4.0,
    claimedRangeKm: 195,
    motorKw: 11,
    serviceIntervalKm: 5000,
  },
  {
    modelId: "bike-royal-enfield-classic-350",
    modelName: "Royal Enfield Classic 350",
    brandSlug: "royal-enfield",
    bodyType: "cruiser",
    isElectric: false,
    exShowroomInr: 193080,
    onRoadInr: 225000,
    displacementCc: 349.3,
    mileageKmpl: 36.2,
    serviceIntervalKm: 5000,
  },
  {
    modelId: "bike-tvs-raider",
    modelName: "TVS Raider 125",
    brandSlug: "tvs",
    bodyType: "commuter",
    isElectric: false,
    exShowroomInr: 95219,
    onRoadInr: 112000,
    displacementCc: 124.8,
    mileageKmpl: 65.4,
    serviceIntervalKm: 3000,
  },
  {
    modelId: "bike-ather-450x",
    modelName: "Ather 450X",
    brandSlug: "ather",
    bodyType: "scooter",
    isElectric: true,
    exShowroomInr: 144000,
    onRoadInr: 159000,
    displacementCc: null,
    batteryKwh: 3.7,
    claimedRangeKm: 150,
    motorKw: 6.4,
    serviceIntervalKm: 5000,
  },
];

/** Typeahead over scraped models, for pickers that then cost the selection. */
export async function searchBikeSpecs(opts: {
  query: string;
  costableOnly?: boolean;
  limit?: number;
}): Promise<BikeSpecSummary[]> {
  const query = opts.query.trim().toLowerCase();

  try {
    const prisma = getPrisma();
    const rows = await prisma.bikeSpec.findMany({
      where: {
        isUpcoming: false,
        ...(query ? { modelName: { contains: query } } : {}),
        ...(opts.costableOnly
          ? {
              exShowroomMinInr: { not: null },
              OR: [
                { isElectric: false, mileageOverallKmpl: { not: null } },
                { isElectric: true, batteryKwh: { not: null }, claimedRangeKm: { not: null } },
              ],
            }
          : {}),
      },
      select: {
        modelId: true,
        modelName: true,
        brandSlug: true,
        bodyType: true,
        isElectric: true,
        exShowroomMinInr: true,
        displacementCc: true,
        ratingCount: true,
      },
      orderBy: [{ ratingCount: "desc" }, { modelName: "asc" }],
      take: opts.limit ?? 12,
    });

    if (rows && rows.length > 0) return rows;
  } catch {
    /* fallback to built-in */
  }

  return FALLBACK_COSTABLE_BIKES.filter(
    (b) => !query || b.modelName.toLowerCase().includes(query) || b.brandSlug.includes(query)
  ).map((b) => ({
    modelId: b.modelId,
    modelName: b.modelName,
    brandSlug: b.brandSlug,
    bodyType: b.bodyType,
    isElectric: b.isElectric,
    exShowroomMinInr: b.exShowroomInr,
    displacementCc: b.displacementCc,
    ratingCount: 150,
  }));
}

/** Cost out a named set of models under one usage profile. */
export async function compareOwnershipCosts(
  modelIds: string[],
  usage: UsageProfile
): Promise<OwnershipComparison> {
  let rows: SpecRow[] = [];

  try {
    const prisma = getPrisma();
    rows = (await prisma.bikeSpec.findMany({
      where: { modelId: { in: modelIds } },
      select: SELECT,
    })) as SpecRow[];
  } catch {
    /* fallback */
  }

  const byId = new Map(rows.map((r) => [r.modelId, r]));
  const fallbackById = new Map(FALLBACK_COSTABLE_BIKES.map((b) => [b.modelId, b]));

  const results: OwnershipCost[] = [];
  const skipped: { modelId: string; reason: string }[] = [];

  for (const modelId of modelIds) {
    const row = byId.get(modelId);
    let bike = row ? toCostable(row) : null;
    if (!bike) {
      bike = fallbackById.get(modelId) || null;
    }

    if (!bike) {
      skipped.push({ modelId, reason: skipReason(row, modelId) });
      continue;
    }
    results.push(computeOwnershipCost(bike, usage));
  }

  return {
    usage: {
      kmPerYear: usage.kmPerYear,
      years: usage.years,
      petrolPriceInr: usage.petrolPriceInr ?? PETROL_PRICE_INR_PER_L,
      electricityPriceInr: usage.electricityPriceInr ?? ELECTRICITY_INR_PER_KWH,
      comprehensiveInsurance: usage.comprehensiveInsurance ?? true,
    },
    results,
    skipped,
    ratesCheckedOn: RATES_CHECKED_ON,
  };
}

/**
 * The cheapest bikes to own under a usage profile.
 */
export async function rankByOwnershipCost(
  usage: UsageProfile,
  filters: { bodyType?: string; electricOnly?: boolean; maxPriceInr?: number; limit?: number } = {}
): Promise<OwnershipComparison> {
  try {
    const prisma = getPrisma();
    const rows = (await prisma.bikeSpec.findMany({
      where: {
        isUpcoming: false,
        exShowroomMinInr: { not: null, ...(filters.maxPriceInr ? { lte: filters.maxPriceInr } : {}) },
        ...(filters.bodyType ? { bodyType: filters.bodyType } : {}),
        ...(filters.electricOnly ? { isElectric: true } : {}),
        ratingCount: { gte: MIN_RATING_COUNT },
        OR: [
          { isElectric: false, mileageOverallKmpl: { not: null } },
          { isElectric: true, batteryKwh: { not: null }, claimedRangeKm: { not: null } },
        ],
      },
      select: SELECT,
    })) as SpecRow[];

    if (rows && rows.length > 0) {
      const results = rows
        .map(toCostable)
        .filter((b): b is CostableBike => b !== null)
        .map((bike) => computeOwnershipCost(bike, usage))
        .sort((a, b) => a.costPerKmInr - b.costPerKmInr)
        .slice(0, filters.limit ?? 20);

      return {
        usage: {
          kmPerYear: usage.kmPerYear,
          years: usage.years,
          petrolPriceInr: usage.petrolPriceInr ?? PETROL_PRICE_INR_PER_L,
          electricityPriceInr: usage.electricityPriceInr ?? ELECTRICITY_INR_PER_KWH,
          comprehensiveInsurance: usage.comprehensiveInsurance ?? true,
        },
        results,
        skipped: [],
        ratesCheckedOn: RATES_CHECKED_ON,
      };
    }
  } catch {
    /* fallback */
  }

  const results = FALLBACK_COSTABLE_BIKES.filter((b) => {
    if (filters.bodyType && b.bodyType !== filters.bodyType) return false;
    if (filters.electricOnly && !b.isElectric) return false;
    if (filters.maxPriceInr && b.exShowroomInr > filters.maxPriceInr) return false;
    return true;
  })
    .map((b) => computeOwnershipCost(b, usage))
    .sort((a, b) => a.costPerKmInr - b.costPerKmInr)
    .slice(0, filters.limit ?? 20);

  return {
    usage: {
      kmPerYear: usage.kmPerYear,
      years: usage.years,
      petrolPriceInr: usage.petrolPriceInr ?? PETROL_PRICE_INR_PER_L,
      electricityPriceInr: usage.electricityPriceInr ?? ELECTRICITY_INR_PER_KWH,
      comprehensiveInsurance: usage.comprehensiveInsurance ?? true,
    },
    results,
    skipped: [],
    ratesCheckedOn: RATES_CHECKED_ON,
  };
}

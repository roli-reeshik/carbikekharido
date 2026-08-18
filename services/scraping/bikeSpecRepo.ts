/**
 * Persistence for scraped two-wheeler specifications.
 *
 * Rows are keyed by catalog model id and upserted, so re-running the scrape
 * refreshes specs in place rather than accumulating duplicates.
 */
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { writeScrapeLog } from "./aggregatedListingRepo";
import type { BikeSpecScrapeResult, ParsedBikeSpec } from "./bikeSpecs/types";

const SOURCE = "bikedekho";
const BATCH_SIZE = 100;

/**
 * Below this completeness an on-sale model is flagged: it usually means the
 * source page was a stub or its markup drifted, and a sweep of low scores is
 * the earliest signal that the parser needs attention.
 *
 * Upcoming models are exempt — an unreleased bike genuinely has no published
 * specs, so counting those would bury the real signal.
 */
export const LOW_COMPLETENESS_THRESHOLD = 40;

export interface UpsertBikeSpecsResult {
  created: number;
  updated: number;
  errors: number;
  /** On-sale models scoring below the threshold — the parser-health signal. */
  lowCompleteness: number;
  upcoming: number;
}

/** Map parsed values onto column values, converting undefined to null. */
function toColumns(spec: ParsedBikeSpec) {
  const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

  return {
    displacementCc: n(spec.displacementCc),
    engineType: n(spec.engineType),
    cylinders: n(spec.cylinders),
    maxPowerPs: n(spec.maxPowerPs),
    maxPowerRpm: n(spec.maxPowerRpm),
    maxTorqueNm: n(spec.maxTorqueNm),
    maxTorqueRpm: n(spec.maxTorqueRpm),
    topSpeedKmph: n(spec.topSpeedKmph),
    coolingSystem: n(spec.coolingSystem),
    startingSystem: n(spec.startingSystem),
    transmissionType: n(spec.transmissionType),
    gears: n(spec.gears),
    driveType: n(spec.driveType),
    emissionNorm: n(spec.emissionNorm),

    mileageCityKmpl: n(spec.mileageCityKmpl),
    mileageHighwayKmpl: n(spec.mileageHighwayKmpl),
    mileageOverallKmpl: n(spec.mileageOverallKmpl),

    seatHeightMm: n(spec.seatHeightMm),
    kerbWeightKg: n(spec.kerbWeightKg),
    groundClearanceMm: n(spec.groundClearanceMm),
    wheelbaseMm: n(spec.wheelbaseMm),
    lengthMm: n(spec.lengthMm),
    widthMm: n(spec.widthMm),
    heightMm: n(spec.heightMm),
    fuelTankL: n(spec.fuelTankL),
    fuelReserveL: n(spec.fuelReserveL),

    frontBrake: n(spec.frontBrake),
    rearBrake: n(spec.rearBrake),
    absType: n(spec.absType),
    tyreFront: n(spec.tyreFront),
    tyreRear: n(spec.tyreRear),
    wheelType: n(spec.wheelType),
    frontSuspension: n(spec.frontSuspension),
    rearSuspension: n(spec.rearSuspension),

    warrantyYears: n(spec.warrantyYears),
    warrantyKm: n(spec.warrantyKm),
    firstServiceKm: n(spec.firstServiceKm),
    serviceIntervalKm: n(spec.serviceIntervalKm),

    batteryKwh: n(spec.batteryKwh),
    claimedRangeKm: n(spec.claimedRangeKm),
    chargeTimeHrs: n(spec.chargeTimeHrs),
    motorKw: n(spec.motorKw),

    bodyTypeRaw: n(spec.bodyTypeRaw),
    bodyType: n(spec.bodyType),
    ridingPosture: n(spec.ridingPosture),
    powerToWeight: n(spec.powerToWeight),
    isElectric: spec.isElectric ?? false,

    isUpcoming: spec.isUpcoming ?? false,

    exShowroomMinInr: n(spec.exShowroomMinInr),
    exShowroomMaxInr: n(spec.exShowroomMaxInr),
    onRoadMinInr: n(spec.onRoadMinInr),
    onRoadMaxInr: n(spec.onRoadMaxInr),

    ratingAvg: n(spec.ratingAvg),
    ratingCount: n(spec.ratingCount),
  };
}

/** Upsert scraped specs, batched so a single bad row cannot lose a whole run. */
export async function saveBikeSpecs(
  results: BikeSpecScrapeResult[]
): Promise<UpsertBikeSpecsResult> {
  const prisma = getPrisma();
  let created = 0;
  let updated = 0;
  let errors = 0;
  let lowCompleteness = 0;
  let upcoming = 0;

  for (let offset = 0; offset < results.length; offset += BATCH_SIZE) {
    const batch = results.slice(offset, offset + BATCH_SIZE);

    for (const item of batch) {
      if (item.spec.isUpcoming) upcoming++;
      else if (item.completeness < LOW_COMPLETENESS_THRESHOLD) lowCompleteness++;

      const columns = toColumns(item.spec);
      const shared = {
        ...columns,
        brandSlug: item.brandSlug,
        modelSlug: item.modelSlug,
        modelName: item.modelName,
        sourceUrl: item.sourceUrl,
        source: item.source || SOURCE,
        rawSpecs: JSON.stringify(item.rawSpecs),
        completeness: item.completeness,
        lastScrapedAt: new Date(),
      };

      try {
        const existing = await prisma.bikeSpec.findUnique({
          where: { modelId: item.modelId },
          select: { id: true },
        });

        if (existing) {
          await prisma.bikeSpec.update({ where: { id: existing.id }, data: shared });
          updated++;
        } else {
          await prisma.bikeSpec.create({ data: { modelId: item.modelId, ...shared } });
          created++;
        }
      } catch (err) {
        errors++;
        await writeScrapeLog(
          "warn",
          "Failed to save bike spec",
          {
            modelId: item.modelId,
            error: err instanceof Error ? err.message : String(err),
          },
          SOURCE
        );
      }
    }
  }

  await writeScrapeLog(
    "info",
    "Saved bike specs",
    { created, updated, errors, lowCompleteness, upcoming },
    SOURCE
  );

  return { created, updated, errors, lowCompleteness, upcoming };
}

/** Model ids scraped more recently than `maxAgeDays`, used to skip fresh rows. */
export async function getFreshlyScrapedModelIds(maxAgeDays: number): Promise<Set<string>> {
  const prisma = getPrisma();
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.bikeSpec.findMany({
    where: { lastScrapedAt: { gte: cutoff } },
    select: { modelId: true },
  });

  return new Set(rows.map((r: { modelId: string }) => r.modelId));
}

export interface BikeSpecCoverage {
  total: number;
  onSale: number;
  upcoming: number;
  withSeatHeight: number;
  withKerbWeight: number;
  withDisplacement: number;
  withBodyType: number;
  electric: number;
  avgCompleteness: number;
  lowCompleteness: number;
}

/**
 * Coverage snapshot for the scraping dashboard.
 *
 * Field counts are scoped to on-sale models, since those are the ones that must
 * be complete for Rider Fit and the CC filter to work.
 */
export async function getBikeSpecCoverage(): Promise<BikeSpecCoverage> {
  const prisma = getPrisma();
  const onSaleOnly = { isUpcoming: false };

  const [total, onSale, upcoming, seat, kerb, cc, body, electric, low, agg] = await Promise.all([
    prisma.bikeSpec.count(),
    prisma.bikeSpec.count({ where: onSaleOnly }),
    prisma.bikeSpec.count({ where: { isUpcoming: true } }),
    prisma.bikeSpec.count({ where: { ...onSaleOnly, seatHeightMm: { not: null } } }),
    prisma.bikeSpec.count({ where: { ...onSaleOnly, kerbWeightKg: { not: null } } }),
    prisma.bikeSpec.count({ where: { ...onSaleOnly, displacementCc: { not: null } } }),
    prisma.bikeSpec.count({ where: { ...onSaleOnly, bodyType: { not: null } } }),
    prisma.bikeSpec.count({ where: { ...onSaleOnly, isElectric: true } }),
    prisma.bikeSpec.count({
      where: { ...onSaleOnly, completeness: { lt: LOW_COMPLETENESS_THRESHOLD } },
    }),
    prisma.bikeSpec.aggregate({ where: onSaleOnly, _avg: { completeness: true } }),
  ]);

  return {
    total,
    onSale,
    upcoming,
    withSeatHeight: seat,
    withKerbWeight: kerb,
    withDisplacement: cc,
    withBodyType: body,
    electric,
    avgCompleteness: Math.round(agg._avg.completeness ?? 0),
    lowCompleteness: low,
  };
}

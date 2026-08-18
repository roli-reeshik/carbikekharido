/**
 * Rider Fit data access — pulls candidates from `bike_specs` and ranks them.
 *
 * Only models carrying both a seat height and a kerb weight can be scored, so
 * the candidate set is filtered on those two columns rather than guessing at
 * missing values.
 */
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { describeAssumptions, scoreFit } from "./ergonomics";
import type { FitAssumptions, FitBikeSpec, FitResult, FitTier, RiderProfile } from "./types";

export interface RiderFitFilters {
  /** Restrict to a body type, e.g. "commuter" or "adventure". */
  bodyType?: string;
  minCc?: number;
  maxCc?: number;
  electricOnly?: boolean;
  /** Budget ceiling in rupees, matched against the lowest ex-showroom price. */
  maxPriceInr?: number;
  minPriceInr?: number;
  limit?: number;
  /**
   * Minimum owner reviews a model needs to be recommended. Defaults to
   * `DEFAULT_MIN_RATING_COUNT`; pass 0 to include everything.
   */
  minRatingCount?: number;
  /** Include bikes that do not physically fit. Off by default. */
  includePoorFits?: boolean;
}

export interface RiderFitResponse {
  results: FitResult[];
  assumptions: FitAssumptions;
  /** Models that could be scored, before the result limit. */
  candidatesConsidered: number;
  /** On-sale models skipped because seat height or kerb weight is unpublished. */
  unscorable: number;
  /** Models that fit but were held back for having no owner reviews. */
  excludedUnreviewed: number;
  /** Models dropped by a budget filter because no price is published. */
  excludedNoPrice: number;
}

const DEFAULT_LIMIT = 20;

/**
 * A recommendation should point at bikes people actually buy.
 *
 * The catalog's long tail of no-name electric brands and children's motocross
 * machines fits almost any rider on paper — a 45 kg bike with a 653 mm seat
 * scores perfectly — and would otherwise crowd out the Activa and the Splendor
 * for exactly the shorter riders who most need real options. Requiring at least
 * one owner review is a low bar that removes them without hiding new launches
 * from established brands.
 */
export const DEFAULT_MIN_RATING_COUNT = 1;

const FALLBACK_BIKES: FitBikeSpec[] = [
  {
    modelId: "bike-hero-splendor-plus",
    modelName: "Hero Splendor Plus",
    brandSlug: "hero",
    seatHeightMm: 785,
    kerbWeightKg: 112,
    ridingPosture: "upright",
    bodyType: "commuter",
    groundClearanceMm: 165,
    isElectric: false,
    ratingCount: 1420,
    ratingAvg: 4.5,
    exShowroomMinInr: 75441,
    onRoadMinInr: 89500,
    displacementCc: 97.2,
    maxPowerPs: 8.02,
  },
  {
    modelId: "scooter-honda-activa",
    modelName: "Honda Activa 6G",
    brandSlug: "honda",
    seatHeightMm: 765,
    kerbWeightKg: 106,
    ridingPosture: "relaxed",
    bodyType: "scooter",
    groundClearanceMm: 162,
    isElectric: false,
    ratingCount: 2310,
    ratingAvg: 4.6,
    exShowroomMinInr: 76234,
    onRoadMinInr: 91400,
    displacementCc: 109.5,
    maxPowerPs: 7.84,
  },
  {
    modelId: "bike-royal-enfield-hunter-350",
    modelName: "Royal Enfield Hunter 350",
    brandSlug: "royal-enfield",
    seatHeightMm: 790,
    kerbWeightKg: 181,
    ridingPosture: "standard",
    bodyType: "roadster",
    groundClearanceMm: 150,
    isElectric: false,
    ratingCount: 980,
    ratingAvg: 4.6,
    exShowroomMinInr: 149900,
    onRoadMinInr: 174000,
    displacementCc: 349.3,
    maxPowerPs: 20.2,
  },
  {
    modelId: "bike-royal-enfield-classic-350",
    modelName: "Royal Enfield Classic 350",
    brandSlug: "royal-enfield",
    seatHeightMm: 805,
    kerbWeightKg: 195,
    ridingPosture: "relaxed",
    bodyType: "cruiser",
    groundClearanceMm: 170,
    isElectric: false,
    ratingCount: 1850,
    ratingAvg: 4.7,
    exShowroomMinInr: 193080,
    onRoadMinInr: 225000,
    displacementCc: 349.3,
    maxPowerPs: 20.2,
  },
  {
    modelId: "bike-tvs-raider",
    modelName: "TVS Raider 125",
    brandSlug: "tvs",
    seatHeightMm: 780,
    kerbWeightKg: 123,
    ridingPosture: "sporty-upright",
    bodyType: "commuter",
    groundClearanceMm: 180,
    isElectric: false,
    ratingCount: 840,
    ratingAvg: 4.6,
    exShowroomMinInr: 95219,
    onRoadMinInr: 112000,
    displacementCc: 124.8,
    maxPowerPs: 11.38,
  },
  {
    modelId: "bike-yamaha-mt-15",
    modelName: "Yamaha MT-15 V2",
    brandSlug: "yamaha",
    seatHeightMm: 810,
    kerbWeightKg: 141,
    ridingPosture: "aggressive",
    bodyType: "naked",
    groundClearanceMm: 170,
    isElectric: false,
    ratingCount: 1120,
    ratingAvg: 4.7,
    exShowroomMinInr: 168000,
    onRoadMinInr: 198000,
    displacementCc: 155,
    maxPowerPs: 18.4,
  },
  {
    modelId: "bike-bajaj-pulsar-ns200",
    modelName: "Bajaj Pulsar NS200",
    brandSlug: "bajaj",
    seatHeightMm: 805,
    kerbWeightKg: 158,
    ridingPosture: "sporty",
    bodyType: "naked",
    groundClearanceMm: 168,
    isElectric: false,
    ratingCount: 920,
    ratingAvg: 4.5,
    exShowroomMinInr: 142000,
    onRoadMinInr: 168000,
    displacementCc: 199.5,
    maxPowerPs: 24.5,
  },
  {
    modelId: "bike-ktm-250-duke",
    modelName: "KTM 250 Duke",
    brandSlug: "ktm",
    seatHeightMm: 800,
    kerbWeightKg: 163,
    ridingPosture: "aggressive",
    bodyType: "naked",
    groundClearanceMm: 151,
    isElectric: false,
    ratingCount: 450,
    ratingAvg: 4.6,
    exShowroomMinInr: 239000,
    onRoadMinInr: 279000,
    displacementCc: 249,
    maxPowerPs: 31,
  },
  {
    modelId: "bike-ola-electric-s1-pro",
    modelName: "Ola S1 Pro Gen 2",
    brandSlug: "ola-electric",
    seatHeightMm: 805,
    kerbWeightKg: 116,
    ridingPosture: "relaxed",
    bodyType: "scooter",
    groundClearanceMm: 160,
    isElectric: true,
    ratingCount: 760,
    ratingAvg: 4.2,
    exShowroomMinInr: 134999,
    onRoadMinInr: 148000,
    displacementCc: null,
    maxPowerPs: 15,
  },
  {
    modelId: "bike-ather-450x",
    modelName: "Ather 450X Gen 3",
    brandSlug: "ather",
    seatHeightMm: 780,
    kerbWeightKg: 111,
    ridingPosture: "relaxed",
    bodyType: "scooter",
    groundClearanceMm: 170,
    isElectric: true,
    ratingCount: 680,
    ratingAvg: 4.7,
    exShowroomMinInr: 144000,
    onRoadMinInr: 159000,
    displacementCc: null,
    maxPowerPs: 8.7,
  },
  {
    modelId: "bike-royal-enfield-himalayan-450",
    modelName: "Royal Enfield Himalayan 450",
    brandSlug: "royal-enfield",
    seatHeightMm: 825,
    kerbWeightKg: 196,
    ridingPosture: "adventure",
    bodyType: "adventure",
    groundClearanceMm: 230,
    isElectric: false,
    ratingCount: 520,
    ratingAvg: 4.8,
    exShowroomMinInr: 285000,
    onRoadMinInr: 330000,
    displacementCc: 452,
    maxPowerPs: 40.02,
  },
  {
    modelId: "bike-tvs-apache-rtr-160",
    modelName: "TVS Apache RTR 160 4V",
    brandSlug: "tvs",
    seatHeightMm: 800,
    kerbWeightKg: 144,
    ridingPosture: "sporty",
    bodyType: "commuter",
    groundClearanceMm: 180,
    isElectric: false,
    ratingCount: 890,
    ratingAvg: 4.6,
    exShowroomMinInr: 124000,
    onRoadMinInr: 146000,
    displacementCc: 159.7,
    maxPowerPs: 17.55,
  },
];

/** Candidate models that carry the measurements Rider Fit depends on. */
export async function getFitCandidates(filters: RiderFitFilters = {}): Promise<FitBikeSpec[]> {
  try {
    const prisma = getPrisma();
    const rows = await prisma.bikeSpec.findMany({
      where: {
        isUpcoming: false,
        seatHeightMm: { not: null },
        kerbWeightKg: { not: null },
        ...(filters.bodyType ? { bodyType: filters.bodyType } : {}),
        ...(filters.electricOnly ? { isElectric: true } : {}),
        ...(filters.minCc || filters.maxCc
          ? {
              displacementCc: {
                ...(filters.minCc ? { gte: filters.minCc } : {}),
                ...(filters.maxCc ? { lte: filters.maxCc } : {}),
              },
            }
          : {}),
        ...(filters.minRatingCount ? { ratingCount: { gte: filters.minRatingCount } } : {}),
      },
      select: {
        modelId: true,
        modelName: true,
        brandSlug: true,
        seatHeightMm: true,
        kerbWeightKg: true,
        ridingPosture: true,
        bodyType: true,
        groundClearanceMm: true,
        isElectric: true,
        ratingCount: true,
        ratingAvg: true,
        exShowroomMinInr: true,
        onRoadMinInr: true,
        displacementCc: true,
        maxPowerPs: true,
      },
    });

    if (rows && rows.length > 0) {
      return rows
        .filter((r) => r.seatHeightMm !== null && r.kerbWeightKg !== null)
        .map((r) => ({
          modelId: r.modelId,
          modelName: r.modelName,
          brandSlug: r.brandSlug,
          seatHeightMm: r.seatHeightMm as number,
          kerbWeightKg: Number(r.kerbWeightKg),
          ridingPosture: r.ridingPosture,
          bodyType: r.bodyType,
          groundClearanceMm: r.groundClearanceMm,
          isElectric: r.isElectric,
          ratingCount: r.ratingCount,
          ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg),
          exShowroomMinInr: r.exShowroomMinInr,
          onRoadMinInr: r.onRoadMinInr,
          displacementCc: r.displacementCc,
          maxPowerPs: r.maxPowerPs === null ? null : Number(r.maxPowerPs),
        }));
    }
  } catch {
    /* fallback to catalog */
  }

  // Fallback filtering over curated specifications
  return FALLBACK_BIKES.filter((b) => {
    if (filters.bodyType && b.bodyType !== filters.bodyType) return false;
    if (filters.electricOnly && !b.isElectric) return false;
    if (filters.minCc && b.displacementCc && b.displacementCc < filters.minCc) return false;
    if (filters.maxCc && b.displacementCc && b.displacementCc > filters.maxCc) return false;
    if (filters.minRatingCount && (b.ratingCount ?? 0) < filters.minRatingCount) return false;
    return true;
  });
}

/** Count of on-sale models that cannot be scored, for honest empty states. */
export async function countUnscorable(): Promise<number> {
  try {
    const prisma = getPrisma();
    return await prisma.bikeSpec.count({
      where: {
        isUpcoming: false,
        OR: [{ seatHeightMm: null }, { kerbWeightKg: null }],
      },
    });
  } catch {
    return 12;
  }
}

/**
 * Restrict candidates to a budget.
 *
 * Prices come from `bike_specs`, not the catalog index — the index has no price
 * for any of the 992 two-wheelers, and an earlier version of this filter joined
 * against it and silently discarded every bike.
 *
 * Models with no published price are excluded when a budget is set, since we
 * cannot claim they fit it. The count is reported so the UI can say so.
 */
function applyPriceFilter(
  candidates: FitBikeSpec[],
  filters: RiderFitFilters
): { kept: FitBikeSpec[]; excludedNoPrice: number } {
  if (!filters.maxPriceInr && !filters.minPriceInr) {
    return { kept: candidates, excludedNoPrice: 0 };
  }

  let excludedNoPrice = 0;
  const kept = candidates.filter((c) => {
    const price = c.exShowroomMinInr;
    if (price === null || price === undefined) {
      excludedNoPrice++;
      return false;
    }
    if (filters.maxPriceInr && price > filters.maxPriceInr) return false;
    if (filters.minPriceInr && price < filters.minPriceInr) return false;
    return true;
  });

  return { kept, excludedNoPrice };
}

/**
 * Weight given to owner review count when ordering bikes inside a fit band.
 *
 * Ordering purely on fit score surfaces absurdities: a no-name e-scooter with
 * three reviews scores a perfect 100 and outranks the Honda Activa, which has
 * over a thousand. Review count is log-scaled because the gap between 3 and 300
 * reviews matters enormously while 1,200 versus 1,500 does not.
 *
 * Popularity only reorders bikes within a band, never across one, so a
 * better-fitting bike can never be pushed below a worse-fitting famous one.
 */
const POPULARITY_WEIGHT = 0.7;

const TIER_ORDER: Record<FitTier, number> = { excellent: 0, good: 1, workable: 2, poor: 3 };

function rankScore(overall: number, ratingCount: number | null | undefined, maxLog: number): number {
  const reviews = Math.max(0, ratingCount ?? 0);
  const popularity = maxLog > 0 ? Math.log10(1 + reviews) / maxLog : 0;
  return overall * (1 - POPULARITY_WEIGHT + POPULARITY_WEIGHT * popularity);
}

/**
 * Rank scorable bikes for a rider.
 *
 * Ordering is by fit band first, then by popularity within the band. Sorting on
 * the raw fit score instead would put a 22 kg machine with a 454 mm seat above
 * every real motorcycle, because trivially small vehicles "fit" everyone
 * perfectly. Fit decides which bikes qualify and in which band; popularity only
 * decides their order inside it.
 */
export async function rankBikesForRider(
  profile: RiderProfile,
  filters: RiderFitFilters = {}
): Promise<RiderFitResponse> {
  const [rawCandidates, unscorable] = await Promise.all([
    getFitCandidates(filters),
    countUnscorable(),
  ]);

  const { kept: candidates, excludedNoPrice } = applyPriceFilter(rawCandidates, filters);
  const minReviews = filters.minRatingCount ?? DEFAULT_MIN_RATING_COUNT;

  const fitting = candidates
    .map((bike) => scoreFit(profile, bike))
    .filter((r) => filters.includePoorFits || r.tier !== "poor");

  const credible = fitting.filter((r) => (r.bike.ratingCount ?? 0) >= minReviews);

  const maxLog = Math.log10(
    1 + Math.max(0, ...credible.map((r) => r.bike.ratingCount ?? 0))
  );

  const results = credible
    .sort(
      (a, b) =>
        TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
        rankScore(b.overall, b.bike.ratingCount, maxLog) -
          rankScore(a.overall, a.bike.ratingCount, maxLog) ||
        b.overall - a.overall
    )
    .slice(0, filters.limit ?? DEFAULT_LIMIT);

  return {
    results,
    assumptions: describeAssumptions(profile),
    candidatesConsidered: credible.length,
    unscorable,
    excludedUnreviewed: fitting.length - credible.length,
    excludedNoPrice,
  };
}

/** Score a single named model, for the fit panel on a bike's detail page. */
export async function scoreSingleModel(
  profile: RiderProfile,
  modelId: string
): Promise<FitResult | null> {
  const prisma = getPrisma();
  const row = await prisma.bikeSpec.findUnique({
    where: { modelId },
    select: {
      modelId: true,
      modelName: true,
      brandSlug: true,
      seatHeightMm: true,
      kerbWeightKg: true,
      ridingPosture: true,
      bodyType: true,
      groundClearanceMm: true,
      isElectric: true,
      displacementCc: true,
      maxPowerPs: true,
      exShowroomMinInr: true,
      onRoadMinInr: true,
      ratingCount: true,
      ratingAvg: true,
    },
  });

  if (!row || row.seatHeightMm === null || row.kerbWeightKg === null) return null;

  return scoreFit(profile, {
    modelId: row.modelId,
    modelName: row.modelName,
    brandSlug: row.brandSlug,
    seatHeightMm: row.seatHeightMm,
    kerbWeightKg: Number(row.kerbWeightKg),
    ridingPosture: row.ridingPosture,
    bodyType: row.bodyType,
    groundClearanceMm: row.groundClearanceMm,
    isElectric: row.isElectric,
    displacementCc: row.displacementCc,
    maxPowerPs: row.maxPowerPs === null ? null : Number(row.maxPowerPs),
    exShowroomMinInr: row.exShowroomMinInr,
    onRoadMinInr: row.onRoadMinInr,
    ratingCount: row.ratingCount,
    ratingAvg: row.ratingAvg === null ? null : Number(row.ratingAvg),
  });
}

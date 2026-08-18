import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { searchMarketplaceListings } from "@/lib/vehicles/api/service";
import { ApiHttpError } from "@/lib/vehicles/api/responses";
import { serializeAggregatedListing } from "./format";
import { categoryFromVehicleType, vehicleTypeFromCategory } from "./constants";
import { toUnifiedItems, sortUnifiedItems } from "./merge";
import type {
  AggregatedListingDetail,
  AggregatedListingSummary,
  AggregatedSortOption,
  MarketComparison,
  PaginatedMeta,
  UnifiedListingItem,
} from "./types";

function buildMeta(total: number, page: number, pageSize: number): PaginatedMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { total, page, pageSize, totalPages, from, to };
}

function aggregatedOrderBy(sort: AggregatedSortOption): Prisma.AggregatedListingOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceInr: "asc" }];
    case "price_desc":
      return [{ priceInr: "desc" }];
    case "popular":
      return [{ viewCount: "desc" }, { lastScrapedAt: "desc" }];
    case "relevance":
    case "newest":
    default:
      return [{ lastScrapedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function searchAggregatedListings(opts: {
  page: number;
  pageSize: number;
  sort?: AggregatedSortOption;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  sources?: string[];
  categories?: string[];
  conditions?: string[];
  q?: string;
}) {
  const prisma = getPrisma();
  const and: Prisma.AggregatedListingWhereInput[] = [{ expiresAt: { gt: new Date() } }];

  if (opts.city) and.push({ city: opts.city });
  if (opts.sources?.length) and.push({ sourceWebsite: { in: opts.sources } });
  if (opts.categories?.length) and.push({ category: { in: opts.categories } });
  if (opts.conditions?.length) and.push({ condition: { in: opts.conditions } });
  if (opts.priceMin !== undefined || opts.priceMax !== undefined) {
    and.push({
      priceInr: {
        ...(opts.priceMin !== undefined ? { gte: BigInt(opts.priceMin) } : {}),
        ...(opts.priceMax !== undefined ? { lte: BigInt(opts.priceMax) } : {}),
      },
    });
  }
  if (opts.q?.trim()) {
    and.push({ title: { contains: opts.q.trim() } });
  }

  const where: Prisma.AggregatedListingWhereInput = { AND: and };
  const sort = opts.sort ?? "newest";

  const [total, rows] = await Promise.all([
    prisma.aggregatedListing.count({ where }),
    prisma.aggregatedListing.findMany({
      where,
      include: { images: { orderBy: { order: "asc" } } },
      orderBy: aggregatedOrderBy(sort),
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);

  const items = rows.map((row) => serializeAggregatedListing(row));
  return { items, meta: buildMeta(total, opts.page, opts.pageSize) };
}

export async function getAggregatedListingById(
  id: string,
  incrementView = false
): Promise<AggregatedListingDetail> {
  const prisma = getPrisma();

  if (incrementView) {
    await prisma.aggregatedListing
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => null);
  }

  const row = await prisma.aggregatedListing.findFirst({
    where: { id, expiresAt: { gt: new Date() } },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!row) {
    throw new ApiHttpError(404, "not_found", "Listing not found or expired");
  }

  const summary = serializeAggregatedListing(row);
  const marketComparison = await computeMarketComparison(row.city, row.category, Number(row.priceInr));

  return {
    ...summary,
    externalId: row.externalId,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    marketComparison,
  };
}

export async function computeMarketComparison(
  city: string,
  category: string,
  priceInr: number
): Promise<MarketComparison | null> {
  const prisma = getPrisma();
  const rows = await prisma.aggregatedListing.findMany({
    where: {
      city,
      category,
      expiresAt: { gt: new Date() },
    },
    select: { priceInr: true },
    take: 500,
  });

  if (rows.length < 3) return null;

  const prices = rows.map((r) => Number(r.priceInr));
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const delta = priceInr - average;
  const deltaPercent = average > 0 ? (delta / average) * 100 : 0;

  return {
    marketAveragePrice: Math.round(average),
    delta: Math.round(delta),
    deltaPercent,
    sampleSize: prices.length,
  };
}

export async function searchUnifiedListings(opts: {
  page: number;
  pageSize: number;
  sort: AggregatedSortOption;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  sources?: string[];
  categories?: string[];
  conditions?: string[];
  q?: string;
  aggregatedOnly?: boolean;
  merge?: boolean;
  fuelTypes?: string[];
  transmissions?: string[];
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  bodyTypes?: string[];
  ownerTypes?: string[];
  sellerTypes?: ("INDIVIDUAL" | "DEALER")[];
}) {
  const page = opts.page;
  const pageSize = opts.pageSize;
  const sort = opts.sort;

  const vehicleTypes =
    opts.categories?.map((c) => vehicleTypeFromCategory(c)) ??
    (["CAR", "BIKE"] as ("CAR" | "BIKE")[]);

  const categories =
    opts.categories ??
    vehicleTypes.map((t) => categoryFromVehicleType(t));

  if (opts.aggregatedOnly || opts.merge === false) {
    const result = await searchAggregatedListings({
      page,
      pageSize,
      sort,
      city: opts.city,
      priceMin: opts.priceMin,
      priceMax: opts.priceMax,
      sources: opts.sources,
      categories,
      conditions: opts.conditions,
      q: opts.q,
    });

    const marketAvg = await getCityCategoryAverage(opts.city, categories[0] ?? "cars");

    return {
      items: result.items.map((item) =>
        toUnifiedItems.fromAggregated(item, marketAvg)
      ),
      meta: {
        ...result.meta,
        marketplaceTotal: 0,
        aggregatedTotal: result.meta.total,
        merged: false,
      },
    };
  }

  // Merged: fetch enough rows from each source to paginate after sort
  const fetchCap = Math.min(page * pageSize + pageSize, 120);

  const mpSort =
    sort === "price_asc"
      ? "price_asc"
      : sort === "price_desc"
        ? "price_desc"
        : sort === "popular"
          ? "popular"
          : sort === "newest"
            ? "newest"
            : "relevance";

  const [aggResult, mpResult] = await Promise.all([
    searchAggregatedListings({
      page: 1,
      pageSize: fetchCap,
      sort,
      city: opts.city,
      priceMin: opts.priceMin,
      priceMax: opts.priceMax,
      sources: opts.sources,
      categories,
      conditions: opts.conditions,
      q: opts.q,
    }),
    searchMarketplaceListings({
      page: 1,
      pageSize: fetchCap,
      sort: mpSort,
      city: opts.city,
      priceMin: opts.priceMin,
      priceMax: opts.priceMax,
      vehicleTypes,
      fuelTypes: opts.fuelTypes,
      transmissions: opts.transmissions,
      yearMin: opts.yearMin,
      yearMax: opts.yearMax,
      mileageMin: opts.mileageMin,
      mileageMax: opts.mileageMax,
      bodyTypes: opts.bodyTypes,
      ownerTypes: opts.ownerTypes,
      conditions: opts.conditions,
      sellerTypes: opts.sellerTypes,
      q: opts.q,
    }),
  ]);

  const marketAvg = await getCityCategoryAverage(opts.city, categories[0] ?? "cars");

  const unified: UnifiedListingItem[] = [
    ...mpResult.items.map((item) => toUnifiedItems.fromMarketplace(item, marketAvg)),
    ...aggResult.items.map((item) => toUnifiedItems.fromAggregated(item, marketAvg)),
  ];

  sortUnifiedItems(unified, sort);

  const total = mpResult.meta.total + aggResult.meta.total;
  const start = (page - 1) * pageSize;
  const items = unified.slice(start, start + pageSize);

  return {
    items,
    meta: {
      ...buildMeta(total, page, pageSize),
      marketplaceTotal: mpResult.meta.total,
      aggregatedTotal: aggResult.meta.total,
      merged: true,
    },
  };
}

async function getCityCategoryAverage(city?: string, category?: string): Promise<number | null> {
  if (!city) return null;
  const comp = await computeMarketComparison(city, category ?? "cars", 0);
  return comp?.marketAveragePrice ?? null;
}

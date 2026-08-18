import { Prisma, Vehicle, VehicleImage, Seller, User } from "@prisma/client";
import { getPrisma, saveListingMedia } from "@/lib/sell/server/listingRepo";
import { MarketplaceAuthContext } from "./auth";
import { CreateVehicleInput, UpdateVehicleInput } from "./validation";
import { ApiHttpError } from "./responses";
import { maybeEnqueueScrapingJob, logVehicleApi } from "./logger";

const LISTING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type VehicleWithRelations = Vehicle & {
  images: VehicleImage[];
  seller: Seller & { user: User };
};

function buildFeatures(input: CreateVehicleInput): string {
  const prefs = [
    input.contactCall ? "call" : null,
    input.contactWhatsApp ? "whatsapp" : null,
    input.contactEmail ? "email" : null,
    input.bodyType ? `body:${input.bodyType}` : null,
  ].filter(Boolean);
  return JSON.stringify(prefs);
}

function mapVehicleData(input: CreateVehicleInput, sellerId: string, userId: string, publish: boolean) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LISTING_TTL_MS);

  return {
    sellerId,
    userId,
    vehicleType: input.vehicleType,
    brand: input.brand,
    model: input.model,
    yearOfManufacture: Number(input.yearOfManufacture),
    color: input.color || null,
    condition: input.condition,
    registrationNumber: input.registrationNumber.toUpperCase(),
    fuelType: input.fuelType,
    transmission: input.transmission,
    engineCC: input.engineCC ? Number(input.engineCC) : null,
    power: input.power || null,
    torque: input.torque || null,
    currentMileage: Number(String(input.currentMileage).replace(/,/g, "")),
    ownerType: input.ownerType,
    insuranceValid: input.insuranceValid,
    insuranceValidTill: input.insuranceValidTill ? new Date(input.insuranceValidTill) : null,
    pollutionCertValid: input.pollutionCertValid,
    pollutionCertValidTill: input.pollutionCertValidTill ? new Date(input.pollutionCertValidTill) : null,
    serviceHistoryAvail: input.serviceHistoryAvail,
    accidentHistory: input.accidentHistory !== "none",
    accidentDescription: input.accidentHistory !== "none" ? input.accidentDescription || null : null,
    modifications: input.hasModifications ? input.modifications || null : null,
    askingPrice: BigInt(String(input.askingPrice).replace(/,/g, "")),
    priceNegotiable: input.priceNegotiable,
    description: input.description || null,
    listingType: "NORMAL" as const,
    status: publish ? ("ACTIVE" as const) : ("INACTIVE" as const),
    city: input.city,
    state: input.state,
    address: input.address || null,
    features: buildFeatures(input),
    publishedAt: publish ? now : null,
    expiresAt,
  };
}

async function upsertSeller(
  tx: Prisma.TransactionClient,
  auth: MarketplaceAuthContext,
  input: CreateVehicleInput
): Promise<Seller> {
  const existing = await tx.seller.findUnique({ where: { userId: auth.appUser.id } });
  if (existing) {
    return tx.seller.update({
      where: { id: existing.id },
      data: {
        sellerType: input.sellerType,
        dealerName: input.sellerType === "DEALER" ? input.dealerName : null,
        dealerRegNumber: input.sellerType === "DEALER" ? input.dealerRegNumber : null,
        dealerWebsite: input.dealerWebsite || null,
      },
    });
  }
  return tx.seller.create({
    data: {
      userId: auth.appUser.id,
      sellerType: input.sellerType,
      dealerName: input.sellerType === "DEALER" ? input.dealerName : null,
      dealerRegNumber: input.sellerType === "DEALER" ? input.dealerRegNumber : null,
      dealerWebsite: input.dealerWebsite || null,
    },
  });
}

/** Create listing + seller profile in a single transaction. */
export async function createVehicleListing(auth: MarketplaceAuthContext, input: CreateVehicleInput) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: auth.appUser.id },
      data: {
        name: input.sellerName,
        phone: input.phone,
        email: input.email || undefined,
        phoneVerified: input.phoneVerified,
      },
    });

    const seller = await upsertSeller(tx, auth, input);

    // Unique registration per city
    const duplicate = await tx.vehicle.findFirst({
      where: {
        registrationNumber: input.registrationNumber.toUpperCase(),
        city: input.city,
        status: { in: ["ACTIVE", "INACTIVE"] },
      },
    });
    if (duplicate) {
      throw new ApiHttpError(
        409,
        "duplicate_registration",
        "A listing with this registration number already exists in this city"
      );
    }

    const vehicle = await tx.vehicle.create({
      data: mapVehicleData(input, seller.id, auth.appUser.id, input.publish),
    });

    if (input.media.length > 0) {
      const saved = await saveListingMedia(vehicle.id, input.media);
      await tx.vehicleImage.createMany({
        data: saved.map((m) => ({
          vehicleId: vehicle.id,
          url: m.url,
          type: m.type,
          order: m.order,
          isThumb: m.isThumb,
        })),
      });
    }

    logVehicleApi("listing_created", {
      listingId: vehicle.id,
      userId: auth.appUser.id,
      publish: input.publish,
    });

    await maybeEnqueueScrapingJob(vehicle.id, "create");

    return {
      listingId: vehicle.id,
      status: vehicle.status,
      expiresAt: vehicle.expiresAt?.toISOString() ?? null,
    };
  });
}

/** Public GET — increments view count. */
export async function getVehiclePublic(listingId: string, incrementViews = true) {
  const prisma = getPrisma();

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: listingId },
    include: {
      images: { orderBy: { order: "asc" } },
      seller: {
        include: {
          user: { select: { id: true, name: true, phone: true, phoneVerified: true, email: true } },
        },
      },
    },
  });

  if (!vehicle) {
    throw new ApiHttpError(404, "not_found", "Listing not found");
  }

  if (incrementViews && vehicle.status === "ACTIVE") {
    await prisma.vehicle.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    });
    vehicle.viewCount += 1;
  }

  return serializeListing(vehicle);
}

/** Batch fetch for comparison — does not increment view counts. */
export async function getVehiclesForCompare(listingIds: string[]) {
  const unique = [...new Set(listingIds.filter(Boolean))].slice(0, 4);
  if (!unique.length) return [];

  const prisma = getPrisma();
  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: unique }, status: "ACTIVE" },
    include: {
      images: { orderBy: { order: "asc" } },
      seller: {
        include: {
          user: { select: { id: true, name: true, phone: true, phoneVerified: true, email: true } },
        },
      },
    },
  });

  const byId = new Map(vehicles.map((v) => [v.id, serializeListing(v)]));
  return unique.map((id) => byId.get(id)).filter(Boolean) as ReturnType<typeof serializeListing>[];
}

/** Seller update — immutable: registrationNumber, yearOfManufacture. */
export async function updateVehicleListing(
  listingId: string,
  appUserId: string,
  input: UpdateVehicleInput
) {
  const prisma = getPrisma();
  const existing = await prisma.vehicle.findUnique({ where: { id: listingId } });
  if (!existing) throw new ApiHttpError(404, "not_found", "Listing not found");
  if (existing.userId !== appUserId) throw new ApiHttpError(403, "forbidden", "You do not own this listing");

  return prisma.$transaction(async (tx) => {
    const data: Prisma.VehicleUpdateInput = {};

    if (input.description !== undefined) data.description = input.description;
    if (input.priceNegotiable !== undefined) data.priceNegotiable = input.priceNegotiable;
    if (input.askingPrice !== undefined) {
      const price = Number(String(input.askingPrice).replace(/,/g, ""));
      if (price < 10_000) throw new ApiHttpError(400, "invalid_price", "Price too low");
      data.askingPrice = BigInt(price);
    }
    if (input.status !== undefined) data.status = input.status;

    const updated = await tx.vehicle.update({ where: { id: listingId }, data });

    if (input.askingPrice !== undefined && existing.askingPrice !== updated.askingPrice) {
      const { processPriceAlertsForVehicle } = await import("@/lib/wishlist/alerts");
      await processPriceAlertsForVehicle(
        listingId,
        Number(updated.askingPrice),
        Number(existing.askingPrice)
      );
    }

    if (input.media?.length) {
      await tx.vehicleImage.deleteMany({ where: { vehicleId: listingId } });
      const saved = await saveListingMedia(listingId, input.media);
      await tx.vehicleImage.createMany({
        data: saved.map((m) => ({
          vehicleId: listingId,
          url: m.url,
          type: m.type,
          order: m.order,
          isThumb: m.isThumb,
        })),
      });
    }

    await maybeEnqueueScrapingJob(listingId, "update");
    logVehicleApi("listing_updated", { listingId, userId: appUserId });

    return {
      listingId: updated.id,
      status: updated.status,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    };
  });
}

export async function softDeleteListing(listingId: string, appUserId: string) {
  const prisma = getPrisma();
  const existing = await prisma.vehicle.findUnique({ where: { id: listingId } });
  if (!existing) throw new ApiHttpError(404, "not_found", "Listing not found");
  if (existing.userId !== appUserId) throw new ApiHttpError(403, "forbidden", "You do not own this listing");

  const updated = await prisma.vehicle.update({
    where: { id: listingId },
    data: { status: "INACTIVE" },
  });

  logVehicleApi("listing_soft_deleted", { listingId, userId: appUserId });
  return { listingId: updated.id, status: updated.status };
}

function parseBodyTypeFromFeatures(features: string): string | null {
  try {
    const arr = JSON.parse(features) as string[];
    const body = arr.find((f) => f.startsWith("body:"));
    return body ? body.replace("body:", "") : null;
  } catch {
    return null;
  }
}

function parseContactFromFeatures(features: string) {
  try {
    const arr = JSON.parse(features) as string[];
    return {
      contactCall: arr.includes("call"),
      contactWhatsApp: arr.includes("whatsapp"),
      contactEmail: arr.includes("email"),
      amenities: arr.filter((f) => f.startsWith("amenity:")).map((f) => f.replace("amenity:", "")),
    };
  } catch {
    return { contactCall: true, contactWhatsApp: true, contactEmail: false, amenities: [] as string[] };
  }
}

export async function getSimilarListings(listingId: string, limit = 5) {
  const prisma = getPrisma();
  const source = await prisma.vehicle.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      brand: true,
      vehicleType: true,
      city: true,
      fuelType: true,
      askingPrice: true,
    },
  });
  if (!source) return [];

  const price = Number(source.askingPrice);
  const priceMin = BigInt(Math.floor(price * 0.75));
  const priceMax = BigInt(Math.ceil(price * 1.25));

  const similar = await prisma.vehicle.findMany({
    where: {
      id: { not: listingId },
      status: "ACTIVE",
      vehicleType: source.vehicleType,
      OR: [
        { brand: source.brand },
        { city: source.city },
        { fuelType: source.fuelType },
        { askingPrice: { gte: priceMin, lte: priceMax } },
      ],
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      seller: { include: { user: { select: { phoneVerified: true } } } },
    },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });

  return similar.map((v) => ({
    listingId: v.id,
    vehicleType: v.vehicleType,
    brand: v.brand,
    model: v.model,
    yearOfManufacture: v.yearOfManufacture,
    askingPrice: v.askingPrice.toString(),
    city: v.city,
    state: v.state,
    fuelType: v.fuelType,
    transmission: v.transmission,
    currentMileage: v.currentMileage,
    ownerType: v.ownerType,
    condition: v.condition,
    bodyType: parseBodyTypeFromFeatures(v.features),
    viewCount: v.viewCount,
    publishedAt: v.publishedAt?.toISOString() ?? null,
    imageCount: 0,
    thumbnail: v.images[0]?.url ?? null,
    verified: v.seller.user.phoneVerified,
    sellerType: v.seller.sellerType,
    rating: Number(v.seller.ratings),
    reviewCount: v.seller.totalReviews,
  }));
}

function searchOrderBy(sort: string): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ askingPrice: "asc" }];
    case "price_desc":
      return [{ askingPrice: "desc" }];
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "popular":
      return [{ viewCount: "desc" }, { inquiryCount: "desc" }];
    case "mileage":
      return [{ currentMileage: "asc" }];
    default:
      return [{ viewCount: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function searchMarketplaceListings(opts: {
  page: number;
  pageSize: number;
  sort: string;
  vehicleTypes?: ("CAR" | "BIKE")[];
  priceMin?: number;
  priceMax?: number;
  city?: string;
  fuelTypes?: string[];
  transmissions?: string[];
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  bodyTypes?: string[];
  ownerTypes?: string[];
  conditions?: string[];
  sellerTypes?: ("INDIVIDUAL" | "DEALER")[];
  featured?: boolean;
  recent?: boolean;
  q?: string;
}) {
  const prisma = getPrisma();
  const and: Prisma.VehicleWhereInput[] = [{ status: "ACTIVE" }];

  if (opts.vehicleTypes?.length) {
    and.push({ vehicleType: { in: opts.vehicleTypes } });
  }
  if (opts.priceMin !== undefined || opts.priceMax !== undefined) {
    and.push({
      askingPrice: {
        ...(opts.priceMin !== undefined ? { gte: BigInt(opts.priceMin) } : {}),
        ...(opts.priceMax !== undefined ? { lte: BigInt(opts.priceMax) } : {}),
      },
    });
  }
  if (opts.city) {
    and.push({ city: opts.city });
  }
  if (opts.fuelTypes?.length) {
    and.push({ fuelType: { in: opts.fuelTypes } });
  }
  if (opts.transmissions?.length) {
    and.push({ transmission: { in: opts.transmissions } });
  }
  if (opts.ownerTypes?.length) {
    and.push({ ownerType: { in: opts.ownerTypes } });
  }
  if (opts.conditions?.length) {
    and.push({ condition: { in: opts.conditions } });
  }
  if (opts.yearMin !== undefined || opts.yearMax !== undefined) {
    and.push({
      yearOfManufacture: {
        ...(opts.yearMin !== undefined ? { gte: opts.yearMin } : {}),
        ...(opts.yearMax !== undefined ? { lte: opts.yearMax } : {}),
      },
    });
  }
  if (opts.mileageMin !== undefined || opts.mileageMax !== undefined) {
    and.push({
      currentMileage: {
        ...(opts.mileageMin !== undefined ? { gte: opts.mileageMin } : {}),
        ...(opts.mileageMax !== undefined ? { lte: opts.mileageMax } : {}),
      },
    });
  }
  if (opts.sellerTypes?.length) {
    and.push({ seller: { sellerType: { in: opts.sellerTypes } } });
  }
  if (opts.recent) {
    and.push({ publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
  }
  if (opts.bodyTypes?.length) {
    and.push({
      OR: opts.bodyTypes.map((bt) => ({ features: { contains: `body:${bt}` } })),
    });
  }
  if (opts.q?.trim()) {
    const term = opts.q.trim();
    and.push({
      OR: [{ brand: { contains: term } }, { model: { contains: term } }],
    });
  }

  const where: Prisma.VehicleWhereInput = { AND: and };
  const orderBy = opts.featured
    ? [{ viewCount: "desc" as const }, { publishedAt: "desc" as const }]
    : searchOrderBy(opts.sort);

  const [total, items] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" } },
        seller: { include: { user: { select: { phoneVerified: true } } } },
      },
      orderBy,
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);

  return {
    items: items.map((v) => ({
      listingId: v.id,
      vehicleType: v.vehicleType,
      brand: v.brand,
      model: v.model,
      yearOfManufacture: v.yearOfManufacture,
      askingPrice: v.askingPrice.toString(),
      city: v.city,
      state: v.state,
      fuelType: v.fuelType,
      transmission: v.transmission,
      currentMileage: v.currentMileage,
      ownerType: v.ownerType,
      condition: v.condition,
      bodyType: parseBodyTypeFromFeatures(v.features),
      viewCount: v.viewCount,
      publishedAt: v.publishedAt?.toISOString() ?? null,
      imageCount: v.images.filter((i) => i.type === "PHOTO").length,
      thumbnail: v.images.find((i) => i.isThumb)?.url ?? v.images[0]?.url ?? null,
      verified: v.seller.user.phoneVerified,
      sellerType: v.seller.sellerType,
      rating: Number(v.seller.ratings),
      reviewCount: v.seller.totalReviews,
    })),
    meta: {
      total,
      page: opts.page,
      pageSize: opts.pageSize,
      totalPages: Math.max(1, Math.ceil(total / opts.pageSize)),
      from: total === 0 ? 0 : (opts.page - 1) * opts.pageSize + 1,
      to: Math.min(opts.page * opts.pageSize, total),
    },
  };
}

export async function getMyListings(
  appUserId: string,
  opts: {
    page: number;
    pageSize: number;
    sort: "createdAt" | "askingPrice" | "viewCount";
    order: "asc" | "desc";
    status?: "ACTIVE" | "INACTIVE" | "SOLD" | "EXPIRED" | "all";
  }
) {
  const prisma = getPrisma();
  const where: Prisma.VehicleWhereInput = {
    userId: appUserId,
    ...(opts.status && opts.status !== "all" ? { status: opts.status } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { [opts.sort]: opts.order },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);

  return {
    items: items.map((v) => ({
      listingId: v.id,
      brand: v.brand,
      model: v.model,
      status: v.status,
      askingPrice: v.askingPrice.toString(),
      city: v.city,
      viewCount: v.viewCount,
      thumbnail: v.images[0]?.url ?? null,
      createdAt: v.createdAt.toISOString(),
      publishedAt: v.publishedAt?.toISOString() ?? null,
      expiresAt: v.expiresAt?.toISOString() ?? null,
    })),
    meta: {
      total,
      page: opts.page,
      pageSize: opts.pageSize,
      totalPages: Math.ceil(total / opts.pageSize),
    },
  };
}

export async function getDraftListings(appUserId: string) {
  const prisma = getPrisma();
  const drafts = await prisma.vehicle.findMany({
    where: {
      userId: appUserId,
      status: "INACTIVE",
      publishedAt: null,
    },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  return drafts.map((v) => ({
    listingId: v.id,
    brand: v.brand,
    model: v.model,
    askingPrice: v.askingPrice.toString(),
    thumbnail: v.images[0]?.url ?? null,
    updatedAt: v.updatedAt.toISOString(),
  }));
}

export async function publishListing(listingId: string, appUserId: string) {
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: listingId },
    include: { images: true, user: true },
  });

  if (!vehicle) throw new ApiHttpError(404, "not_found", "Listing not found");
  if (vehicle.userId !== appUserId) throw new ApiHttpError(403, "forbidden", "You do not own this listing");
  if (vehicle.status === "SOLD") {
    throw new ApiHttpError(400, "already_sold", "Sold listings cannot be republished");
  }

  const photos = vehicle.images.filter((i) => i.type === "PHOTO");
  if (photos.length < 5) {
    throw new ApiHttpError(400, "insufficient_media", "Add at least 5 photos before publishing");
  }
  if (!vehicle.user.phoneVerified) {
    throw new ApiHttpError(400, "phone_unverified", "Verify your phone number before publishing");
  }

  const now = new Date();
  const updated = await prisma.vehicle.update({
    where: { id: listingId },
    data: {
      status: "ACTIVE",
      publishedAt: now,
      expiresAt: new Date(now.getTime() + LISTING_TTL_MS),
    },
  });

  logVehicleApi("listing_published", { listingId, userId: appUserId });
  return {
    listingId: updated.id,
    status: updated.status,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
  };
}

export async function markListingSold(listingId: string, appUserId: string) {
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: listingId } });
  if (!vehicle) throw new ApiHttpError(404, "not_found", "Listing not found");
  if (vehicle.userId !== appUserId) throw new ApiHttpError(403, "forbidden", "You do not own this listing");

  const updated = await prisma.vehicle.update({
    where: { id: listingId },
    data: { status: "SOLD", soldAt: new Date() },
  });

  logVehicleApi("listing_marked_sold", { listingId, userId: appUserId });
  return { listingId: updated.id, status: updated.status, soldAt: updated.soldAt?.toISOString() ?? null };
}

export async function verifySellerPhone(appUserId: string, phone: string) {
  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: appUserId },
    data: { phone, phoneVerified: true },
  });
  logVehicleApi("phone_verified", { userId: appUserId });
  return { phoneVerified: true };
}

function serializeListing(
  vehicle: Vehicle & {
    images: VehicleImage[];
    seller: Seller & {
      user: {
        id: string;
        name: string | null;
        phone: string | null;
        phoneVerified: boolean;
        email: string | null;
      };
    };
  }
) {
  const parsed = parseContactFromFeatures(vehicle.features);
  const bodyType = parseBodyTypeFromFeatures(vehicle.features);

  return {
    listingId: vehicle.id,
    vehicleType: vehicle.vehicleType,
    brand: vehicle.brand,
    model: vehicle.model,
    yearOfManufacture: vehicle.yearOfManufacture,
    registrationNumber: vehicle.registrationNumber,
    color: vehicle.color,
    bodyType,
    condition: vehicle.condition,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    engineCC: vehicle.engineCC,
    power: vehicle.power,
    torque: vehicle.torque,
    currentMileage: vehicle.currentMileage,
    ownerType: vehicle.ownerType,
    insuranceValid: vehicle.insuranceValid,
    insuranceValidTill: vehicle.insuranceValidTill?.toISOString() ?? null,
    pollutionCertValid: vehicle.pollutionCertValid,
    pollutionCertValidTill: vehicle.pollutionCertValidTill?.toISOString() ?? null,
    serviceHistoryAvail: vehicle.serviceHistoryAvail,
    accidentHistory: vehicle.accidentHistory,
    accidentDescription: vehicle.accidentDescription,
    modifications: vehicle.modifications,
    askingPrice: vehicle.askingPrice.toString(),
    priceNegotiable: vehicle.priceNegotiable,
    description: vehicle.description,
    status: vehicle.status,
    city: vehicle.city,
    state: vehicle.state,
    address: vehicle.address,
    viewCount: vehicle.viewCount,
    inquiryCount: vehicle.inquiryCount,
    amenities: parsed.amenities,
    contactChannels: {
      call: parsed.contactCall,
      whatsapp: parsed.contactWhatsApp,
      email: parsed.contactEmail,
    },
    publishedAt: vehicle.publishedAt?.toISOString() ?? null,
    expiresAt: vehicle.expiresAt?.toISOString() ?? null,
    soldAt: vehicle.soldAt?.toISOString() ?? null,
    images: vehicle.images.map((i) => ({
      id: i.id,
      url: i.url,
      type: i.type,
      order: i.order,
      isThumb: i.isThumb,
    })),
    seller: {
      id: vehicle.seller.id,
      sellerType: vehicle.seller.sellerType,
      dealerName: vehicle.seller.dealerName,
      ratings: Number(vehicle.seller.ratings),
      totalReviews: vehicle.seller.totalReviews,
      memberSince: vehicle.seller.memberSince.toISOString(),
      avgResponseMinutes: 30,
      contact: {
        name: vehicle.seller.user.name,
        phoneVerified: vehicle.seller.user.phoneVerified,
        emailVerified: Boolean(vehicle.seller.user.email),
        phoneMasked: vehicle.seller.user.phone
          ? `******${vehicle.seller.user.phone.slice(-4)}`
          : null,
      },
    },
  };
}

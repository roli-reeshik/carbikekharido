import { getPrisma } from "@/lib/sell/server/listingRepo";
import { ApiHttpError } from "@/lib/vehicles/api/responses";

export type WishlistSort = "saved" | "price_asc" | "price_desc";

function parseBodyType(features: string): string | null {
  try {
    const arr = JSON.parse(features) as string[];
    const body = arr.find((f) => f.startsWith("body:"));
    return body ? body.replace("body:", "") : null;
  } catch {
    return null;
  }
}

export async function addToWishlist(userId: string, vehicleId: string) {
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.status !== "ACTIVE") {
    throw new ApiHttpError(404, "not_found", "Listing not found or unavailable");
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_vehicleId: { userId, vehicleId } },
  });

  if (existing) {
    await prisma.wishlist.update({
      where: { id: existing.id },
      data: { savedAt: new Date() },
    });
  } else {
    await prisma.wishlist.create({ data: { userId, vehicleId } });
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { savedCount: { increment: 1 } },
    });
  }

  const count = await prisma.wishlist.count({ where: { userId } });
  return { success: true, count };
}

export async function removeFromWishlist(userId: string, vehicleId: string) {
  const prisma = getPrisma();
  const deleted = await prisma.wishlist.deleteMany({ where: { userId, vehicleId } });
  if (deleted.count > 0) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { savedCount: { decrement: 1 } },
    }).catch(() => null);
  }
  const count = await prisma.wishlist.count({ where: { userId } });
  return { success: true, count };
}

export async function getWishlistForUser(userId: string, sort: WishlistSort = "saved") {
  const prisma = getPrisma();
  const orderBy =
    sort === "price_asc"
      ? ({ vehicle: { askingPrice: "asc" as const } } as const)
      : sort === "price_desc"
        ? ({ vehicle: { askingPrice: "desc" as const } } as const)
        : ({ savedAt: "desc" as const } as const);

  const rows = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      vehicle: {
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          seller: { include: { user: { select: { phoneVerified: true } } } },
        },
      },
    },
    orderBy,
  });

  const alerts = await prisma.priceAlert.findMany({
    where: { userId, isActive: true },
  });
  const alertByVehicle = new Map(alerts.map((a) => [a.vehicleId, a]));

  const items = rows
    .filter((r) => r.vehicle.status === "ACTIVE")
    .map((r) => {
      const v = r.vehicle;
      const alert = alertByVehicle.get(v.id);
      return {
        wishlistId: r.id,
        savedAt: r.savedAt.toISOString(),
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
        bodyType: parseBodyType(v.features),
        thumbnail: v.images[0]?.url ?? null,
        verified: v.seller.user.phoneVerified,
        sellerType: v.seller.sellerType,
        priceAlert: alert
          ? { id: alert.id, maxPrice: alert.maxPrice.toString(), isActive: alert.isActive }
          : null,
      };
    });

  return { items, count: items.length };
}

export async function setPriceAlert(userId: string, vehicleId: string, maxPrice: number) {
  const prisma = getPrisma();
  if (maxPrice < 10_000 || maxPrice > 999_999_999) {
    throw new ApiHttpError(400, "invalid_price", "maxPrice must be between ₹10,000 and ₹99,99,99,999");
  }

  const onWishlist = await prisma.wishlist.findUnique({
    where: { userId_vehicleId: { userId, vehicleId } },
  });
  if (!onWishlist) {
    throw new ApiHttpError(400, "not_in_wishlist", "Add listing to wishlist before setting a price alert");
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new ApiHttpError(404, "not_found", "Listing not found");

  const existing = await prisma.priceAlert.findFirst({
    where: { userId, vehicleId, isActive: true },
  });

  const alert = existing
    ? await prisma.priceAlert.update({
        where: { id: existing.id },
        data: { maxPrice: BigInt(maxPrice), isActive: true },
      })
    : await prisma.priceAlert.create({
        data: {
          userId,
          vehicleId,
          maxPrice: BigInt(maxPrice),
          isActive: true,
        },
      });

  return {
    alertId: alert.id,
    maxPrice: alert.maxPrice.toString(),
    isActive: alert.isActive,
    triggered: Number(vehicle.askingPrice) <= maxPrice,
  };
}

/** Merge anonymous local ids into authenticated wishlist. */
export async function mergeWishlistIds(userId: string, listingIds: string[]) {
  let added = 0;
  for (const id of listingIds.slice(0, 50)) {
    try {
      await addToWishlist(userId, id);
      added++;
    } catch {
      /* skip invalid */
    }
  }
  const count = (await getWishlistForUser(userId)).count;
  return { merged: added, count };
}

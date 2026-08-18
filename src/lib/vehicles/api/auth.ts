import { NextRequest } from "next/server";
import { Seller, User } from "@prisma/client";
import { getUserIdFromRequest } from "@/lib/auth/requestAuth";
import { getUserById } from "@/lib/db/usersRepo";
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { ApiHttpError } from "./responses";

export interface MarketplaceAuthContext {
  /** Prisma app_users row (marketplace module). */
  appUser: User;
  seller: Seller | null;
  /** Legacy MySQL users.id from OTP session. */
  legacyUserId: number;
  phone: string;
}

/**
 * Resolves the marketplace user from the Bearer session token.
 * Bridges legacy `users` + `sessions` tables to Prisma `app_users`.
 */
export async function requireMarketplaceAuth(req: NextRequest): Promise<MarketplaceAuthContext> {
  const legacyUserId = await getUserIdFromRequest(req);
  if (!legacyUserId) {
    throw new ApiHttpError(401, "unauthorized", "Authentication required — sign in with OTP");
  }

  const dbUser = await getUserById(legacyUserId);
  if (!dbUser) {
    throw new ApiHttpError(401, "unauthorized", "Session user not found");
  }

  const prisma = getPrisma();
  let appUser = await prisma.user.findFirst({ where: { phone: dbUser.phone } });

  if (!appUser) {
    appUser = await prisma.user.create({
      data: {
        phone: dbUser.phone,
        name: dbUser.name,
        phoneVerified: true,
      },
    });
  }

  const seller = await prisma.seller.findUnique({ where: { userId: appUser.id } });

  return { appUser, seller, legacyUserId, phone: dbUser.phone };
}

/** Ensures listing belongs to authenticated seller. */
export async function requireListingOwnership(listingId: string, appUserId: string) {
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: listingId },
    include: { seller: true, images: { orderBy: { order: "asc" } } },
  });

  if (!vehicle) {
    throw new ApiHttpError(404, "not_found", "Listing not found");
  }
  if (vehicle.userId !== appUserId) {
    throw new ApiHttpError(403, "forbidden", "You do not own this listing");
  }

  return vehicle;
}

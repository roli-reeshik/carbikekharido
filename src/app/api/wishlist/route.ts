import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { getWishlistForUser, WishlistSort } from "@/lib/wishlist/service";
import { wishlistQuerySchema } from "@/lib/wishlist/validation";

export const runtime = "nodejs";

/** GET /api/wishlist */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "wishlist/get", 60, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const parsed = wishlistQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const sort = (parsed.success ? parsed.data.sort : "saved") as WishlistSort;
    const result = await getWishlistForUser(auth.appUser.id, sort);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

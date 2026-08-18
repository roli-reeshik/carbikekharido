import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { removeFromWishlist } from "@/lib/wishlist/service";
import { removeWishlistSchema, resolveVehicleId } from "@/lib/wishlist/validation";

export const runtime = "nodejs";

/** DELETE /api/wishlist/remove */
export async function DELETE(req: NextRequest) {
  try {
    checkRateLimit(req, "wishlist/remove", 30, 60_000);
    const auth = await requireMarketplaceAuth(req);

    let vehicleId = req.nextUrl.searchParams.get("vehicleId") ?? req.nextUrl.searchParams.get("listingId");
    if (!vehicleId) {
      const body = await parseJsonBody(req).catch(() => ({}));
      const parsed = removeWishlistSchema.safeParse(body);
      if (parsed.success) vehicleId = resolveVehicleId(parsed.data);
    }
    if (!vehicleId) return apiError("validation_failed", "vehicleId required", 400);

    const result = await removeFromWishlist(auth.appUser.id, vehicleId);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

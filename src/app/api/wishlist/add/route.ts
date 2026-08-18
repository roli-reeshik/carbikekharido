import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { addToWishlist } from "@/lib/wishlist/service";
import { addWishlistSchema, resolveVehicleId } from "@/lib/wishlist/validation";

export const runtime = "nodejs";

/** POST /api/wishlist/add */
export async function POST(req: NextRequest) {
  try {
    checkRateLimit(req, "wishlist/add", 30, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const body = await parseJsonBody(req);
    const parsed = addWishlistSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid body — provide vehicleId", 400);
    }
    const vehicleId = resolveVehicleId(parsed.data);
    if (!vehicleId) return apiError("validation_failed", "vehicleId required", 400);

    const result = await addToWishlist(auth.appUser.id, vehicleId);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { mergeWishlistIds } from "@/lib/wishlist/service";
import { z } from "zod";

export const runtime = "nodejs";

const mergeSchema = z.object({
  listingIds: z.array(z.string()).max(50),
});

/** POST /api/wishlist/merge — merge localStorage ids after login */
export async function POST(req: NextRequest) {
  try {
    checkRateLimit(req, "wishlist/merge", 10, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const body = await parseJsonBody(req);
    const parsed = mergeSchema.safeParse(body);
    if (!parsed.success) return apiError("validation_failed", "listingIds array required", 400);
    const result = await mergeWishlistIds(auth.appUser.id, parsed.data.listingIds);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

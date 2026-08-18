import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { setPriceAlert } from "@/lib/wishlist/service";
import { priceAlertSchema } from "@/lib/wishlist/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

/** POST /api/wishlist/[id]/alert */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "wishlist/alert", 20, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const p = await Promise.resolve(context.params);
    const body = await parseJsonBody(req);
    const parsed = priceAlertSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("validation_failed", "maxPrice is required and must be a valid number", 400);
    }

    const result = await setPriceAlert(auth.appUser.id, p.id, parsed.data.maxPrice);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

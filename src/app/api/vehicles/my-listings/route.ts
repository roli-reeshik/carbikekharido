import { NextRequest } from "next/server";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { getMyListings } from "@/lib/vehicles/api/service";
import { parseListQuery, zodFieldErrors } from "@/lib/vehicles/api/validation";

export const runtime = "nodejs";

/**
 * GET /api/vehicles/my-listings
 * Paginated seller dashboard — all listing statuses.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "vehicles/my-listings", 60, 60_000);
    const auth = await requireMarketplaceAuth(req);

    const parsed = parseListQuery(req.nextUrl.searchParams);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid query parameters", 400, zodFieldErrors(parsed.error));
    }

    const result = await getMyListings(auth.appUser.id, parsed.data);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

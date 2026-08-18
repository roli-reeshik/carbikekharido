import { NextRequest } from "next/server";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { getDraftListings } from "@/lib/vehicles/api/service";

export const runtime = "nodejs";

/**
 * GET /api/vehicles/draft
 * Returns unpublished draft listings for the authenticated seller.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "vehicles/draft", 60, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const drafts = await getDraftListings(auth.appUser.id);
    return apiSuccess({ drafts });
  } catch (err) {
    return apiFromError(err);
  }
}

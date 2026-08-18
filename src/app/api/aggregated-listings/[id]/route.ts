import { NextRequest } from "next/server";
import { getAggregatedListingById } from "@/lib/aggregated/service";
import { apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/aggregated-listings/[id]
 * Single aggregated listing — increments viewCount.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(req, "aggregated-listings/detail", 120, 60_000);
    const { id } = await params;
    const skipView = req.nextUrl.searchParams.get("skipView") === "true";
    const listing = await getAggregatedListingById(id, !skipView);
    return apiSuccess(listing);
  } catch (err) {
    return apiFromError(err);
  }
}

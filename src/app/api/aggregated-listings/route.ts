import { NextRequest } from "next/server";
import { searchAggregatedListings } from "@/lib/aggregated/service";
import {
  parseAggregatedListQuery,
  zodFieldErrors,
} from "@/lib/aggregated/validation";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/aggregated-listings
 * Cached scrape listings — city, price, source, type filters. 20 per page.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "aggregated-listings", 120, 60_000);

    const parsed = parseAggregatedListQuery(req.nextUrl.searchParams);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid query parameters", 400, zodFieldErrors(parsed.error));
    }

    const { sources, categories, ...rest } = parsed.data;

    const result = await searchAggregatedListings({
      ...rest,
      sources,
      categories,
    });

    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

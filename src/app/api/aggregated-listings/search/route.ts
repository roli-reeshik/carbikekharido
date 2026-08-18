import { NextRequest } from "next/server";
import { searchUnifiedListings } from "@/lib/aggregated/service";
import {
  parseAggregatedSearchQuery,
  zodFieldErrors,
} from "@/lib/aggregated/validation";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/aggregated-listings/search
 * Advanced search — all marketplace filters + source / aggregated-only / merge toggles.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "aggregated-listings/search", 120, 60_000);

    const parsed = parseAggregatedSearchQuery(req.nextUrl.searchParams);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid query parameters", 400, zodFieldErrors(parsed.error));
    }

    const {
      sources,
      categories,
      conditions,
      fuelTypes,
      transmissions,
      bodyTypes,
      ownerTypes,
      sellerTypes,
      aggregatedOnly,
      merge,
      ...rest
    } = parsed.data;

    const result = await searchUnifiedListings({
      ...rest,
      sources,
      categories,
      conditions,
      fuelTypes,
      transmissions,
      bodyTypes,
      ownerTypes,
      sellerTypes: sellerTypes?.map((s) => s.toUpperCase() as "INDIVIDUAL" | "DEALER"),
      aggregatedOnly,
      merge,
    });

    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

import { NextRequest } from "next/server";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { searchMarketplaceListings } from "@/lib/vehicles/api/service";
import { parseSearchQuery, zodFieldErrors } from "@/lib/vehicles/api/validation";

export const runtime = "nodejs";

/**
 * GET /api/vehicles/search
 * Public marketplace search — active listings only.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "vehicles/search", 120, 60_000);

    const parsed = parseSearchQuery(req.nextUrl.searchParams);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid query parameters", 400, zodFieldErrors(parsed.error));
    }

    const { vehicleTypes, fuelTypes, transmissions, bodyTypes, ownerTypes, conditions, sellerTypes, ...rest } =
      parsed.data;

    const result = await searchMarketplaceListings({
      ...rest,
      vehicleTypes,
      fuelTypes,
      transmissions,
      bodyTypes,
      ownerTypes,
      conditions,
      sellerTypes,
    });

    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

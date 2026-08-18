import { NextRequest } from "next/server";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { getVehiclesForCompare } from "@/lib/vehicles/api/service";

export const runtime = "nodejs";

/**
 * GET /api/vehicles/compare?ids=id1,id2,id3
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "vehicles/compare", 60, 60_000);
    const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      return apiError("validation_failed", "Provide at least one listing id via ids=", 400);
    }
    if (ids.length > 4) {
      return apiError("validation_failed", "Maximum 4 listings per comparison", 400);
    }

    const listings = await getVehiclesForCompare(ids);
    return apiSuccess({ listings });
  } catch (err) {
    return apiFromError(err);
  }
}

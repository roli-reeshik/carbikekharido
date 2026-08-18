import { NextRequest } from "next/server";
import { rankBikesForRider } from "@/lib/riderFit/service";
import { parseRiderFitQuery, splitRiderFitQuery, zodFieldErrors } from "@/lib/riderFit/validation";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/rider-fit
 *
 * Ranks two-wheelers by whether the rider can physically ride them — reach to
 * the ground, ability to hold the bike up, and riding position against intent.
 * Requires `heightCm`; everything else is optional and sharpens the estimate.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "rider-fit", 120, 60_000);

    const parsed = parseRiderFitQuery(req.nextUrl.searchParams);
    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid rider profile",
        400,
        zodFieldErrors(parsed.error)
      );
    }

    const { profile, filters } = splitRiderFitQuery(parsed.data);
    const result = await rankBikesForRider(profile, filters);

    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

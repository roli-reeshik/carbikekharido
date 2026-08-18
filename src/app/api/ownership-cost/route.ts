import { NextRequest } from "next/server";
import { compareOwnershipCosts, rankByOwnershipCost } from "@/lib/ownership/service";
import { parseOwnershipQuery, splitOwnershipQuery } from "@/lib/ownership/validation";
import { zodFieldErrors } from "@/lib/riderFit/validation";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/ownership-cost
 *
 * What a two-wheeler costs to own over a period, counting the on-road price,
 * fuel or charging, servicing, wear items, insurance, battery replacement and
 * the resale value recovered at the end.
 *
 * Pass `models` as a comma-separated list of catalog model ids to compare
 * specific bikes; omit it to get the cheapest to own under the given usage.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "ownership-cost", 120, 60_000);

    const parsed = parseOwnershipQuery(req.nextUrl.searchParams);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid usage profile", 400, zodFieldErrors(parsed.error));
    }

    const { usage, modelIds, filters } = splitOwnershipQuery(parsed.data);

    const result = modelIds.length
      ? await compareOwnershipCosts(modelIds, usage)
      : await rankByOwnershipCost(usage, filters);

    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

import { NextRequest } from "next/server";
import { searchBikeSpecs } from "@/lib/ownership/service";
import { apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";

export const runtime = "nodejs";

/**
 * GET /api/bike-specs/search?q=activa
 *
 * Typeahead over the scraped two-wheeler specs. Set `costableOnly=true` to
 * return only models carrying the price and efficiency figures the ownership
 * cost model needs, so a picker cannot offer a bike that then fails to cost.
 */
export async function GET(req: NextRequest) {
  try {
    checkRateLimit(req, "bike-specs-search", 240, 60_000);

    const p = req.nextUrl.searchParams;
    const results = await searchBikeSpecs({
      query: p.get("q") ?? "",
      costableOnly: p.get("costableOnly") === "true",
      limit: Math.min(30, Number(p.get("limit") ?? 12) || 12),
    });

    return apiSuccess({ results });
  } catch (err) {
    return apiFromError(err);
  }
}

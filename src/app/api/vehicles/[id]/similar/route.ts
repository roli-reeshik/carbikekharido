import { NextRequest } from "next/server";
import { apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { getSimilarListings } from "@/lib/vehicles/api/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

/**
 * GET /api/vehicles/[id]/similar
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/similar", 60, 60_000);
    const p = await Promise.resolve(context.params);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 5);
    const items = await getSimilarListings(p.id, Math.min(10, Math.max(1, limit)));
    return apiSuccess({ items });
  } catch (err) {
    return apiFromError(err);
  }
}

import { NextRequest } from "next/server";
import { apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { markListingSold } from "@/lib/vehicles/api/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

/**
 * POST /api/vehicles/[id]/mark-sold
 * Marks listing as SOLD and records soldAt timestamp.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/mark-sold", 20, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const params = await Promise.resolve(context.params);
    const result = await markListingSold(params.id, auth.appUser.id);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

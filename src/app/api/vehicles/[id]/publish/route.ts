import { NextRequest } from "next/server";
import { apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { publishListing } from "@/lib/vehicles/api/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

/**
 * POST /api/vehicles/[id]/publish
 * Activates a draft listing (sets status ACTIVE + publishedAt).
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/publish", 20, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const params = await Promise.resolve(context.params);
    const result = await publishListing(params.id, auth.appUser.id);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

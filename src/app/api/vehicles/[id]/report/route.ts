import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { logVehicleApi } from "@/lib/vehicles/api/logger";

export const runtime = "nodejs";

const reportSchema = z.object({
  reason: z.enum(["spam", "fraud", "wrong_info", "duplicate", "other"]),
  details: z.string().max(1000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

/**
 * POST /api/vehicles/[id]/report
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/report", 10, 60_000);
    const p = await Promise.resolve(context.params);
    const body = await parseJsonBody(req);
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid report payload", 400);
    }

    logVehicleApi("listing_reported", {
      listingId: p.id,
      reason: parsed.data.reason,
      details: parsed.data.details?.slice(0, 200),
    });

    return apiSuccess({ received: true });
  } catch (err) {
    return apiFromError(err);
  }
}

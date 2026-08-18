import { NextRequest } from "next/server";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { createVehicleListing } from "@/lib/vehicles/api/service";
import { parseCreateVehicle, zodFieldErrors } from "@/lib/vehicles/api/validation";
import { logVehicleApi } from "@/lib/vehicles/api/logger";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Accepts flat payload or legacy { draft, media, publish } from sell wizard. */
function normalizeCreateBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  if ("draft" in body) {
    const legacy = body as {
      draft: Record<string, unknown>;
      media?: unknown[];
      publish?: boolean;
    };
    return {
      ...legacy.draft,
      media: legacy.media ?? legacy.draft.media ?? [],
      publish: legacy.publish ?? false,
    };
  }
  return body;
}

/**
 * POST /api/vehicles/create
 * Authenticated sellers submit a complete listing (draft or published).
 */
export async function POST(req: NextRequest) {
  try {
    checkRateLimit(req, "vehicles/create", 20, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const body = await parseJsonBody(req);
    const normalized = normalizeCreateBody(body);

    const parsed = parseCreateVehicle(normalized);
    if (!parsed.success) {
      return apiError("validation_failed", "Validation failed", 400, zodFieldErrors(parsed.error));
    }

    // Ensure submitted phone matches session when verified
    if (parsed.data.phoneVerified && parsed.data.phone !== auth.phone) {
      return apiError(
        "phone_mismatch",
        "Verified phone must match your logged-in number",
        400
      );
    }

    const result = await createVehicleListing(auth, parsed.data);
    logVehicleApi("create_success", { listingId: result.listingId, userId: auth.appUser.id });

    return apiSuccess(result, 201);
  } catch (err) {
    return apiFromError(err);
  }
}

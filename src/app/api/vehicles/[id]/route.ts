import { NextRequest } from "next/server";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import {
  getVehiclePublic,
  softDeleteListing,
  updateVehicleListing,
} from "@/lib/vehicles/api/service";
import { parseUpdateVehicle, zodFieldErrors } from "@/lib/vehicles/api/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

async function listingId(params: RouteContext["params"]) {
  const p = await Promise.resolve(params);
  return p.id;
}

/**
 * GET /api/vehicles/[id] — public listing detail (+ viewCount increment).
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/get", 120, 60_000);
    const id = await listingId(context.params);
    const listing = await getVehiclePublic(id, true);
    return apiSuccess({ listing });
  } catch (err) {
    return apiFromError(err);
  }
}

/**
 * PUT /api/vehicles/[id] — seller updates allowed fields only.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/update", 30, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const id = await listingId(context.params);
    const body = await parseJsonBody(req);

    // Reject attempts to change immutable fields
    const immutable = ["registrationNumber", "yearOfManufacture", "registration_number", "year"];
    for (const key of immutable) {
      if (key in (body as object)) {
        return apiError(
          "immutable_field",
          `Field "${key}" cannot be changed after creation`,
          400
        );
      }
    }

    const parsed = parseUpdateVehicle(body);
    if (!parsed.success) {
      return apiError("validation_failed", "Validation failed", 400, zodFieldErrors(parsed.error));
    }

    const result = await updateVehicleListing(id, auth.appUser.id, parsed.data);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

/**
 * DELETE /api/vehicles/[id] — soft delete (status → INACTIVE).
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/delete", 20, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const id = await listingId(context.params);
    const result = await softDeleteListing(id, auth.appUser.id);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

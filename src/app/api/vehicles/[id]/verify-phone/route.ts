import { NextRequest } from "next/server";
import { verifyOtp } from "@/lib/db/otpRepo";
import { apiError, apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { verifySellerPhone } from "@/lib/vehicles/api/service";
import { verifyPhoneSchema, zodFieldErrors } from "@/lib/vehicles/api/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

/**
 * POST /api/vehicles/[id]/verify-phone
 * Verifies OTP and marks seller phone as verified on app_users.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    checkRateLimit(req, "vehicles/verify-phone", 10, 60_000);
    const auth = await requireMarketplaceAuth(req);
    await Promise.resolve(context.params); // listing id reserved for future audit log
    const body = await parseJsonBody(req);

    const parsed = verifyPhoneSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("validation_failed", "Validation failed", 400, zodFieldErrors(parsed.error));
    }

    if (parsed.data.phone !== auth.phone) {
      return apiError("phone_mismatch", "Phone must match your logged-in number", 400);
    }

    const otpResult = await verifyOtp(parsed.data.phone, parsed.data.code);
    if (otpResult !== "ok") {
      return apiError("invalid_otp", "Invalid or expired OTP", 401);
    }

    const result = await verifySellerPhone(auth.appUser.id, parsed.data.phone);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

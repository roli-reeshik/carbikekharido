import { NextRequest, NextResponse } from "next/server";
import { generateOtp, saveOtp, verifyOtp } from "@/lib/db/otpRepo";
import { smsProvider } from "@/lib/auth/smsProvider";
import { findOrCreateUserByPhone } from "@/lib/db/usersRepo";
import { createSession } from "@/lib/db/sessionsRepo";

/**
 * Still ONE consolidated auth endpoint (see the file-level comment history
 * in the original demo version) — now backed by MySQL instead of process
 * memory, since real accounts/orders require durable storage. The request
 * shape is unchanged, so RegistrationModal.tsx did not need to change at
 * all when this moved from the in-memory demo to a real database.
 *
 * POST body:
 *   { step: "send_otp", phone: string }
 *   { step: "verify_otp", phone: string, code: string }
 */

const PHONE_REGEX = /^[6-9]\d{9}$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("step" in body)) {
    return NextResponse.json({ success: false, error: "invalid_request" }, { status: 400 });
  }

  const { step } = body as { step: string };

  if (step === "send_otp") {
    const { phone } = body as { phone?: string };
    if (!phone || !PHONE_REGEX.test(phone)) {
      return NextResponse.json({ success: false, error: "invalid_phone" }, { status: 400 });
    }

    try {
      const code = generateOtp();
      await saveOtp(phone, code);
      const result = await smsProvider.sendOtpSms(phone, code);
      if (!result.success) {
        return NextResponse.json({ success: false, error: "sms_send_failed" }, { status: 502 });
      }
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("send_otp failed:", err);
      return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
    }
  }

  if (step === "verify_otp") {
    const { phone, code } = body as { phone?: string; code?: string };
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: "invalid_request" }, { status: 400 });
    }

    try {
      const result = await verifyOtp(phone, code);
      if (result !== "ok") {
        return NextResponse.json({ success: false, error: result }, { status: 401 });
      }

      // Lazy account creation — this is the ONLY point a `users` row is
      // written, and it only happens after successful OTP verification
      // (i.e. after the visitor took an intent action). Browsing never
      // reaches this code path.
      const user = await findOrCreateUserByPhone(phone);
      const sessionToken = await createSession(user.id);

      return NextResponse.json({ success: true, token: sessionToken, userId: user.id });
    } catch (err) {
      console.error("verify_otp failed:", err);
      return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: "unknown_step" }, { status: 400 });
}

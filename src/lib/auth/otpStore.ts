/**
 * Demo-grade in-memory OTP store, keyed by phone number.
 * In production this should be a short-TTL store (Redis) rather than
 * process memory, since Next.js server instances can be multiple/ephemeral —
 * but the interface below is what the rest of the app depends on, so
 * swapping the backing store is a one-file change.
 */
interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const store = new Map<string, OtpRecord>();

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function saveOtp(phone: string, code: string) {
  store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
}

export type OtpVerifyResult = "ok" | "expired" | "mismatch" | "too_many_attempts" | "not_found";

export function verifyOtp(phone: string, code: string): OtpVerifyResult {
  const record = store.get(phone);
  if (!record) return "not_found";
  if (Date.now() > record.expiresAt) {
    store.delete(phone);
    return "expired";
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return "too_many_attempts";
  }
  if (record.code !== code) {
    record.attempts += 1;
    return "mismatch";
  }
  store.delete(phone);
  return "ok";
}

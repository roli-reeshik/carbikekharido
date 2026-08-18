import crypto from "crypto";
import { pool } from "./pool";
import { RowDataPacket } from "mysql2";

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * The raw OTP is never stored — only its SHA-256 hash — so a database
 * dump or backup never leaks live codes. This is the one function that
 * writes an OTP record; src/lib/auth/smsProvider.ts is the one function
 * that sends it. The auth route composes the two.
 */
export async function saveOtp(phone: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await pool.query(
    `INSERT INTO otp_verifications (phone, otp_hash, purpose, expires_at)
     VALUES (?, ?, 'registration', ?)`,
    [phone, hashOtp(code), expiresAt]
  );
}

export type OtpVerifyResult = "ok" | "expired" | "mismatch" | "too_many_attempts" | "not_found";

export async function verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, otp_hash, attempts, expires_at, consumed_at
     FROM otp_verifications
     WHERE phone = ? AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone]
  );

  const record = rows[0];
  if (!record) return "not_found";

  if (new Date(record.expires_at) < new Date()) return "expired";
  if (record.attempts >= MAX_ATTEMPTS) return "too_many_attempts";

  if (record.otp_hash !== hashOtp(code)) {
    await pool.query("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?", [record.id]);
    return "mismatch";
  }

  await pool.query("UPDATE otp_verifications SET consumed_at = NOW() WHERE id = ?", [record.id]);
  return "ok";
}

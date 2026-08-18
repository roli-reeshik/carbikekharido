import crypto from "crypto";
import { pool } from "./pool";
import { RowDataPacket } from "mysql2";

const SESSION_TTL_DAYS = 30;

/**
 * Server-verified sessions. The token handed to the browser is just the
 * UUID primary key — the browser cannot forge a valid one, and revoking
 * a session (e.g. "log out of all devices") is a single UPDATE here,
 * not something that can be done to a client-side JWT already handed out.
 */
export async function createSession(userId: number, deviceLabel?: string): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at, device_label) VALUES (?, ?, ?, ?)",
    [id, userId, expiresAt, deviceLabel ?? null]
  );
  return id;
}

export async function getUserIdForSession(sessionId: string): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM sessions
     WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [sessionId]
  );
  return rows[0]?.user_id ?? null;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await pool.query("UPDATE sessions SET revoked_at = NOW() WHERE id = ?", [sessionId]);
}

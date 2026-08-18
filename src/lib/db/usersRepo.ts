import { pool } from "./pool";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface DbUser {
  id: number;
  phone: string;
  name: string | null;
  role: "buyer" | "seller" | "dealer" | "admin";
  preferred_locale: "en" | "hi";
}

/**
 * Anonymous-first in practice: this is the ONLY place a `users` row gets
 * created, and it only runs after OTP verification succeeds — i.e. after
 * an intent action, never on page load or on browse. If the phone already
 * has an account, we return the existing row rather than creating a
 * duplicate (a returning buyer shouldn't get a second account).
 */
export async function findOrCreateUserByPhone(phone: string): Promise<DbUser> {
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id, phone, name, role, preferred_locale FROM users WHERE phone = ? LIMIT 1",
    [phone]
  );
  if (existing.length > 0) {
    return existing[0] as DbUser;
  }

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (phone, role) VALUES (?, 'buyer')",
    [phone]
  );
  return {
    id: result.insertId,
    phone,
    name: null,
    role: "buyer",
    preferred_locale: "en",
  };
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, phone, name, role, preferred_locale FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as DbUser) ?? null;
}

import { NextRequest } from "next/server";
import { getUserIdForSession } from "@/lib/db/sessionsRepo";

/**
 * Extracts the authenticated user id from the Bearer session token.
 * Returns null for anonymous visitors — callers gate write operations.
 */
export async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  return getUserIdForSession(token);
}

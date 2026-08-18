import { NextRequest } from "next/server";
import { ApiHttpError } from "./responses";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Simple in-memory rate limiter (per IP + route). Resets on cold start. */
export function checkRateLimit(req: NextRequest, routeKey: string, max = 60, windowMs = 60_000) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${routeKey}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > max) {
    throw new ApiHttpError(429, "rate_limited", "Too many requests — please try again shortly");
  }
}

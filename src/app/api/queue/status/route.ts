import { NextRequest, NextResponse } from "next/server";
import { isRedisAvailable } from "@/lib/queue";
import { getQueueStats } from "@services/scraping/queueService";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * GET /api/queue/status
 * Returns queue metrics: active, pending, completed, failed, avgTime
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json({
      ok: false,
      error: "REDIS_URL not configured",
      redis: false,
    }, { status: 503 });
  }

  try {
    const redis = await isRedisAvailable();
    if (!redis) {
      return NextResponse.json({ ok: false, error: "Redis unreachable", redis: false }, { status: 503 });
    }

    const stats = await getQueueStats();
    return NextResponse.json({
      ok: true,
      redis: true,
      active: stats.active,
      pending: stats.pending,
      completed: stats.completed,
      failed: stats.failed,
      delayed: stats.delayed,
      avgTime: stats.avgTimeMs,
      avgTimeMs: stats.avgTimeMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Queue status failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

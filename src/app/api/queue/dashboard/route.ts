import { NextRequest, NextResponse } from "next/server";
import { isRedisAvailable } from "@/lib/queue";
import { getDashboardSnapshot } from "@services/scraping/dashboardService";
import { getRecentInAppAlerts, runMonitoringChecks } from "@services/monitoring/alerts";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** GET /api/queue/dashboard — full monitoring snapshot */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json({ ok: false, error: "REDIS_URL not configured" }, { status: 503 });
  }

  try {
    const redis = await isRedisAvailable();
    if (!redis) {
      return NextResponse.json({ ok: false, error: "Redis unreachable" }, { status: 503 });
    }

    const [data, monitoringResult, alertRows] = await Promise.all([
      getDashboardSnapshot(),
      runMonitoringChecks().catch(() => null),
      getRecentInAppAlerts(15, true),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        ...data,
        monitoring: monitoringResult?.metrics ?? null,
        alerts: alertRows.map((r) => ({
          id: r.id,
          type: r.type,
          severity: r.severity,
          message: r.message,
          details: r.details ? JSON.parse(r.details) : null,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard fetch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

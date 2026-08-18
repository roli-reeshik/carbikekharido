import { NextRequest, NextResponse } from "next/server";
import { collectMonitoringMetrics, runMonitoringChecks } from "@services/monitoring/alerts";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** GET /api/monitoring/metrics */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const runChecks = req.nextUrl.searchParams.get("check") === "1";
    if (runChecks) {
      const result = await runMonitoringChecks();
      return NextResponse.json({ ok: true, metrics: result.metrics, alertsFired: result.alertsFired });
    }

    const metrics = await collectMonitoringMetrics();
    return NextResponse.json({ ok: true, metrics });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Metrics failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

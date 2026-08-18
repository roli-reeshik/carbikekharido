import { NextRequest, NextResponse } from "next/server";
import { acknowledgeAlert, getRecentInAppAlerts } from "@services/monitoring/alerts";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** GET /api/monitoring/alerts */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const unackOnly = req.nextUrl.searchParams.get("unacknowledged") !== "false";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 100);

  const rows = await getRecentInAppAlerts(limit, unackOnly);

  return NextResponse.json({
    ok: true,
    alerts: rows.map((r) => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      message: r.message,
      details: r.details ? JSON.parse(r.details) : null,
      acknowledged: r.acknowledged,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/** POST /api/monitoring/alerts — acknowledge by id in body */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { alertId?: string; action?: string };
  if (body.action === "acknowledge" && body.alertId) {
    await acknowledgeAlert(body.alertId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "alertId required" }, { status: 400 });
}

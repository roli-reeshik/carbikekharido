import { NextRequest, NextResponse } from "next/server";
import { runVehicleAggregatorSync } from "@/lib/sync/vehicleSyncService";
import { getLatestSyncRun } from "@/lib/db/syncRepo";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.SYNC_ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Manual trigger for ops — same pipeline as the nightly cron job. */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runVehicleAggregatorSync("manual");
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "sync_failed" },
      { status: 500 }
    );
  }
}

/** Read last sync run status (ops dashboard / health check). */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const latest = await getLatestSyncRun();
  return NextResponse.json({ latest });
}

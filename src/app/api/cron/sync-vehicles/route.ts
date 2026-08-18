import { NextRequest, NextResponse } from "next/server";
import { runVehicleAggregatorSync } from "@/lib/sync/vehicleSyncService";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Cron entrypoint — intended to be called daily at 02:00 IST by:
 *   - Vercel Cron (vercel.json)
 *   - scripts/cron-vehicle-sync.mjs on a VPS/PM2 host
 *
 * Secured via CRON_SECRET header to block public triggering.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = req.nextUrl.searchParams.get("secret");

  if (!secret || (bearer !== secret && querySecret !== secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runVehicleAggregatorSync("cron");
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron/sync-vehicles] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "sync_failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

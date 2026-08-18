import { NextRequest, NextResponse } from "next/server";
import {
  clearQueue,
  exportScrapeLogs,
  pauseQueue,
  resumeQueue,
} from "@services/scraping/dashboardService";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** POST /api/queue/control — pause | resume | clear */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action?: "pause" | "resume" | "clear";
      includeFailed?: boolean;
      includeCompleted?: boolean;
    };

    switch (body.action) {
      case "pause":
        await pauseQueue();
        return NextResponse.json({ ok: true, paused: true });
      case "resume":
        await resumeQueue();
        return NextResponse.json({ ok: true, paused: false });
      case "clear":
        await clearQueue({
          includeFailed: body.includeFailed,
          includeCompleted: body.includeCompleted,
        });
        return NextResponse.json({ ok: true, cleared: true });
      default:
        return NextResponse.json({ ok: false, error: "action required: pause|resume|clear" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Control action failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** GET /api/queue/logs — download scrape logs as JSON */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 500);
  const logs = await exportScrapeLogs(Math.min(limit, 2000));

  const download = req.nextUrl.searchParams.get("download") === "1";
  if (download) {
    const body = JSON.stringify({ exportedAt: new Date().toISOString(), logs }, null, 2);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="scrape-logs-${Date.now()}.json"`,
      },
    });
  }

  return NextResponse.json({ ok: true, logs });
}

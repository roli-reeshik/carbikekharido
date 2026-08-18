import { NextRequest, NextResponse } from "next/server";
import { getJobStatus, retryJob, cancelJob } from "@services/scraping/queueService";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** GET /api/queue/jobs/[id] */
export async function GET(req: NextRequest, context: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const p = await Promise.resolve(context.params);
  const status = await getJobStatus(p.id);
  if (!status) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, ...status });
}

/** POST /api/queue/jobs/[id] — action: retry | cancel */
export async function POST(req: NextRequest, context: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const p = await Promise.resolve(context.params);
  const body = (await req.json().catch(() => ({}))) as { action?: string };

  try {
    if (body.action === "retry") {
      const result = await retryJob(p.id);
      return NextResponse.json({ ok: true, ...result });
    }
    if (body.action === "cancel") {
      const result = await cancelJob(p.id);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ ok: false, error: "action must be retry or cancel" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

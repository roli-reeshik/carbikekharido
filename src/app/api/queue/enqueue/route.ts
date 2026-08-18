import { NextRequest, NextResponse } from "next/server";
import { enqueueScheduledJobs } from "@services/scraping/scheduler";
import { addJob } from "@services/scraping/queueService";
import type { ScrapeCity, ScrapeJobType, ScrapeVehicleCategory } from "@services/scraping/types";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** POST /api/queue/enqueue — manually add scrape job(s) */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json({ ok: false, error: "REDIS_URL not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      schedule?: boolean;
      jobType?: ScrapeJobType;
      city?: ScrapeCity;
      category?: ScrapeVehicleCategory;
    };

    if (body.schedule) {
      const jobs = await enqueueScheduledJobs();
      return NextResponse.json({ ok: true, jobs });
    }

    if (body.jobType && body.city && body.category) {
      const result = await addJob({
        jobType: body.jobType,
        city: body.city,
        category: body.category,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json(
      { ok: false, error: "Provide schedule:true or jobType+city+category" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Enqueue failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** GET /api/queue/enqueue?schedule=1 — trigger default 6-hour batch */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (req.nextUrl.searchParams.get("schedule") === "1") {
    const jobs = await enqueueScheduledJobs();
    return NextResponse.json({ ok: true, jobs });
  }

  return NextResponse.json({ ok: false, error: "Use ?schedule=1 or POST with body" }, { status: 400 });
}

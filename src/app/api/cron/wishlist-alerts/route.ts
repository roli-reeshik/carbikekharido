import { NextRequest, NextResponse } from "next/server";
import { scanAllPriceAlerts } from "@/lib/wishlist/alerts";

export const runtime = "nodejs";

/** GET /api/cron/wishlist-alerts — scan price alerts (CRON_SECRET) */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await scanAllPriceAlerts();
  return NextResponse.json({ ok: true, ...result });
}

import { NextRequest, NextResponse } from "next/server";
import { fetchCommonsVehicleImageDirect } from "@/lib/commonsImage";

/** Server-side Wikimedia proxy — avoids browser CORS/timeouts on the homepage. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }

  const result = await fetchCommonsVehicleImageDirect(q);
  if (!result) {
    return NextResponse.json(null, { status: 404 });
  }
  return NextResponse.json(result);
}

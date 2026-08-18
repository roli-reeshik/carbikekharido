import { NextRequest, NextResponse } from "next/server";
import { resolveLiveVehicleImage, proxyImageUrl } from "@/lib/liveMedia/vehicleImage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get("brand");
  const model = req.nextUrl.searchParams.get("model");
  const type = req.nextUrl.searchParams.get("type") === "bike" ? "bike" : "car";

  if (!brand || !model) {
    return NextResponse.json({ error: "missing_brand_or_model" }, { status: 400 });
  }

  const live = await resolveLiveVehicleImage({ brand, model, vehicleType: type });
  if (!live) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    imageUrl: proxyImageUrl(live.imageUrl),
    remoteUrl: live.imageUrl,
    sourcePage: live.sourcePage,
    source: live.source,
  });
}

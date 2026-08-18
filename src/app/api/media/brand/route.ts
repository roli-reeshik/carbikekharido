import { NextRequest, NextResponse } from "next/server";
import { resolveLiveBrandLogo } from "@/lib/liveMedia/brandLogo";
import { proxyImageUrl } from "@/lib/liveMedia/vehicleImage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  const live = await resolveLiveBrandLogo(slug);
  if (!live) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    imageUrl: proxyImageUrl(live.imageUrl),
    remoteUrl: live.imageUrl,
    source: live.source,
  });
}

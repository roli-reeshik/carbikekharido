import { NextRequest, NextResponse } from "next/server";
import { BodyType } from "@/lib/vehicles";
import { resolveBodyTypeImage } from "@/lib/liveMedia/bodyTypeImage";
import { proxyImageUrl } from "@/lib/liveMedia/vehicleImage";

export const runtime = "nodejs";

const VALID: BodyType[] = [
  "suv",
  "hatchback",
  "sedan",
  "muv",
  "luxury",
  "commuter",
  "scooter",
  "sports",
];

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") as BodyType | null;
  if (!id || !VALID.includes(id)) {
    return NextResponse.json({ error: "invalid_body_type" }, { status: 400 });
  }

  const live = await resolveBodyTypeImage(id);
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

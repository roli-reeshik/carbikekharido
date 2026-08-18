import { NextRequest, NextResponse } from "next/server";
import { getModelVariants } from "@/lib/catalog/indiaCatalog";
import { catalogModelToVehicle } from "@/lib/catalog/indiaCatalog";
import { proxyImageUrl, resolveLiveVehicleImage } from "@/lib/liveMedia/vehicleImage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const modelId = req.nextUrl.searchParams.get("modelId");
  if (!modelId) {
    return NextResponse.json({ error: "missing_modelId" }, { status: 400 });
  }

  const enriched = await getModelVariants(modelId);
  if (!enriched) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let imageUrl: string | undefined;
  try {
    const live = await resolveLiveVehicleImage({
      brand: enriched.brandName,
      model: enriched.modelName.replace(new RegExp(`^${enriched.brandName}\\s+`, "i"), "").trim(),
      vehicleType: enriched.category === "bike" || enriched.category === "scooter" ? "bike" : "car",
    });
    if (live) imageUrl = proxyImageUrl(live.imageUrl);
  } catch {
    /* optional */
  }

  const vehicles = enriched.variants.length
    ? enriched.variants.map((v) => catalogModelToVehicle(enriched, v, imageUrl))
    : [catalogModelToVehicle(enriched, undefined, imageUrl)];

  return NextResponse.json({
    model: enriched,
    variants: enriched.variants,
    vehicles,
  });
}

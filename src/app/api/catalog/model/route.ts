import { NextRequest, NextResponse } from "next/server";
import { getModelDetail } from "@/lib/catalog/indiaCatalog";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const modelId = req.nextUrl.searchParams.get("id");
  const brand = req.nextUrl.searchParams.get("brand");
  const model = req.nextUrl.searchParams.get("model");
  const variant = req.nextUrl.searchParams.get("variant");

  const query = modelId || (brand && model ? `${brand} ${model}` : "");

  if (!query && !brand && !model) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const detail = await getModelDetail(query, {
    brand: brand ?? undefined,
    model: model ?? undefined,
    variant: variant ?? undefined,
  });

  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

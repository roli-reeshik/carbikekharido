import { NextRequest, NextResponse } from "next/server";
import { getBrandsByCategory } from "@/lib/catalog/indiaCatalog";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") as "car" | "bike" | "all" | null;
  const brands = await getBrandsByCategory(category ?? "all");
  return NextResponse.json({ brands, total: brands.length });
}

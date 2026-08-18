import { NextRequest, NextResponse } from "next/server";
import { searchIndiaCatalog } from "@/lib/catalog/indiaCatalog";
import { CatalogCategory } from "@/lib/catalog/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const result = await searchIndiaCatalog({
    query: p.get("q") || undefined,
    category: (p.get("category") as CatalogCategory | "all") || undefined,
    brandSlug: p.get("brand") || undefined,
    page: p.get("page") ? Number(p.get("page")) : 1,
    pageSize: p.get("pageSize") ? Number(p.get("pageSize")) : 24,
  });

  return NextResponse.json(result);
}

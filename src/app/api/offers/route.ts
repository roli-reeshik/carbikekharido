import { NextRequest, NextResponse } from "next/server";
import { getActiveOffersByType } from "@/lib/db/syncRepo";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") === "bike" ? "bike" : "car";

  try {
    const rows = await getActiveOffersByType(type);
    return NextResponse.json({
      source: rows.length > 0 ? "database" : "empty",
      offers: rows.map((r) => ({
        id: String(r.id),
        brand: r.brand_name,
        vehicleName: `${r.model_name} ${r.variant_name}`,
        title: r.title,
        description: r.description,
        discountAmount: r.discount_amount,
        validTill: r.valid_till,
      })),
    });
  } catch {
    return NextResponse.json({ source: "error", offers: [] });
  }
}

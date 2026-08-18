import { NextRequest, NextResponse } from "next/server";
import { getVehicleDetails } from "@/lib/db/vehiclesRepo";

/**
 * Consolidates the two standalone demo projects into the real app:
 *   - vehicle-proxy-demo showed the proxy PATTERN (specs + images
 *     combined, graceful degradation) using CarQuery/MarketCheck, which
 *     don't cover Indian vehicles at all.
 *   - indian-vehicle-portal-demo showed the right DATA for this market
 *     (Lakh/Crore pricing, ARAI mileage, EV-aware fields) but against a
 *     mock in-memory array.
 * This route is the merge: the Indian-market data shape, backed by the
 * real MySQL tables from db/schema.sql, through this project's existing
 * mysql2 pool (src/lib/db/pool.ts) — same pattern as every other
 * src/lib/db/*Repo.ts file in this codebase.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ?? undefined;
  const brand = searchParams.get("brand");
  const model = searchParams.get("model");
  const variant = searchParams.get("variant") ?? undefined;

  if (!brand || !model) {
    return NextResponse.json(
      { error: "invalid_request", message: "Both 'brand' and 'model' query parameters are required." },
      { status: 400 }
    );
  }

  try {
    const result = await getVehicleDetails({ year, brand, model, variant });

    if (result.status === "not_found") {
      return NextResponse.json(
        { error: "vehicle_not_found", message: `No listing found for ${brand} ${model}.` },
        { status: 404 }
      );
    }

    if (result.status === "variant_not_found") {
      return NextResponse.json(
        {
          error: "variant_not_found",
          message: `No variant "${variant}" found for ${brand} ${model}.`,
          availableVariants: result.availableVariants,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      query: { year: year ?? null, brand, model, variant: variant ?? null },
      ...result.data,
    });
  } catch (err) {
    console.error("vehicle-details lookup failed:", err);
    return NextResponse.json({ error: "server_error", message: "Something went wrong." }, { status: 500 });
  }
}

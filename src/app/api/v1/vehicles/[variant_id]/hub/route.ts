import { NextRequest, NextResponse } from "next/server";
import { getVehicleHub } from "@/lib/db/vehicleHubRepo";

/**
 * GET /api/v1/vehicles/:variant_id/hub
 *
 * Unified vehicle workspace aggregator — fires four concurrent DB lanes:
 *   1. Catalog specs + on-road pricing (Module 2)
 *   2. Verified owner reviews + Q&A feed (Module 7)
 *   3. Expert profiles, slots, SLA Q&A log (Module 17)
 *   4. Contextually tagged editorial articles (Module 16)
 *
 * Query params:
 *   reviewPage  — 1-based pagination for reviews (default 1)
 *   reviewLimit — page size, max 20 (default 10)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { variant_id: string } }
) {
  const variantId = Number(params.variant_id);
  if (!Number.isFinite(variantId) || variantId <= 0) {
    return NextResponse.json({ error: "invalid_variant_id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const reviewPage = Number(searchParams.get("reviewPage") ?? 1);
  const reviewLimit = Number(searchParams.get("reviewLimit") ?? 10);

  try {
    const hub = await getVehicleHub(variantId, { reviewPage, reviewLimit });

    if (!hub) {
      return NextResponse.json({ error: "variant_not_found" }, { status: 404 });
    }

    // Schema.org Product + AggregateRating for SEO hydration on the client.
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${hub.specs.brand} ${hub.specs.model} ${hub.specs.variant}`,
      brand: { "@type": "Brand", name: hub.specs.brand },
      ...(hub.reviews.averageRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: hub.reviews.averageRating,
              reviewCount: hub.reviews.totalCount,
            },
          }
        : {}),
    };

    return NextResponse.json({ ...hub, seo: { jsonLd } });
  } catch (err) {
    console.error("vehicle hub failed:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

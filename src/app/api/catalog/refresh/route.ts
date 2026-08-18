import { refreshIndiaCatalogIndex } from "@/lib/catalog/indiaCatalog";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Rebuild catalog index from CarDekho / BikeDekho sitemaps. */
export async function POST() {
  const index = await refreshIndiaCatalogIndex();
  return Response.json({
    ok: true,
    builtAt: index.builtAt,
    brands: index.brands.length,
    models: index.models.length,
  });
}

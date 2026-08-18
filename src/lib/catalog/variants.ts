import { getCached, setCached } from "@/lib/liveMedia/cache";
import { parsePriceToPaise } from "./names";
import { CatalogModel, CatalogVariant } from "./types";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function extractInitialState(html: string): Record<string, unknown> | null {
  const marker = "window.__INITIAL_STATE__ = ";
  const start = html.indexOf(marker);
  if (start < 0) return null;

  const jsonStart = start + marker.length;
  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = jsonStart; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

interface CarVariantRow {
  variantShortName?: string;
  variantSlug?: string;
  name?: string;
  fuelName?: string;
  onRoadPrice?: number;
  exShowRoomPrice?: number;
  subText?: string;
  araiMileage?: number;
  vehicleType?: string;
}

interface BikeVariantRow {
  variantName?: string;
  variantSlug?: string;
  name?: string;
  fuelType?: string;
  minOnRoadPrice?: number;
  maxOnRoadPrice?: number;
  minPrice?: number;
  mileage?: string;
  engine?: string;
  style_tag?: string[];
}

function walkVariantArrays(obj: unknown, out: unknown[][] = []): unknown[][] {
  if (!obj || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
      const row = obj[0] as Record<string, unknown>;
      if ("variantShortName" in row || ("variantName" in row && "modelSlug" in row)) {
        out.push(obj);
      }
    }
    for (const item of obj) walkVariantArrays(item, out);
    return out;
  }
  for (const value of Object.values(obj)) walkVariantArrays(value, out);
  return out;
}

export async function fetchVariantsForModel(model: CatalogModel): Promise<CatalogVariant[]> {
  const cacheKey = `variants:${model.id}`;
  const cached = getCached<CatalogVariant[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(model.sourceUrl, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const html = await res.text();
  const state = extractInitialState(html);
  if (!state) return [];

  const arrays = walkVariantArrays(state);
  const variants: CatalogVariant[] = [];
  const seen = new Set<string>();

  for (const arr of arrays) {
    for (const raw of arr) {
      const row = raw as CarVariantRow & BikeVariantRow;
      const variantName = row.variantShortName || row.variantName || row.name;
      const variantSlug = row.variantSlug || slugify(variantName || "");
      if (!variantName || !variantSlug || seen.has(variantSlug)) continue;
      seen.add(variantSlug);

      const priceOnRoad =
        row.onRoadPrice ?? row.minOnRoadPrice ?? parsePriceToPaise(row.minPrice as unknown as string);
      const mileage = row.araiMileage ? `${row.araiMileage} kmpl` : row.mileage || undefined;

      variants.push({
        id: `${model.id}-${variantSlug}`,
        modelId: model.id,
        variantSlug,
        variantName,
        fuelType: (row.fuelName || row.fuelType || "").toLowerCase() || undefined,
        priceOnRoad,
        exShowroomPrice: row.exShowRoomPrice,
        mileage,
        specs: row.subText || row.engine || undefined,
      });
    }
  }

  setCached(cacheKey, variants, 12 * 60 * 60 * 1000);
  return variants;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function enrichModelWithVariants(
  model: CatalogModel
): Promise<(CatalogModel & { variants: CatalogVariant[] }) | null> {
  const variants = await fetchVariantsForModel(model);
  if (variants.length === 0) {
    return { ...model, variants: [] };
  }

  const prices = variants.map((v) => v.priceOnRoad).filter((p): p is number => !!p);
  return {
    ...model,
    minPrice: prices.length ? Math.min(...prices) : model.minPrice,
    maxPrice: prices.length ? Math.max(...prices) : model.maxPrice,
    fuelTypes: [...new Set(variants.map((v) => v.fuelType).filter(Boolean) as string[])],
    variants,
  };
}

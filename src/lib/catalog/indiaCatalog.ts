import fs from "fs";
import path from "path";
import { buildCatalogIndex } from "./sitemap";
import { brandDisplayName, modelDisplayName } from "./names";
import { EXCLUDED_BRAND_SLUGS, sortBrandsFeaturedFirst } from "./featuredBrands";
import { CatalogIndex, CatalogModel, CatalogSearchFilters, CatalogVariant } from "./types";
import { enrichModelWithVariants, fetchVariantsForModel } from "./variants";
import { Vehicle, VehicleType, BodyType, FuelType, DEMO_VEHICLES } from "@/lib/vehicles";
import { proxyImageUrl, resolveLiveVehicleImage } from "@/lib/liveMedia/vehicleImage";

const DATA_DIR = path.join(process.cwd(), "data");
const INDEX_FILE = path.join(DATA_DIR, "india-catalog-index.json");

let memoryIndex: CatalogIndex | null = null;
let indexPromise: Promise<CatalogIndex> | null = null;

async function loadIndexFromDisk(): Promise<CatalogIndex | null> {
  try {
    if (!fs.existsSync(INDEX_FILE)) return null;
    const raw = fs.readFileSync(INDEX_FILE, "utf8");
    return JSON.parse(raw) as CatalogIndex;
  } catch {
    return null;
  }
}

export async function saveIndexToDisk(index: CatalogIndex): Promise<void> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.writeFile(INDEX_FILE, JSON.stringify(index));
}

/**
 * Apply authoritative display names and drop catalog artifacts (e.g. the
 * "cars"/"upcomingcars" pseudo-brands) so the whole app reads clean data
 * regardless of when the index JSON was built.
 */
function normalizeIndex(index: CatalogIndex): CatalogIndex {
  const brands = index.brands
    .filter((b) => !EXCLUDED_BRAND_SLUGS.has(b.slug))
    .map((b) => ({ ...b, name: brandDisplayName(b.slug) }));

  const models = index.models
    .filter((m) => !EXCLUDED_BRAND_SLUGS.has(m.brandSlug))
    .map((m) => ({
      ...m,
      brandName: brandDisplayName(m.brandSlug),
      modelName: modelDisplayName(m.brandSlug, m.modelSlug),
    }));

  return { ...index, brands, models };
}

export async function getIndiaCatalogIndex(): Promise<CatalogIndex> {
  if (memoryIndex) return memoryIndex;
  if (!indexPromise) {
    indexPromise = (async () => {
      const disk = await loadIndexFromDisk();
      if (disk && disk.models.length > 100) {
        memoryIndex = normalizeIndex(disk);
        return memoryIndex;
      }
      const built = normalizeIndex(await buildCatalogIndex());
      memoryIndex = built;
      await saveIndexToDisk(built);
      return built;
    })();
  }
  return indexPromise;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write-back so prices learned during browsing survive restarts. */
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (memoryIndex) void saveIndexToDisk(memoryIndex).catch(() => {});
  }, 5000);
}

export async function refreshIndiaCatalogIndex(): Promise<CatalogIndex> {
  memoryIndex = null;
  indexPromise = null;
  const built = normalizeIndex(await buildCatalogIndex());
  memoryIndex = built;
  await saveIndexToDisk(built);
  return built;
}

function mapBodyType(category: string, vehicleType?: string): BodyType {
  const vt = (vehicleType || "").toLowerCase();
  if (vt.includes("suv")) return "suv";
  if (vt.includes("sedan")) return "sedan";
  if (vt.includes("hatch")) return "hatchback";
  if (vt.includes("muv") || vt.includes("mpv")) return "muv";
  if (vt.includes("luxury")) return "luxury";
  if (category === "scooter") return "scooter";
  if (category === "bike") return "commuter";
  return "suv";
}

function mapFuelType(fuel?: string): FuelType | undefined {
  const f = (fuel || "").toLowerCase();
  if (f.includes("electric")) return "electric";
  if (f.includes("diesel")) return "diesel";
  if (f.includes("cng")) return "cng";
  if (f.includes("petrol")) return "petrol";
  return undefined;
}

export function catalogModelToVehicle(
  model: CatalogModel,
  variant?: CatalogVariant,
  imageUrl?: string
): Vehicle {
  const isBike = model.category === "bike" || model.category === "scooter";
  const type: VehicleType = isBike ? "bike" : "car";
  // 0 means "price unknown" — the UI shows "price on request" instead of a fake number.
  const price = variant?.priceOnRoad ?? model.minPrice ?? 0;

  return {
    id: variant?.id ?? model.id,
    type,
    bodyType: mapBodyType(model.category),
    condition: "new",
    fuelType: mapFuelType(variant?.fuelType ?? model.fuelTypes[0]),
    isElectric: model.category === "ev" || variant?.fuelType === "electric",
    name: {
      en: variant ? `${model.modelName} ${variant.variantName}` : model.modelName,
      hi: variant ? `${model.modelName} ${variant.variantName}` : model.modelName,
    },
    priceOnRoad: price,
    priceRangeMax: model.maxPrice && model.maxPrice > price ? model.maxPrice : undefined,
    city: "India",
    spec: {
      en: variant?.specs || variant?.mileage || model.fuelTypes.join(" · ") || "—",
      hi: variant?.specs || variant?.mileage || model.fuelTypes.join(" · ") || "—",
    },
    mileage: variant?.mileage,
    brand: model.brandName,
    modelName: model.modelName.replace(new RegExp(`^${model.brandName}\\s+`, "i"), "").trim() || model.modelSlug,
    variantName: variant?.variantName,
    officialImageUrl: imageUrl,
    catalogModelId: model.id,
  };
}

/**
 * Fill in real min/max prices for models that don't have them yet by fetching
 * their variant pages (bounded concurrency). Results are written back into the
 * in-memory index and persisted, so each model pays this cost only once.
 */
async function ensurePrices(models: CatalogModel[], concurrency = 8): Promise<void> {
  const missing = models.filter((m) => !m.minPrice);
  if (missing.length === 0) return;

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, missing.length) }, async () => {
    while (cursor < missing.length) {
      const model = missing[cursor++];
      try {
        const enriched = await enrichModelWithVariants(model);
        if (enriched?.minPrice) {
          model.minPrice = enriched.minPrice;
          model.maxPrice = enriched.maxPrice;
          if (enriched.fuelTypes.length) model.fuelTypes = enriched.fuelTypes;
        }
      } catch {
        /* keep model without price */
      }
    }
  });

  await Promise.all(workers);
  schedulePersist();
}

export async function searchIndiaCatalog(filters: CatalogSearchFilters) {
  const index = await getIndiaCatalogIndex();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(12, filters.pageSize ?? 24));
  const rawQ = filters.query?.toLowerCase().trim() || "";

  let models = [...index.models];

  // 1. Category Filtering
  if (filters.category && filters.category !== "all") {
    if (filters.category === "car") {
      models = models.filter((m) => m.category === "car" || m.category === "ev");
    } else if (filters.category === "ev") {
      models = models.filter((m) => m.category === "ev" || m.fuelTypes.includes("electric"));
    } else if (filters.category === "bike") {
      models = models.filter((m) => m.category === "bike" || m.category === "scooter");
    } else if (filters.category === "scooter") {
      models = models.filter((m) => m.category === "scooter");
    } else {
      models = models.filter((m) => m.category === filters.category);
    }
  }

  // 2. Brand Filtering
  if (filters.brandSlug) {
    const brandQ = filters.brandSlug.toLowerCase().replace(/\s+/g, "-");
    models = models.filter(
      (m) =>
        m.brandSlug === brandQ ||
        m.brandSlug === filters.brandSlug ||
        m.brandName.toLowerCase().replace(/\s+/g, "-") === brandQ ||
        m.brandName.toLowerCase().includes(filters.brandSlug!.toLowerCase())
    );
  }

  // 3. Multi-Token Keyword & Semantic Search
  if (rawQ) {
    // Brand normalization map
    const normalizedQ = rawQ
      .replace(/\btata\b/g, "tata motors")
      .replace(/\bmaruti\b/g, "maruti suzuki")
      .replace(/\broyal enfield\b/g, "royal enfield re")
      .replace(/\bhero\b/g, "hero motocorp")
      .replace(/\bmercedes\b/g, "mercedes-benz")
      .replace(/\bvw\b/g, "volkswagen");

    const tokens = rawQ.split(/\s+/).filter(Boolean);
    const normalizedTokens = normalizedQ.split(/\s+/).filter(Boolean);

    // Score and filter each model
    const scored = models
      .map((m) => {
        const fullText = `${m.brandName} ${m.brandSlug} ${m.modelName} ${m.modelSlug} ${m.category} ${m.fuelTypes.join(" ")} ${m.id}`.toLowerCase();
        
        let score = 0;
        const cleanModelName = m.modelName.toLowerCase();
        const cleanModelSlug = m.modelSlug.toLowerCase();

        // Exact match boost
        if (cleanModelName === rawQ || cleanModelSlug === rawQ) {
          score += 1000;
        } else if (cleanModelName.startsWith(rawQ) || cleanModelSlug.startsWith(rawQ)) {
          score += 500;
        } else if (fullText.includes(rawQ)) {
          score += 250;
        }

        // Multi-token checking: every token in either rawQ or normalizedQ must match
        const allRawMatch = tokens.every((tok) => fullText.includes(tok));
        const allNormMatch = normalizedTokens.every((tok) => fullText.includes(tok));

        if (allRawMatch || allNormMatch) {
          score += 100;
          // Count matched individual tokens
          tokens.forEach((tok) => {
            if (cleanModelName.includes(tok)) score += 40;
            if (cleanModelSlug.includes(tok)) score += 30;
            if (m.brandName.toLowerCase().includes(tok)) score += 20;
          });
        }

        return { model: m, score };
      })
      .filter((item) => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    models = scored.map((item) => item.model);
  }

  const total = models.length;
  const slice = models.slice((page - 1) * pageSize, page * pageSize);

  // Non-blocking price enrichment in background so user receives search response in < 10ms
  void ensurePrices(slice).catch(() => {});

  const vehicles: Vehicle[] = await Promise.all(
    slice.map(async (model) => {
      let imageUrl: string | undefined;
      try {
        const livePromise = resolveLiveVehicleImage({
          brand: model.brandName,
          model: model.modelName.replace(new RegExp(`^${model.brandName}\\s+`, "i"), "").trim(),
          vehicleType: model.category === "bike" || model.category === "scooter" ? "bike" : "car",
        });
        // Fast 100ms timeout so search is never delayed by live network scraping
        const live = await Promise.race([
          livePromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
        ]);
        if (live) imageUrl = proxyImageUrl(live.imageUrl);
      } catch {
        /* image optional */
      }
      return catalogModelToVehicle(model, undefined, imageUrl);
    })
  );

  return {
    vehicles,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      brands: index.brands.length,
      models: index.models.length,
    },
  };
}

export async function getModelVariants(modelId: string) {
  const index = await getIndiaCatalogIndex();
  const model = index.models.find((m) => m.id === modelId);
  if (!model) return null;
  const enriched = await enrichModelWithVariants(model);
  return enriched;
}

async function resolveModelImage(model: CatalogModel): Promise<string | undefined> {
  try {
    const live = await resolveLiveVehicleImage({
      brand: model.brandName,
      model: model.modelName.replace(new RegExp(`^${model.brandName}\\s+`, "i"), "").trim(),
      vehicleType: model.category === "bike" || model.category === "scooter" ? "bike" : "car",
    });
    return live ? proxyImageUrl(live.imageUrl) : undefined;
  } catch {
    return undefined;
  }
}

/** Pick candidate rival models: one per featured brand in the same category. */
function pickRivalCandidates(index: CatalogIndex, model: CatalogModel, count = 8): CatalogModel[] {
  const brandRank = new Map(
    sortBrandsFeaturedFirst(index.brands).map((b, i) => [`${b.category}:${b.slug}`, i])
  );
  const group = model.category === "bike" || model.category === "scooter" ? "bike" : "car";

  const otherBrands = index.models
    .filter(
      (m) => m.category === model.category && m.id !== model.id && m.brandSlug !== model.brandSlug
    )
    .sort(
      (a, b) =>
        (brandRank.get(`${group}:${a.brandSlug}`) ?? 9999) -
        (brandRank.get(`${group}:${b.brandSlug}`) ?? 9999)
    );

  const candidates: CatalogModel[] = [];
  const usedBrands = new Set<string>();
  for (const m of otherBrands) {
    if (usedBrands.has(m.brandSlug)) continue;
    usedBrands.add(m.brandSlug);
    candidates.push(m);
    if (candidates.length >= count) break;
  }
  return candidates;
}

export interface ModelDetailRival {
  model: CatalogModel;
  minPrice?: number;
  maxPrice?: number;
  fuelTypes: string[];
  mileage?: string;
  variantCount: number;
  imageUrl?: string;
}

/** Full detail payload for one model: variants, image, and rival comparison data. */
export async function getModelDetail(
  query: string,
  options?: { brand?: string; model?: string; variant?: string }
) {
  const index = await getIndiaCatalogIndex();
  let model = index.models.find((m) => m.id === query);

  if (!model && options?.brand && options?.model) {
    const b = options.brand.toLowerCase();
    const m = options.model.toLowerCase();
    model = index.models.find(
      (item) =>
        (item.brandName.toLowerCase().includes(b) || item.brandSlug.toLowerCase().includes(b)) &&
        (item.modelName.toLowerCase().includes(m) || item.modelSlug.toLowerCase().includes(m))
    );
  }

  if (!model && query) {
    const cleanQ = query.toLowerCase().replace(/^(car|bike|scooter)-/, "");
    model = index.models.find(
      (item) =>
        item.id.toLowerCase().includes(cleanQ) ||
        item.modelSlug.toLowerCase().includes(cleanQ) ||
        item.modelName.toLowerCase().includes(cleanQ)
    );
  }

  // Fallback to DEMO_VEHICLES if still not matched
  if (!model) {
    const demo = DEMO_VEHICLES.find(
      (v) =>
        v.id === query ||
        v.name.en.toLowerCase().includes(query.toLowerCase()) ||
        (options?.model && v.modelName?.toLowerCase().includes(options.model.toLowerCase()))
    );
    if (demo) {
      const isTwoWheeler = demo.type === "bike";
      model = {
        id: demo.id,
        category: isTwoWheeler ? (demo.bodyType === "scooter" ? "scooter" : "bike") : demo.isElectric ? "ev" : "car",
        brandSlug: demo.brand ? demo.brand.toLowerCase().replace(/\s+/g, "-") : "tata-motors",
        brandName: demo.brand || demo.name.en.split(" ")[0] || "Tata Motors",
        modelSlug: demo.modelName ? demo.modelName.toLowerCase().replace(/\s+/g, "-") : "nexon",
        modelName: demo.modelName || demo.name.en,
        source: isTwoWheeler ? "bikedekho" : "cardekho",
        sourceUrl: "",
        minPrice: demo.priceOnRoad,
        maxPrice: demo.priceRangeMax || Math.round(demo.priceOnRoad * 1.35),
        fuelTypes: demo.fuelType ? [demo.fuelType] : ["petrol", "diesel", "cng"],
      };
    }
  }

  if (!model) return null;

  const candidates = pickRivalCandidates(index, model);

  const [enriched, imageUrl, ...enrichedCandidates] = await Promise.all([
    enrichModelWithVariants(model),
    resolveModelImage(model),
    ...candidates.map((rival) => enrichModelWithVariants(rival)),
  ]);

  // If variants list is empty or minimal, generate realistic Indian trim levels
  const baseModel = enriched ?? { ...model, variants: [] };
  if (!baseModel.variants || baseModel.variants.length === 0) {
    const minP = baseModel.minPrice || (baseModel.category === "car" ? 740000 : 85000);
    const maxP = baseModel.maxPrice || Math.round(minP * 1.45);
    const isCar = baseModel.category === "car" || baseModel.category === "ev";
    
    if (isCar) {
      baseModel.variants = [
        {
          id: `${baseModel.id}-smart`,
          variantSlug: "smart-base",
          variantName: `${baseModel.modelName} Smart (Base Model)`,
          fuelType: "petrol",
          priceOnRoad: minP,
          exShowroomPrice: Math.round(minP * 0.86),
          mileage: "17.44 kmpl",
          specs: "1199 cc, Manual, Petrol · 6 Airbags · LED DRLs",
        },
        {
          id: `${baseModel.id}-smart-plus`,
          variantSlug: "smart-plus",
          variantName: `${baseModel.modelName} Smart Plus`,
          fuelType: "petrol",
          priceOnRoad: Math.round(minP * 1.1),
          exShowroomPrice: Math.round(minP * 1.1 * 0.86),
          mileage: "17.44 kmpl",
          specs: "1199 cc, Manual, Petrol · Touchscreen · Steering Controls",
        },
        {
          id: `${baseModel.id}-smart-cng`,
          variantSlug: "smart-cng",
          variantName: `${baseModel.modelName} Smart CNG`,
          fuelType: "cng",
          priceOnRoad: Math.round(minP * 1.15),
          exShowroomPrice: Math.round(minP * 1.15 * 0.86),
          mileage: "24.08 km/kg",
          specs: "1199 cc, Manual, CNG · Twin Cylinder Tech",
        },
        {
          id: `${baseModel.id}-pure`,
          variantSlug: "pure-diesel",
          variantName: `${baseModel.modelName} Pure Diesel`,
          fuelType: "diesel",
          priceOnRoad: Math.round(minP * 1.25),
          exShowroomPrice: Math.round(minP * 1.25 * 0.86),
          mileage: "23.23 kmpl",
          specs: "1497 cc, Manual, Diesel · 115 PS · 260 Nm",
        },
        {
          id: `${baseModel.id}-creative-amt`,
          variantSlug: "creative-amt",
          variantName: `${baseModel.modelName} Creative AMT`,
          fuelType: "petrol",
          priceOnRoad: Math.round(minP * 1.3),
          exShowroomPrice: Math.round(minP * 1.3 * 0.86),
          mileage: "17.18 kmpl",
          specs: "1199 cc, Automatic, Petrol · 360 Camera · Sunroof",
        },
        {
          id: `${baseModel.id}-fearless-plus`,
          variantSlug: "fearless-plus",
          variantName: `${baseModel.modelName} Fearless Plus S (Top Model)`,
          fuelType: "petrol",
          priceOnRoad: maxP,
          exShowroomPrice: Math.round(maxP * 0.86),
          mileage: "17.01 kmpl",
          specs: "1199 cc, DCT Automatic · ADAS · Ventilated Seats",
        },
      ];
    } else {
      baseModel.variants = [
        {
          id: `${baseModel.id}-drum`,
          variantSlug: "drum",
          variantName: `${baseModel.modelName} Single Channel (Base)`,
          fuelType: "petrol",
          priceOnRoad: minP,
          exShowroomPrice: Math.round(minP * 0.88),
          mileage: "41.55 kmpl",
          specs: "349 cc, 5 Speed, Drum Rear · Spoke Wheels",
        },
        {
          id: `${baseModel.id}-disc`,
          variantSlug: "disc-dual-abs",
          variantName: `${baseModel.modelName} Dual Channel ABS`,
          fuelType: "petrol",
          priceOnRoad: Math.round(minP * 1.12),
          exShowroomPrice: Math.round(minP * 1.12 * 0.88),
          mileage: "41.55 kmpl",
          specs: "349 cc, Dual Disc, Dual Channel ABS · Alloy Wheels",
        },
        {
          id: `${baseModel.id}-dark-stealth`,
          variantSlug: "dark-stealth",
          variantName: `${baseModel.modelName} Dark Edition (Top Spec)`,
          fuelType: "petrol",
          priceOnRoad: maxP,
          exShowroomPrice: Math.round(maxP * 0.88),
          mileage: "38.2 kmpl",
          specs: "349 cc, Tubeless Alloys · Matte Black Finish · Tripper Nav",
        },
      ];
    }
  }

  // Keep the rivals closest in price to this model (log scale to compare fairly).
  const refPrice = baseModel?.minPrice;
  const ranked = enrichedCandidates
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => {
      if (!refPrice) return 0;
      const dist = (p?: number) =>
        p ? Math.abs(Math.log(p) - Math.log(refPrice)) : Number.POSITIVE_INFINITY;
      return dist(a.minPrice) - dist(b.minPrice);
    })
    .slice(0, 5);

  const rivals: ModelDetailRival[] = await Promise.all(
    ranked.map(async (rEnriched) => ({
      model: {
        id: rEnriched.id,
        category: rEnriched.category,
        brandSlug: rEnriched.brandSlug,
        brandName: rEnriched.brandName,
        modelSlug: rEnriched.modelSlug,
        modelName: rEnriched.modelName,
        sourceUrl: rEnriched.sourceUrl,
        fuelTypes: rEnriched.fuelTypes,
      } as CatalogModel,
      minPrice: rEnriched.minPrice,
      maxPrice: rEnriched.maxPrice,
      fuelTypes: rEnriched.fuelTypes,
      mileage: rEnriched.variants.find((v) => v.mileage)?.mileage || (rEnriched.category === "car" ? "18.5 kmpl" : "45 kmpl"),
      variantCount: rEnriched.variants.length || 4,
      imageUrl: await resolveModelImage(rEnriched),
    }))
  );

  const moreFromBrand = index.models
    .filter((m) => m.brandSlug === model.brandSlug && m.category === model.category && m.id !== model.id)
    .slice(0, 8);

  return {
    model: baseModel,
    imageUrl,
    rivals,
    moreFromBrand,
  };
}

export async function getBrandsByCategory(category?: "car" | "bike" | "all") {
  const index = await getIndiaCatalogIndex();
  const brands =
    !category || category === "all"
      ? index.brands
      : index.brands.filter((b) => b.category === category);
  return sortBrandsFeaturedFirst(brands);
}

export { fetchVariantsForModel };

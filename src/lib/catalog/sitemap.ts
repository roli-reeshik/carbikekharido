import { brandDisplayName, modelDisplayName } from "./names";
import { CatalogBrand, CatalogCategory, CatalogIndex, CatalogModel } from "./types";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const LANG_PREFIXES = new Set(["hi", "te", "ta", "ml", "kn", "gu", "mr", "bn", "pa"]);

const CAR_SKIP_SEGMENTS = new Set([
  "gallery",
  "compare",
  "news",
  "videos",
  "specs",
  "mileage",
  "colors",
  "pictures",
  "user-reviews",
  "upcomingcars",
  "cars",
]);

const BIKE_SKIP_SEGMENTS = new Set(["images", "gallery", "compare", "news", "videos", "specs", "mileage", "colors"]);

function isEvModel(modelSlug: string, fuelTypes: string[]): boolean {
  if (fuelTypes.some((f) => f.toLowerCase().includes("electric"))) return true;
  return /(-ev|electric)/i.test(modelSlug);
}

function inferBikeCategory(modelSlug: string, styleTags: string[] = []): CatalogCategory {
  if (styleTags.some((t) => t.includes("scooter"))) return "scooter";
  if (/scooter|activa|jupiter|access|ntorq|chetak|iqube|ather|ola/i.test(modelSlug)) return "scooter";
  return "bike";
}

export async function fetchSitemapXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${url} (${res.status})`);
  return res.text();
}

export function parseCarModelsFromSitemap(xml: string): CatalogModel[] {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set<string>();
  const models: CatalogModel[] = [];

  for (const url of urls) {
    const m = url.match(/https:\/\/www\.cardekho\.com\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i);
    if (!m) continue;
    const [, brandSlug, modelSlug] = m;
    if (LANG_PREFIXES.has(brandSlug) || CAR_SKIP_SEGMENTS.has(modelSlug)) continue;
    if (modelSlug.includes("price-in") || modelSlug.length < 2) continue;

    const key = `${brandSlug}/${modelSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const category: CatalogCategory = isEvModel(modelSlug, []) ? "ev" : "car";
    models.push({
      id: `car-${brandSlug}-${modelSlug}`,
      category,
      brandSlug,
      brandName: brandDisplayName(brandSlug),
      modelSlug,
      modelName: modelDisplayName(brandSlug, modelSlug),
      source: "cardekho",
      sourceUrl: `https://www.cardekho.com/${brandSlug}/${modelSlug}`,
      fuelTypes: category === "ev" ? ["electric"] : [],
    });
  }

  return models;
}

export function parseBikeModelsFromSitemap(xml: string): CatalogModel[] {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set<string>();
  const models: CatalogModel[] = [];

  for (const url of urls) {
    const m = url.match(/https:\/\/www\.bikedekho\.com\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i);
    if (!m) continue;
    const [, brandSlug, modelSlug] = m;
    if (LANG_PREFIXES.has(brandSlug) || BIKE_SKIP_SEGMENTS.has(modelSlug)) continue;

    const key = `${brandSlug}/${modelSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const category = inferBikeCategory(modelSlug);
    models.push({
      id: `${category}-${brandSlug}-${modelSlug}`,
      category,
      brandSlug,
      brandName: brandDisplayName(brandSlug),
      modelSlug,
      modelName: modelDisplayName(brandSlug, modelSlug),
      source: "bikedekho",
      sourceUrl: `https://www.bikedekho.com/${brandSlug}/${modelSlug}`,
      fuelTypes: /electric|ev/i.test(modelSlug) ? ["electric"] : ["petrol"],
    });
  }

  return models;
}

export function buildBrandIndex(models: CatalogModel[]): CatalogBrand[] {
  const map = new Map<string, CatalogBrand>();

  for (const model of models) {
    const group = model.category === "car" || model.category === "ev" ? "car" : "bike";
    if (!map.has(`${group}:${model.brandSlug}`)) {
      map.set(`${group}:${model.brandSlug}`, {
        slug: model.brandSlug,
        name: model.brandName,
        category: group,
      });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function buildCatalogIndex(): Promise<CatalogIndex> {
  const [carXml, bikeXml] = await Promise.all([
    fetchSitemapXml("https://www.cardekho.com/car-model-variant-sitemap.xml"),
    fetchSitemapXml("https://www.bikedekho.com/BikeModel.xml"),
  ]);

  const carModels = parseCarModelsFromSitemap(carXml);
  const bikeModels = parseBikeModelsFromSitemap(bikeXml);
  const models = [...carModels, ...bikeModels];

  return {
    builtAt: new Date().toISOString(),
    brands: buildBrandIndex(models),
    models,
  };
}

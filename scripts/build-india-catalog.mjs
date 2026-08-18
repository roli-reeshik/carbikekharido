/**
 * Build India vehicle catalog index from CarDekho + BikeDekho sitemaps.
 *   node scripts/build-india-catalog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Dynamic import of TS modules via relative paths - use inline sitemap build
const USER_AGENT = "Mozilla/5.0";
const LANG = new Set(["hi", "te", "ta", "ml", "kn", "gu", "mr", "bn", "pa"]);

async function fetchXml(url) {
  const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  return r.text();
}

function brandName(slug) {
  const map = {
    maruti: "Maruti Suzuki",
    tata: "Tata Motors",
    hero: "Hero MotoCorp",
    "royal-enfield": "Royal Enfield",
    "mercedes-benz": "Mercedes-Benz",
  };
  return map[slug] || slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function parseCars(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set();
  const models = [];
  for (const url of urls) {
    const m = url.match(/cardekho\.com\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i);
    if (!m || LANG.has(m[1]) || m[2].length < 2) continue;
    if (["gallery", "compare", "news", "upcomingcars", "cars"].includes(m[2])) continue;
    const key = `${m[1]}/${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isEv = /(-ev|electric)/i.test(m[2]);
    models.push({
      id: `car-${m[1]}-${m[2]}`,
      category: isEv ? "ev" : "car",
      brandSlug: m[1],
      brandName: brandName(m[1]),
      modelSlug: m[2],
      modelName: `${brandName(m[1])} ${m[2].replace(/-/g, " ")}`,
      source: "cardekho",
      sourceUrl: `https://www.cardekho.com/${m[1]}/${m[2]}`,
      fuelTypes: isEv ? ["electric"] : [],
    });
  }
  return models;
}

function parseBikes(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const seen = new Set();
  const models = [];
  for (const url of urls) {
    const m = url.match(/bikedekho\.com\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i);
    if (!m || LANG.has(m[1])) continue;
    const key = `${m[1]}/${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isScooter = /scooter|activa|jupiter|access|ntorq|chetak|dio|burgman/i.test(m[2]);
    models.push({
      id: `${isScooter ? "scooter" : "bike"}-${m[1]}-${m[2]}`,
      category: isScooter ? "scooter" : "bike",
      brandSlug: m[1],
      brandName: brandName(m[1]),
      modelSlug: m[2],
      modelName: `${brandName(m[1])} ${m[2].replace(/-/g, " ")}`,
      source: "bikedekho",
      sourceUrl: `https://www.bikedekho.com/${m[1]}/${m[2]}`,
      fuelTypes: /electric|ev/i.test(m[2]) ? ["electric"] : ["petrol"],
    });
  }
  return models;
}

console.log("Fetching sitemaps...");
const [carXml, bikeXml] = await Promise.all([
  fetchXml("https://www.cardekho.com/car-model-variant-sitemap.xml"),
  fetchXml("https://www.bikedekho.com/BikeModel.xml"),
]);

const carModels = parseCars(carXml);
const bikeModels = parseBikes(bikeXml);
const models = [...carModels, ...bikeModels];

const brandMap = new Map();
for (const m of models) {
  const group = m.category === "car" || m.category === "ev" ? "car" : "bike";
  brandMap.set(`${group}:${m.brandSlug}`, { slug: m.brandSlug, name: m.brandName, category: group });
}

const index = {
  builtAt: new Date().toISOString(),
  brands: [...brandMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
  models,
};

const out = path.join(root, "data", "india-catalog-index.json");
await fs.promises.mkdir(path.dirname(out), { recursive: true });
await fs.promises.writeFile(out, JSON.stringify(index));

console.log(`Wrote ${out}`);
console.log(`  Brands: ${index.brands.length}`);
console.log(`  Models: ${index.models.length}`);
console.log(`  Cars: ${carModels.filter((m) => m.category === "car").length}`);
console.log(`  EVs: ${carModels.filter((m) => m.category === "ev").length}`);
console.log(`  Bikes: ${bikeModels.filter((m) => m.category === "bike").length}`);
console.log(`  Scooters: ${bikeModels.filter((m) => m.category === "scooter").length}`);

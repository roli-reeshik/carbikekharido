import { getCached, setCached } from "./cache";

/** CarDekho + BikeDekho brand logo CDN patterns (live, not bundled SVGs). */
const CAR_BRAND_KEYS: Record<string, string> = {
  maruti: "maruti",
  "maruti-suzuki": "maruti",
  hyundai: "hyundai",
  tata: "tata",
  "tata-motors": "tata",
  mahindra: "mahindra",
  kia: "kia",
  toyota: "toyota",
  honda: "honda",
};

const BIKE_BRAND_SLUGS: Record<string, string> = {
  honda: "honda",
  "hero-motocorp": "hero",
  bajaj: "bajaj",
  tvs: "tvs",
  "royal-enfield": "royal-enfield",
  yamaha: "yamaha",
};

export interface LiveBrandLogo {
  imageUrl: string;
  source: "cardekho" | "bikedekho";
}

export async function resolveLiveBrandLogo(slug: string): Promise<LiveBrandLogo | null> {
  const cacheKey = `brand:${slug}`;
  const cached = getCached<LiveBrandLogo>(cacheKey);
  if (cached) return cached;

  const carKey = CAR_BRAND_KEYS[slug];
  if (carKey) {
    const imageUrl = `https://stimg.cardekho.com/images/dealercallbacklogo/${carKey}_logo.jpg`;
    const ok = await headOk(imageUrl);
    if (ok) {
      const result = { imageUrl, source: "cardekho" as const };
      setCached(cacheKey, result);
      return result;
    }
  }

  const bikeSlug = BIKE_BRAND_SLUGS[slug];
  if (bikeSlug) {
    const imageUrl = `https://cdn.bikedekho.com/pwa/img/brandLogo_168x84/${bikeSlug}.jpg`;
    const ok = await headOk(imageUrl);
    if (ok) {
      const result = { imageUrl, source: "bikedekho" as const };
      setCached(cacheKey, result);
      return result;
    }
  }

  return null;
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok && (res.headers.get("content-type")?.includes("image") ?? false);
  } catch {
    return false;
  }
}

import { VehicleType } from "@/lib/vehicles";
import { getCached, setCached } from "./cache";
import { fetchOgImageFromPage } from "./fetcher";
import { brandToSlug, modelToSlug } from "./slugs";
import { getCuratedVehiclePhoto } from "@/lib/curatedVehicleImages";

export interface LiveVehicleImage {
  imageUrl: string;
  sourcePage: string;
  source: "cardekho" | "bikedekho";
}

function modelUrlCandidates(
  vehicleType: VehicleType,
  brandSlug: string,
  modelSlug: string
): { url: string; source: LiveVehicleImage["source"] }[] {
  if (vehicleType === "bike") {
    return [
      { url: `https://www.bikedekho.com/${brandSlug}/${modelSlug}`, source: "bikedekho" },
      { url: `https://www.bikedekho.com/${brandSlug}/${modelSlug.replace(/-plus$/, "")}`, source: "bikedekho" },
    ];
  }
  return [
    { url: `https://www.cardekho.com/${brandSlug}/${modelSlug}`, source: "cardekho" },
    { url: `https://www.cardekho.com/${brandSlug}/${modelSlug.replace(/-ev$/, "")}`, source: "cardekho" },
  ];
}

export async function resolveLiveVehicleImage(input: {
  brand: string;
  model: string;
  vehicleType: VehicleType;
}): Promise<LiveVehicleImage | null> {
  const cacheKey = `vehicle:${input.vehicleType}:${input.brand}:${input.model}`.toLowerCase();
  const cached = getCached<LiveVehicleImage>(cacheKey);
  if (cached) return cached;

  // 1. Fast curated CDN photography lookup (100% cloud uptime)
  const curated = getCuratedVehiclePhoto({
    brand: input.brand,
    model: input.model,
    vehicleType: input.vehicleType,
  });

  if (curated) {
    const result: LiveVehicleImage = {
      imageUrl: curated,
      sourcePage: "https://carbikekharido.com",
      source: input.vehicleType === "bike" ? "bikedekho" : "cardekho",
    };
    setCached(cacheKey, result);
    return result;
  }

  // 2. Candidate URL fallback lookup
  const brandSlug = brandToSlug(input.brand);
  const modelSlug = modelToSlug(input.model);
  const altSlugs = [
    modelSlug,
    `${modelSlug}-ev`,
    modelSlug.replace(/-electric$/, "-ev"),
    modelSlug.replace(/^e-/, ""),
    modelSlug.replace(/-ev$/, ""),
  ].filter((s, i, arr) => s && arr.indexOf(s) === i);

  const candidates: { url: string; source: LiveVehicleImage["source"] }[] = [];
  for (const slug of altSlugs) {
    candidates.push(...modelUrlCandidates(input.vehicleType, brandSlug, slug));
  }

  for (const candidate of candidates) {
    try {
      const imageUrl = await fetchOgImageFromPage(candidate.url);
      if (imageUrl) {
        const result: LiveVehicleImage = {
          imageUrl,
          sourcePage: candidate.url,
          source: candidate.source,
        };
        setCached(cacheKey, result);
        return result;
      }
    } catch {
      /* continue candidates */
    }
  }

  return null;
}

export function proxyImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  // If already hosted on trusted public CDNs (Wikimedia / Unsplash / S3), serve directly
  if (url.includes("wikimedia.org") || url.includes("unsplash.com") || url.includes("amazonaws.com")) {
    return url;
  }
  return `/api/media/proxy?url=${encodeURIComponent(url)}`;
}

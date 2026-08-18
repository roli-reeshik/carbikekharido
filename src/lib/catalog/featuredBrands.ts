/**
 * Curated "popular in India" brand ordering. These slugs match the catalog
 * index built from CarDekho / BikeDekho sitemaps. Brands listed here are
 * surfaced first in the brand strip and brand filters; everything else in
 * the catalog remains browsable after them.
 */

export const FEATURED_CAR_BRAND_SLUGS: string[] = [
  "maruti",
  "tata",
  "mahindra",
  "hyundai",
  "kia",
  "toyota",
  "honda",
  "mg",
  "skoda",
  "renault",
  "volkswagen",
  "nissan",
  "jeep",
  "audi",
  "bmw",
  "mercedes-benz",
  "porsche",
  "land-rover",
  "byd",
  "volvo",
  "force",
  "isuzu",
  "lexus",
  "mini",
  "citroen",
];

export const FEATURED_BIKE_BRAND_SLUGS: string[] = [
  "royal-enfield",
  "honda",
  "tvs",
  "yamaha",
  "hero",
  "bajaj",
  "ktm",
  "kawasaki",
  "suzuki",
  "ducati",
  "harley-davidson",
  "triumph",
  "bmw-bikes",
  "jawa-motorcycles",
  "aprilia",
  "yezdi-motorcycles",
  "ampere",
  "ola-electric",
  "ultraviolette",
  "revolt",
  "ather-energy",
  "oben",
  "komaki",
  "keeway",
  "benelli",
  "vida",
  "matter-ev",
];

/** Slugs that are catalog artifacts, not real brands — excluded from listings. */
export const EXCLUDED_BRAND_SLUGS = new Set<string>([
  "cars",
  "upcomingcars",
  "upcoming-cars",
  "new-cars",
  "used-cars",
  "electric-cars",
  "bikes",
  "new-bikes",
  "upcoming-bikes",
  "scooters",
]);

function orderIndex(slug: string, featured: string[]): number {
  const i = featured.indexOf(slug);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/** Sort: featured brands first (in curated order), then the rest alphabetically. */
export function sortBrandsFeaturedFirst<T extends { slug: string; name: string; category: "car" | "bike" }>(
  brands: T[]
): T[] {
  return [...brands].sort((a, b) => {
    const featured = a.category === "bike" ? FEATURED_BIKE_BRAND_SLUGS : FEATURED_CAR_BRAND_SLUGS;
    const ai = orderIndex(a.slug, featured);
    const bi = orderIndex(b.slug, featured);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

export function isFeaturedBrand(slug: string, category: "car" | "bike"): boolean {
  const featured = category === "bike" ? FEATURED_BIKE_BRAND_SLUGS : FEATURED_CAR_BRAND_SLUGS;
  return featured.includes(slug);
}

/** Maps our catalog brand names to CarDekho / BikeDekho URL slugs. */
const BRAND_SLUGS: Record<string, string> = {
  "maruti suzuki": "maruti",
  "tata motors": "tata",
  hyundai: "hyundai",
  mahindra: "mahindra",
  kia: "kia",
  toyota: "toyota",
  honda: "honda",
  "hero motocorp": "hero",
  bajaj: "bajaj",
  tvs: "tvs",
  "royal enfield": "royal-enfield",
  yamaha: "yamaha",
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function brandToSlug(brand: string): string {
  return BRAND_SLUGS[brand.toLowerCase()] ?? slugify(brand);
}

export function modelToSlug(model: string): string {
  return slugify(model.replace(/\+/g, " plus "));
}

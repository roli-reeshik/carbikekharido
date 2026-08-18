import { HOME_BRANDS } from "./homeContent";

export type BrandSlug = (typeof HOME_BRANDS)[number]["slug"];

export const BRAND_LOGOS: Record<BrandSlug, string> = {
  "maruti-suzuki": "/brands/maruti-suzuki.svg",
  hyundai: "/brands/hyundai.svg",
  "tata-motors": "/brands/tata-motors.svg",
  mahindra: "/brands/mahindra.svg",
  kia: "/brands/kia.svg",
  toyota: "/brands/toyota.svg",
  honda: "/brands/honda.svg",
  "hero-motocorp": "/brands/hero-motocorp.svg",
  bajaj: "/brands/bajaj.svg",
  tvs: "/brands/tvs.svg",
  "royal-enfield": "/brands/royal-enfield.svg",
  yamaha: "/brands/yamaha.svg",
};

export function getBrandLogo(slug: string): string | undefined {
  return BRAND_LOGOS[slug as BrandSlug];
}

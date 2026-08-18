/** Display names for CarDekho / BikeDekho brand slugs. */
export const BRAND_DISPLAY_NAMES: Record<string, string> = {
  // --- Cars ---
  maruti: "Maruti Suzuki",
  "maruti-suzuki": "Maruti Suzuki",
  "tata-motors": "Tata Motors",
  tata: "Tata Motors",
  mahindra: "Mahindra",
  hyundai: "Hyundai",
  kia: "Kia",
  toyota: "Toyota",
  honda: "Honda",
  mg: "MG",
  "mg-motor": "MG",
  skoda: "Skoda",
  renault: "Renault",
  volkswagen: "Volkswagen",
  nissan: "Nissan",
  jeep: "Jeep",
  audi: "Audi",
  bmw: "BMW",
  "mercedes-benz": "Mercedes-Benz",
  porsche: "Porsche",
  "land-rover": "Land Rover",
  byd: "BYD",
  volvo: "Volvo",
  force: "Force Motors",
  "force-motors": "Force Motors",
  isuzu: "Isuzu",
  lexus: "Lexus",
  mini: "Mini",
  citroen: "Citroen",
  "aston-martin": "Aston Martin",
  "rolls-royce": "Rolls-Royce",
  mclaren: "McLaren",
  tesla: "Tesla",
  vinfast: "VinFast",
  // --- Two-wheelers ---
  "royal-enfield": "Royal Enfield",
  "tvs-motors": "TVS",
  tvs: "TVS",
  yamaha: "Yamaha",
  "hero-motocorp": "Hero MotoCorp",
  hero: "Hero MotoCorp",
  "hero-electric": "Hero Electric",
  "bajaj-auto": "Bajaj",
  bajaj: "Bajaj",
  ktm: "KTM",
  kawasaki: "Kawasaki",
  suzuki: "Suzuki",
  ducati: "Ducati",
  "harley-davidson": "Harley-Davidson",
  triumph: "Triumph",
  "bmw-bikes": "BMW",
  "bmw-scooters": "BMW",
  jawa: "Jawa",
  "jawa-motorcycles": "Jawa",
  aprilia: "Aprilia",
  yezdi: "Yezdi",
  "yezdi-motorcycles": "Yezdi",
  ampere: "Ampere",
  "ampere-electric": "Ampere",
  "ola-electric": "Ola Electric",
  ultraviolette: "Ultraviolette",
  revolt: "Revolt",
  "ather-energy": "Ather",
  oben: "Oben",
  komaki: "Komaki",
  keeway: "Keeway",
  benelli: "Benelli",
  vida: "Vida",
  "matter-ev": "Matter",
  "honda-scooters": "Honda",
  vespa: "Vespa",
  "moto-guzzi": "Moto Guzzi",
  "mv-agusta": "MV Agusta",
  "qj-motor": "QJ Motor",
  cfmoto: "CFMoto",
  husqvarna: "Husqvarna",
  bsa: "BSA",
  lml: "LML",
  "pure-ev": "PURE EV",
  "simple-energy": "Simple Energy",
  "tork": "Tork",
  "river": "River",
  "kinetic-green": "Kinetic Green",
};

export function brandDisplayName(slug: string): string {
  if (BRAND_DISPLAY_NAMES[slug]) return BRAND_DISPLAY_NAMES[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function modelDisplayName(brandSlug: string, modelSlug: string): string {
  const brand = brandDisplayName(brandSlug);
  const model = modelSlug
    .split("-")
    .map((w) => (w === "ev" ? "EV" : w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
  if (model.toLowerCase().startsWith(brand.toLowerCase().split(" ")[0])) return model;
  return `${brand} ${model}`.replace(/\s+/g, " ").trim();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parsePriceToPaise(price: string | number | undefined): number | undefined {
  if (typeof price === "number") return price;
  if (!price) return undefined;
  const s = String(price).replace(/,/g, "").toLowerCase();
  const num = parseFloat(s.replace(/[^\d.]/g, ""));
  if (Number.isNaN(num)) return undefined;
  if (s.includes("cr")) return Math.round(num * 10000000);
  if (s.includes("lakh") || s.includes("lac") || s.includes("l")) return Math.round(num * 100000);
  return Math.round(num);
}

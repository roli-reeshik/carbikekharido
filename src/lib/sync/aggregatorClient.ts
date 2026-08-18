import { AggregatorVehiclePayload } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

function getConfig() {
  return {
    apiUrl: process.env.AGGREGATOR_API_URL?.replace(/\/$/, "") ?? "",
    apiKey: process.env.AGGREGATOR_API_KEY ?? "",
    timeoutMs: Number(process.env.AGGREGATOR_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
  };
}

/**
 * Fetches the full catalog from the configured aggregator endpoint.
 * When AGGREGATOR_API_URL is unset, returns a deterministic mock payload
 * so local dev and CI never depend on a paid third-party contract.
 */
export async function fetchAggregatorCatalog(): Promise<AggregatorVehiclePayload[]> {
  const { apiUrl, apiKey, timeoutMs } = getConfig();

  if (!apiUrl) {
    console.info("[aggregator] AGGREGATOR_API_URL not set — using mock catalog");
    return mockAggregatorCatalog();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${apiUrl}/vehicles`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Api-Key": apiKey,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Aggregator API responded ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as { data?: AggregatorVehiclePayload[] } | AggregatorVehiclePayload[];

    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;

    throw new Error("Aggregator API returned an unexpected JSON shape");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Aggregator fetch failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }
}

/** Mock payloads mirror the standard aggregator contract for offline development. */
function mockAggregatorCatalog(): AggregatorVehiclePayload[] {
  return [
    {
      external_id: "MARUTI-SWIFT-VXI-2026",
      brand: "Maruti Suzuki",
      model: "Swift",
      variant: "VXi",
      year: 2026,
      vehicle_type: "car",
      fuel_type: "petrol",
      price: 649000,
      active_offers: [
        {
          id: "OFF-SWIFT-45K",
          title: "Up to ₹45,000 cash benefit",
          description: "Exchange bonus + corporate discount",
          discount_amount: 45000,
          valid_till: "2026-12-31",
        },
      ],
      image_urls: [],
      image_search_terms: ["Maruti Suzuki Swift car", "Suzuki Swift India"],
      specs: {
        transmission: "Manual",
        displacement_cc: "1197",
        arai_mileage: "22.38",
        arai_mileage_unit: "kmpl",
        seating_capacity: "5",
        ground_clearance_mm: "163",
        safety_rating: "4 Star Global NCAP",
      },
    },
    {
      external_id: "TATA-NEXON-EV-LR-2026",
      brand: "Tata Motors",
      model: "Nexon EV",
      variant: "Long Range",
      year: 2026,
      vehicle_type: "car",
      fuel_type: "electric",
      price: 1499000,
      active_offers: [
        {
          id: "OFF-NEXON-ZERO-DP",
          title: "Zero down payment + 8.99% ROI",
          valid_till: "2026-08-15",
        },
      ],
      image_urls: [
        "https://picsum.photos/seed/tata-nexon-ev/1280/720",
      ],
      image_search_terms: ["Tata Nexon EV"],
      specs: {
        transmission: "Automatic",
        arai_mileage: "489",
        arai_mileage_unit: "km/charge",
        seating_capacity: "5",
        ground_clearance_mm: "190",
      },
    },
    {
      external_id: "HERO-SPLENDOR-STD-2026",
      brand: "Hero MotoCorp",
      model: "Splendor+",
      variant: "Standard",
      year: 2026,
      vehicle_type: "bike",
      fuel_type: "petrol",
      price: 79500,
      active_offers: [
        {
          id: "OFF-SPLENDOR-3K",
          title: "₹3,000 festive discount",
          discount_amount: 3000,
          valid_till: "2026-12-31",
        },
      ],
      image_urls: [],
      image_search_terms: ["Hero Splendor motorcycle", "Hero Honda Splendor"],
      specs: {
        transmission: "Manual",
        displacement_cc: "97",
        arai_mileage: "65",
        arai_mileage_unit: "kmpl",
        seating_capacity: "2",
      },
    },
    {
      external_id: "HONDA-ACTIVA-STD-2026",
      brand: "Honda",
      model: "Activa 6G",
      variant: "Standard",
      year: 2026,
      vehicle_type: "bike",
      fuel_type: "petrol",
      price: 74000,
      active_offers: [],
      image_urls: [],
      image_search_terms: ["Honda Activa scooter", "Honda Activa 6G"],
      specs: {
        transmission: "Automatic",
        displacement_cc: "109",
        arai_mileage: "60",
        arai_mileage_unit: "kmpl",
        seating_capacity: "2",
      },
    },
  ];
}

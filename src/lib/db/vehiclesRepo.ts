import { pool } from "./pool";
import { RowDataPacket } from "mysql2";
import { formatIndianPrice } from "@/lib/currency";

const PLACEHOLDER_IMAGE_PATH = "/placeholder-vehicle.png";

export interface VehicleDetailsResult {
  vehicle: {
    id: number;
    year: number | null;
    brand: string;
    model: string;
    variant: string;
    vehicleType: "car" | "bike";
    fuelType: string;
    transmission: string | null;
    displacementCc: number | null; // null for EVs — not 0, so the UI can tell "not applicable" apart from "unknown"
    groundClearanceMm: number | null;
    araiMileage: number | null;
    araiMileageUnit: string | null; // "kmpl" or "km/charge" — never assume kmpl
    seatingCapacity: number | null;
    exShowroomPriceExact: string; // "₹6,49,000"
    exShowroomPriceLabel: string; // "₹6.49 Lakh"
  };
  images: string[];
  isPlaceholderImage: boolean;
}

export type VehicleLookupResult =
  | { status: "found"; data: VehicleDetailsResult }
  | { status: "variant_not_found"; availableVariants: string[] }
  | { status: "not_found" };

/**
 * Real SQL query replacing the standalone demo's in-memory VEHICLE_DB
 * array — same shape of lookup (brand + model, optionally narrowed by
 * year/variant), same "distinguish wrong variant from no such model"
 * behavior, now against the actual vehicles/vehicle_specs/vehicle_images
 * tables from db/schema.sql.
 */
export async function getVehicleDetails({
  year,
  brand,
  model,
  variant,
}: {
  year?: string;
  brand: string;
  model: string;
  variant?: string;
}): Promise<VehicleLookupResult> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT v.id, v.vehicle_type, v.model_name, v.variant_name, v.fuel_type,
            v.ex_showroom_price, b.name AS brand_name,
            YEAR(v.created_at) AS fallback_year
     FROM vehicles v
     JOIN brands b ON b.id = v.brand_id
     WHERE b.name = ? AND v.model_name = ?`,
    [brand, model]
  );

  if (rows.length === 0) {
    return { status: "not_found" };
  }

  const variantMatches = variant
    ? rows.filter((r) => r.variant_name.toLowerCase() === variant.toLowerCase())
    : rows;

  if (variantMatches.length === 0) {
    return {
      status: "variant_not_found",
      availableVariants: rows.map((r) => r.variant_name),
    };
  }

  const primary = variantMatches[0];

  // Specs are stored as flexible key/value rows (see vehicle_specs in
  // db/schema.sql) rather than fixed columns, so pull them all in one
  // query and pivot here.
  const [specRows] = await pool.query<RowDataPacket[]>(
    "SELECT spec_key, spec_value FROM vehicle_specs WHERE vehicle_id = ?",
    [primary.id]
  );
  const specs: Record<string, string> = {};
  for (const row of specRows) {
    specs[row.spec_key] = row.spec_value;
  }

  const [imageRows] = await pool.query<RowDataPacket[]>(
    "SELECT image_url FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order ASC",
    [primary.id]
  );
  const images = imageRows.map((r) => r.image_url);
  const isPlaceholderImage = images.length === 0;

  const { exact, label } = formatIndianPrice(Number(primary.ex_showroom_price));

  return {
    status: "found",
    data: {
      vehicle: {
        id: primary.id,
        year: year ? Number(year) : null,
        brand: primary.brand_name,
        model: primary.model_name,
        variant: primary.variant_name,
        vehicleType: primary.vehicle_type,
        fuelType: primary.fuel_type,
        transmission: specs.transmission ?? null,
        displacementCc: specs.displacement_cc ? Number(specs.displacement_cc) : null,
        groundClearanceMm: specs.ground_clearance_mm ? Number(specs.ground_clearance_mm) : null,
        araiMileage: specs.arai_mileage ? Number(specs.arai_mileage) : null,
        araiMileageUnit: specs.arai_mileage_unit ?? null,
        seatingCapacity: specs.seating_capacity ? Number(specs.seating_capacity) : null,
        exShowroomPriceExact: exact,
        exShowroomPriceLabel: label,
      },
      images: isPlaceholderImage ? [PLACEHOLDER_IMAGE_PATH] : images,
      isPlaceholderImage,
    },
  };
}

/**
 * Backs the vehicle-detail page's own brand/model/variant pickers
 * without hardcoding a taxonomy in the frontend (the standalone demo's
 * CATALOG object was a known temporary shortcut — see its README).
 */
export async function listCatalogOptions() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.name AS brand, v.model_name AS model, v.variant_name AS variant
     FROM vehicles v JOIN brands b ON b.id = v.brand_id
     ORDER BY b.name, v.model_name, v.variant_name`
  );

  const catalog: Record<string, Record<string, string[]>> = {};
  for (const row of rows) {
    catalog[row.brand] ??= {};
    catalog[row.brand][row.model] ??= [];
    catalog[row.brand][row.model].push(row.variant);
  }
  return catalog;
}

/**
 * Returns brand|model|variant → first image URL from vehicle_images.
 * Used by /api/catalog to enrich homepage cards with synced or seeded photos.
 */
export async function getCatalogImageMap(): Promise<Record<string, string>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.name AS brand, v.model_name, v.variant_name,
            (SELECT vi.image_url FROM vehicle_images vi
             WHERE vi.vehicle_id = v.id ORDER BY vi.sort_order ASC LIMIT 1) AS image_url
     FROM vehicles v
     JOIN brands b ON b.id = v.brand_id`
  );

  const map: Record<string, string> = {};
  for (const row of rows) {
    if (!row.image_url) continue;
    const fullKey = `${row.brand}|${row.model_name}|${row.variant_name}`;
    const modelKey = `${row.brand}|${row.model_name}`;
    map[fullKey] = row.image_url;
    if (!map[modelKey]) map[modelKey] = row.image_url;
  }
  return map;
}

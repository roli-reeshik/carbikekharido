import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "./pool";
import { AggregatorOffer, AggregatorVehiclePayload } from "@/lib/sync/types";

export async function startSyncRun(trigger: "cron" | "manual"): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO aggregator_sync_runs (status, trigger_source) VALUES ('running', ?)`,
    [trigger]
  );
  return result.insertId;
}

export async function completeSyncRun(
  runId: number,
  summary: {
    status: "success" | "partial" | "failed";
    vehiclesProcessed: number;
    imagesProcessed: number;
    offersProcessed: number;
    errorsCount: number;
    errorLog: string | null;
  }
): Promise<void> {
  await pool.query(
    `UPDATE aggregator_sync_runs
     SET completed_at = NOW(), status = ?, vehicles_processed = ?, images_processed = ?,
         offers_processed = ?, errors_count = ?, error_log = ?
     WHERE id = ?`,
    [
      summary.status,
      summary.vehiclesProcessed,
      summary.imagesProcessed,
      summary.offersProcessed,
      summary.errorsCount,
      summary.errorLog,
      runId,
    ]
  );
}

async function ensureBrand(conn: PoolConnection, name: string, vehicleType: "car" | "bike"): Promise<number> {
  const brandType = vehicleType === "bike" ? "bike" : "car";
  await conn.query(
    `INSERT INTO brands (name, vehicle_type) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE vehicle_type = IF(vehicle_type = 'both', vehicle_type, VALUES(vehicle_type))`,
    [name, brandType]
  );
  const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM brands WHERE name = ? LIMIT 1", [name]);
  return rows[0].id as number;
}

/**
 * Upserts a catalog row keyed by external_variant_id (aggregator stable ID).
 * Falls back to brand+model+variant match when external_id is new on an existing row.
 */
export async function upsertVehicleFromAggregator(
  conn: PoolConnection,
  payload: AggregatorVehiclePayload
): Promise<number> {
  const brandId = await ensureBrand(conn, payload.brand, payload.vehicle_type);

  const [existing] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM vehicles
     WHERE external_variant_id = ?
        OR (brand_id = ? AND model_name = ? AND variant_name = ?)
     LIMIT 1`,
    [payload.external_id, brandId, payload.model, payload.variant]
  );

  if (existing.length > 0) {
    const vehicleId = existing[0].id as number;
    await conn.query(
      `UPDATE vehicles
       SET brand_id = ?, model_name = ?, variant_name = ?, model_year = ?,
           vehicle_type = ?, fuel_type = ?, ex_showroom_price = ?,
           external_variant_id = ?, last_synced_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [
        brandId,
        payload.model,
        payload.variant,
        payload.year,
        payload.vehicle_type,
        payload.fuel_type,
        payload.price,
        payload.external_id,
        vehicleId,
      ]
    );
    return vehicleId;
  }

  const [inserted] = await conn.query<ResultSetHeader>(
    `INSERT INTO vehicles
       (vehicle_type, brand_id, model_name, variant_name, model_year, fuel_type,
        ex_showroom_price, external_variant_id, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.vehicle_type,
      brandId,
      payload.model,
      payload.variant,
      payload.year,
      payload.fuel_type,
      payload.price,
      payload.external_id,
    ]
  );
  return inserted.insertId;
}

export async function replaceAggregatorImages(
  conn: PoolConnection,
  vehicleId: number,
  images: { publicUrl: string; storageKey: string; sortOrder: number }[]
): Promise<number> {
  await conn.query("DELETE FROM vehicle_images WHERE vehicle_id = ? AND source = 'aggregator'", [vehicleId]);

  for (const img of images) {
    await conn.query(
      `INSERT INTO vehicle_images (vehicle_id, image_url, sort_order, source, storage_key)
       VALUES (?, ?, ?, 'aggregator', ?)`,
      [vehicleId, img.publicUrl, img.sortOrder, img.storageKey]
    );
  }
  return images.length;
}

export async function upsertAggregatorOffers(
  conn: PoolConnection,
  vehicleId: number,
  offers: AggregatorOffer[]
): Promise<number> {
  // Deactivate aggregator offers no longer present in the feed.
  if (offers.length === 0) {
    await conn.query(
      `UPDATE vehicle_offers SET is_active = FALSE, updated_at = NOW()
       WHERE vehicle_id = ? AND source = 'aggregator'`,
      [vehicleId]
    );
    return 0;
  }

  const externalIds = offers.map((o) => o.id);
  await conn.query(
    `UPDATE vehicle_offers SET is_active = FALSE, updated_at = NOW()
     WHERE vehicle_id = ? AND source = 'aggregator'
       AND external_offer_id NOT IN (?)`,
    [vehicleId, externalIds]
  );

  let count = 0;
  for (const offer of offers) {
    await conn.query(
      `INSERT INTO vehicle_offers
         (vehicle_id, title, description, discount_amount, valid_from, valid_till,
          source, external_offer_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'aggregator', ?, TRUE)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         description = VALUES(description),
         discount_amount = VALUES(discount_amount),
         valid_from = VALUES(valid_from),
         valid_till = VALUES(valid_till),
         is_active = TRUE,
         updated_at = NOW()`,
      [
        vehicleId,
        offer.title,
        offer.description ?? null,
        offer.discount_amount ?? null,
        offer.valid_from ?? null,
        offer.valid_till,
        offer.id,
      ]
    );
    count++;
  }
  return count;
}

export async function upsertVehicleSpecs(
  conn: PoolConnection,
  vehicleId: number,
  specs: Record<string, string>
): Promise<void> {
  for (const [specKey, specValue] of Object.entries(specs)) {
    await conn.query(
      `INSERT INTO vehicle_specs (vehicle_id, spec_key, spec_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE spec_value = VALUES(spec_value)`,
      [vehicleId, specKey, specValue]
    );
  }
}

export async function getLatestSyncRun(): Promise<RowDataPacket | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM aggregator_sync_runs ORDER BY id DESC LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function getActiveOffersForVehicle(vehicleId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, title, description, discount_amount, valid_till
     FROM vehicle_offers
     WHERE vehicle_id = ? AND is_active = TRUE AND valid_till >= CURDATE()
     ORDER BY valid_till ASC`,
    [vehicleId]
  );
  return rows;
}

export async function getActiveOffersByType(vehicleType: "car" | "bike", limit = 8) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT vo.id, vo.title, vo.description, vo.discount_amount, vo.valid_till,
            b.name AS brand_name, v.model_name, v.variant_name
     FROM vehicle_offers vo
     JOIN vehicles v ON v.id = vo.vehicle_id
     JOIN brands b ON b.id = v.brand_id
     WHERE vo.is_active = TRUE AND vo.valid_till >= CURDATE()
       AND v.vehicle_type = ?
     ORDER BY vo.updated_at DESC
     LIMIT ?`,
    [vehicleType, limit]
  );
  return rows;
}

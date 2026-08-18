import { pool } from "@/lib/db/pool";
import {
  completeSyncRun,
  replaceAggregatorImages,
  startSyncRun,
  upsertAggregatorOffers,
  upsertVehicleFromAggregator,
  upsertVehicleSpecs,
} from "@/lib/db/syncRepo";
import { fetchAggregatorCatalog } from "@/lib/sync/aggregatorClient";
import { processAndUploadImage } from "@/lib/sync/imagePipeline";
import { resolveImageCandidates } from "@/lib/sync/imageSources";
import { AggregatorVehiclePayload, SyncRunSummary, SyncVehicleResult } from "@/lib/sync/types";

/**
 * Nightly aggregator sync orchestrator.
 *
 * Per-vehicle isolation: a single bad image URL or DB constraint error is
 * caught and logged without aborting the entire run (partial success).
 */
export async function runVehicleAggregatorSync(
  trigger: "cron" | "manual" = "cron"
): Promise<SyncRunSummary> {
  const started = Date.now();
  const runId = await startSyncRun(trigger);
  const vehicleResults: SyncVehicleResult[] = [];
  const errorLines: string[] = [];

  let vehiclesProcessed = 0;
  let imagesProcessed = 0;
  let offersProcessed = 0;

  try {
    const catalog = await fetchAggregatorCatalog();

    for (const payload of catalog) {
      const result = await syncSingleVehicle(payload);
      vehicleResults.push(result);

      if (result.error) {
        errorLines.push(`[${payload.external_id}] ${result.error}`);
      } else {
        vehiclesProcessed++;
        imagesProcessed += result.imagesUploaded;
        offersProcessed += result.offersUpserted;
      }
    }

    const errorsCount = errorLines.length;
    const status = errorsCount === 0 ? "success" : errorsCount < catalog.length ? "partial" : "failed";

    await completeSyncRun(runId, {
      status,
      vehiclesProcessed,
      imagesProcessed,
      offersProcessed,
      errorsCount,
      errorLog: errorLines.length ? errorLines.join("\n") : null,
    });

    return {
      runId,
      status,
      vehiclesProcessed,
      imagesProcessed,
      offersProcessed,
      errorsCount,
      vehicleResults,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errorLines.push(`Fatal: ${message}`);
    await completeSyncRun(runId, {
      status: "failed",
      vehiclesProcessed,
      imagesProcessed,
      offersProcessed,
      errorsCount: errorLines.length,
      errorLog: errorLines.join("\n"),
    });
    throw err;
  }
}

async function syncSingleVehicle(payload: AggregatorVehiclePayload): Promise<SyncVehicleResult> {
  const base: SyncVehicleResult = {
    externalId: payload.external_id,
    brand: payload.brand,
    model: payload.model,
    variant: payload.variant,
    imagesUploaded: 0,
    offersUpserted: 0,
  };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const vehicleId = await upsertVehicleFromAggregator(conn, payload);

    if (payload.specs && Object.keys(payload.specs).length > 0) {
      await upsertVehicleSpecs(conn, vehicleId, payload.specs);
    }

    const uploadedImages: { publicUrl: string; storageKey: string; sortOrder: number }[] = [];

    const slotCount = Math.max(payload.image_urls.length, 1);
    for (let i = 0; i < slotCount; i++) {
      const candidates = await resolveImageCandidates(payload, i);
      for (const url of candidates) {
        try {
          const processed = await processAndUploadImage(url, {
            brand: payload.brand,
            model: payload.model,
            variant: payload.variant,
            year: payload.year,
            index: i,
          });
          uploadedImages.push({
            publicUrl: processed.publicUrl,
            storageKey: processed.storageKey,
            sortOrder: i,
          });
          break;
        } catch (imgErr) {
          const msg = imgErr instanceof Error ? imgErr.message : String(imgErr);
          console.warn(`[sync] image skip ${url}: ${msg}`);
        }
      }
    }

    if (uploadedImages.length > 0) {
      base.imagesUploaded = await replaceAggregatorImages(conn, vehicleId, uploadedImages);
    }

    base.offersUpserted = await upsertAggregatorOffers(conn, vehicleId, payload.active_offers ?? []);
    base.vehicleId = vehicleId;

    await conn.commit();
    return base;
  } catch (err) {
    await conn.rollback();
    const message = err instanceof Error ? err.message : String(err);
    return { ...base, error: message };
  } finally {
    conn.release();
  }
}

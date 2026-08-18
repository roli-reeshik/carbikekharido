import sharp from "sharp";
import { buildImageStorageKey, createVehicleStorage } from "./storage";

const DOWNLOAD_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export interface ProcessedImage {
  publicUrl: string;
  storageKey: string;
  bytes: number;
}

/**
 * Asset pipeline (no hotlinking):
 *   1. Download raw bytes from aggregator/manufacturer URL
 *   2. Resize + convert to WebP (modern, bandwidth-friendly)
 *   3. Upload to owned storage (S3 or local public/uploads)
 */
export async function processAndUploadImage(
  sourceUrl: string,
  meta: { brand: string; model: string; variant: string; year: number; index: number }
): Promise<ProcessedImage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  let raw: Buffer;
  try {
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "CarBikeKharido-Sync/1.0" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} downloading ${sourceUrl}`);
    }
    const arrayBuf = await res.arrayBuffer();
    raw = Buffer.from(arrayBuf);
    if (raw.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Image download failed: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  let optimized: Buffer;
  try {
    optimized = await sharp(raw)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Image optimization failed: ${msg}`);
  }

  const storage = createVehicleStorage();
  const storageKey = buildImageStorageKey(meta);
  const uploaded = await storage.upload(optimized, storageKey, "image/webp");

  return {
    publicUrl: uploaded.publicUrl,
    storageKey: uploaded.storageKey,
    bytes: optimized.byteLength,
  };
}

/**
 * Parallel image downloader for scraped listing photos.
 * Validates, compresses, thumbnails, and uploads to Supabase Storage.
 */
import {
  ALLOWED_IMAGE_MIMES,
  AllowedImageMime,
  MEDIA_LIMITS,
  SUPABASE_STORAGE,
  aggregatedListingObjectPath,
  getPublicObjectUrl,
} from "../supabase.config";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase.client";
import { generateThumbnail, resizeImage, toUploadFileInput } from "../imageUpload";
import type {
  DownloadedImage,
  DownloadProgress,
  DownloadProgressCallback,
  ImageDownloaderOptions,
} from "./persistence.types";

const DEFAULT_MAX_CONCURRENT = 5;
const DEFAULT_MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 30_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isAllowedMime(mime: string): mime is AllowedImageMime {
  return ALLOWED_IMAGE_MIMES.includes(mime as AllowedImageMime);
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R | null>
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

export class ImageDownloader {
  private readonly source: string;
  private readonly maxConcurrent: number;
  private readonly maxRetries: number;
  private readonly quality: number;
  private readonly onProgress?: DownloadProgressCallback;

  constructor(options: ImageDownloaderOptions = {}) {
    this.source = options.source ?? "olx";
    this.maxConcurrent = options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.quality = options.quality ?? MEDIA_LIMITS.imageQuality;
    this.onProgress = options.onProgress;
  }

  /**
   * Download images in parallel (max 5 concurrent by default).
   * Returns public Supabase URLs for successfully uploaded images.
   */
  async downloadImages(urls: string[], listingId: string): Promise<DownloadedImage[]> {
    if (!urls.length) return [];

    if (!isSupabaseConfigured()) {
      console.warn("[ImageDownloader] Supabase not configured — skipping uploads");
      return [];
    }

    const total = urls.length;
    let completed = 0;
    let failed = 0;

    const emit = (currentUrl?: string) => {
      this.onProgress?.({ completed, total, failed, currentUrl });
    };

    const results = await mapConcurrent(urls, this.maxConcurrent, async (url, order) => {
      emit(url);
      const uploaded = await this.downloadOne(url, listingId, order);
      if (uploaded) {
        completed++;
      } else {
        failed++;
      }
      emit();
      return uploaded;
    });

    return results.filter((r): r is DownloadedImage => r !== null);
  }

  private async downloadOne(
    url: string,
    listingId: string,
    order: number
  ): Promise<DownloadedImage | null> {
    let lastErr: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const input = await this.fetchImage(url);
        if (!isAllowedMime(input.mimeType)) {
          throw new Error(`Unsupported image type: ${input.mimeType}`);
        }

        const [fullBuffer, thumbBuffer] = await Promise.all([
          resizeImage(input),
          generateThumbnail(input),
        ]);

        const fullPath = aggregatedListingObjectPath(this.source, listingId, order, "full");
        const thumbPath = aggregatedListingObjectPath(this.source, listingId, order, "thumb");

        const [publicUrl, thumbnailUrl] = await Promise.all([
          this.uploadBuffer(fullPath, fullBuffer),
          this.uploadBuffer(thumbPath, thumbBuffer),
        ]);

        return {
          publicUrl,
          thumbnailUrl,
          order,
          quality: this.quality,
          sourceUrl: url,
        };
      } catch (err) {
        lastErr = err;
        if (attempt < this.maxRetries) {
          await sleep(1000 * 2 ** (attempt - 1));
        }
      }
    }

    console.warn(`[ImageDownloader] failed after ${this.maxRetries} attempts: ${url}`, lastErr);
    return null;
  }

  private async fetchImage(url: string) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/jpeg,image/png,image/webp,image/*",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error(`Empty response for ${url}`);
    }

    if (buffer.length > MEDIA_LIMITS.imageMaxBytes) {
      throw new Error(`Image exceeds size limit (${buffer.length} bytes)`);
    }

    return toUploadFileInput(buffer, {
      mimeType: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
      fileName: `scrape-${Date.now()}.jpg`,
    });
  }

  private async uploadBuffer(path: string, buffer: Buffer): Promise<string> {
    const supabase = getSupabaseAdmin();
    let lastErr: unknown;

    for (let attempt = 1; attempt <= SUPABASE_STORAGE.maxRetries; attempt++) {
      try {
        const { error } = await supabase.storage
          .from(SUPABASE_STORAGE.bucket)
          .upload(path, buffer, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "3600",
          });

        if (error) throw new Error(error.message);
        return getPublicObjectUrl(path);
      } catch (err) {
        lastErr = err;
        if (attempt < SUPABASE_STORAGE.maxRetries) {
          await sleep(SUPABASE_STORAGE.retryDelayMs * attempt);
        }
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}

export type { DownloadProgress, DownloadProgressCallback };

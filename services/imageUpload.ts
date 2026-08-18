/**
 * Vehicle listing image/video upload service — Supabase Storage + Sharp processing.
 *
 * Server-only: import from API routes or server actions, not client components.
 *
 * @example
 * const result = await uploadImage(fileInput, {
 *   userId: "user_abc",
 *   listingId: "listing_xyz",
 *   order: 0,
 *   onProgress: (e) => console.log(e.percent),
 * });
 */

import sharp from "sharp";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  AllowedImageMime,
  AllowedVideoMime,
  MEDIA_LIMITS,
  SUPABASE_STORAGE,
  getPublicObjectUrl,
  listingObjectPath,
  pathFromPublicUrl,
} from "./supabase.config";
import { getSupabaseAdmin } from "./supabase.client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadFileInput {
  /** Raw file bytes. */
  data: Buffer;
  mimeType: string;
  fileName: string;
  size: number;
}

export interface UploadProgressEvent {
  phase: "validate" | "process" | "upload" | "done";
  /** 0–100 */
  percent: number;
  message?: string;
}

export interface UploadContext {
  userId: string;
  listingId: string;
  order: number;
  onProgress?: (event: UploadProgressEvent) => void;
}

export interface UploadImageResult {
  url: string;
  thumbnailUrl: string;
  path: string;
  thumbnailPath: string;
}

export interface UploadVideoResult {
  url: string;
  path: string;
}

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_type"
      | "file_too_large"
      | "processing_failed"
      | "upload_failed"
      | "not_configured"
      | "delete_failed"
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emit(ctx: UploadContext | undefined, event: UploadProgressEvent) {
  ctx?.onProgress?.(event);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  onProgress?: (attempt: number) => void
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= SUPABASE_STORAGE.maxRetries; attempt++) {
    try {
      onProgress?.(attempt);
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < SUPABASE_STORAGE.maxRetries) {
        await sleep(SUPABASE_STORAGE.retryDelayMs * attempt);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new ImageUploadError(`${label} failed after ${SUPABASE_STORAGE.maxRetries} attempts`, "upload_failed");
}

/** Normalize browser File / Node Buffer into UploadFileInput. */
export async function toUploadFileInput(
  file: File | UploadFileInput | Buffer,
  meta?: { mimeType?: string; fileName?: string }
): Promise<UploadFileInput> {
  if (Buffer.isBuffer(file)) {
    return {
      data: file,
      mimeType: meta?.mimeType ?? "application/octet-stream",
      fileName: meta?.fileName ?? "upload",
      size: file.length,
    };
  }
  if ("data" in file && Buffer.isBuffer(file.data)) {
    return file;
  }
  const webFile = file as File;
  const buffer = Buffer.from(await webFile.arrayBuffer());
  return {
    data: buffer,
    mimeType: webFile.type,
    fileName: webFile.name,
    size: webFile.size,
  };
}

function assertImageMime(mime: string): asserts mime is AllowedImageMime {
  if (!ALLOWED_IMAGE_MIMES.includes(mime as AllowedImageMime)) {
    throw new ImageUploadError(
      `Invalid image type "${mime}". Allowed: JPEG, PNG, WebP`,
      "invalid_type"
    );
  }
}

function assertVideoMime(mime: string): asserts mime is AllowedVideoMime {
  if (!ALLOWED_VIDEO_MIMES.includes(mime as AllowedVideoMime)) {
    throw new ImageUploadError(
      `Invalid video type "${mime}". Allowed: MP4, WebM`,
      "invalid_type"
    );
  }
}

async function uploadBuffer(
  path: string,
  buffer: Buffer,
  contentType: string,
  ctx?: UploadContext
): Promise<string> {
  const supabase = getSupabaseAdmin();

  await withRetry(`Upload ${path}`, async () => {
    emit(ctx, { phase: "upload", percent: 70, message: `Uploading ${path}` });
    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE.bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });
    if (error) throw new ImageUploadError(error.message, "upload_failed");
  });

  emit(ctx, { phase: "upload", percent: 95, message: "Finalizing URL" });
  return getPublicObjectUrl(path);
}

// ---------------------------------------------------------------------------
// Image processing (Sharp)
// ---------------------------------------------------------------------------

/**
 * Resize and compress image to WebP at configured quality (default 80%).
 * Max width capped at 1600px; aspect ratio preserved.
 */
export async function resizeImage(file: UploadFileInput): Promise<Buffer> {
  assertImageMime(file.mimeType);
  if (file.size > MEDIA_LIMITS.imageMaxBytes) {
    throw new ImageUploadError(
      `Image exceeds ${MEDIA_LIMITS.imageMaxBytes / (1024 * 1024)} MB limit`,
      "file_too_large"
    );
  }

  try {
    return await sharp(file.data)
      .rotate() // respect EXIF orientation
      .resize({
        width: MEDIA_LIMITS.imageMaxWidth,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: MEDIA_LIMITS.imageQuality })
      .toBuffer();
  } catch (err) {
    throw new ImageUploadError(
      err instanceof Error ? err.message : "Image processing failed",
      "processing_failed"
    );
  }
}

/** Generate 200×150 WebP thumbnail (cover crop). */
export async function generateThumbnail(file: UploadFileInput): Promise<Buffer> {
  assertImageMime(file.mimeType);

  try {
    return await sharp(file.data)
      .rotate()
      .resize(MEDIA_LIMITS.thumbnailWidth, MEDIA_LIMITS.thumbnailHeight, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: MEDIA_LIMITS.imageQuality })
      .toBuffer();
  } catch (err) {
    throw new ImageUploadError(
      err instanceof Error ? err.message : "Thumbnail generation failed",
      "processing_failed"
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload a listing photo: validate → resize (WebP) → thumbnail → Supabase Storage.
 * Returns public CDN URLs for full image and thumbnail.
 */
export async function uploadImage(
  file: File | UploadFileInput | Buffer,
  ctx: UploadContext,
  meta?: { mimeType?: string; fileName?: string }
): Promise<UploadImageResult> {
  emit(ctx, { phase: "validate", percent: 5, message: "Validating image" });

  const input = await toUploadFileInput(file, meta);
  assertImageMime(input.mimeType);

  if (input.size > MEDIA_LIMITS.imageMaxBytes) {
    throw new ImageUploadError(
      `Image must be under ${MEDIA_LIMITS.imageMaxBytes / (1024 * 1024)} MB`,
      "file_too_large"
    );
  }

  emit(ctx, { phase: "process", percent: 20, message: "Compressing image" });
  const [fullBuffer, thumbBuffer] = await Promise.all([
    resizeImage(input),
    generateThumbnail(input),
  ]);

  const fullPath = listingObjectPath(ctx.userId, ctx.listingId, ctx.order, "webp", "full");
  const thumbPath = listingObjectPath(ctx.userId, ctx.listingId, ctx.order, "webp", "thumb");

  emit(ctx, { phase: "upload", percent: 50, message: "Uploading to storage" });

  const [url, thumbnailUrl] = await Promise.all([
    uploadBuffer(fullPath, fullBuffer, "image/webp", ctx),
    uploadBuffer(thumbPath, thumbBuffer, "image/webp", ctx),
  ]);

  emit(ctx, { phase: "done", percent: 100, message: "Upload complete" });

  return { url, thumbnailUrl, path: fullPath, thumbnailPath: thumbPath };
}

/**
 * Upload a listing video (no transcode — stored as-is after validation).
 */
export async function uploadVideo(
  file: File | UploadFileInput | Buffer,
  ctx: UploadContext,
  meta?: { mimeType?: string; fileName?: string }
): Promise<UploadVideoResult> {
  emit(ctx, { phase: "validate", percent: 5, message: "Validating video" });

  const input = await toUploadFileInput(file, meta);
  assertVideoMime(input.mimeType);

  if (input.size > MEDIA_LIMITS.videoMaxBytes) {
    throw new ImageUploadError(
      `Video must be under ${MEDIA_LIMITS.videoMaxBytes / (1024 * 1024)} MB`,
      "file_too_large"
    );
  }

  const ext = input.mimeType === "video/webm" ? "webm" : "mp4";
  const path = listingObjectPath(ctx.userId, ctx.listingId, ctx.order, ext, "full");

  emit(ctx, { phase: "upload", percent: 40, message: "Uploading video" });
  const url = await uploadBuffer(path, input.data, input.mimeType, ctx);

  emit(ctx, { phase: "done", percent: 100, message: "Upload complete" });
  return { url, path };
}

/**
 * Delete an object (and its thumbnail sibling if the URL points to a full image) by public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) {
    throw new ImageUploadError("Invalid Supabase public URL", "delete_failed");
  }

  const supabase = getSupabaseAdmin();
  const pathsToRemove = [path];

  // If deleting full image, also remove matching -thumb variant
  if (path.endsWith(".webp") && !path.includes("-thumb.")) {
    pathsToRemove.push(path.replace(/\.webp$/, "-thumb.webp"));
  }

  await withRetry("Delete storage object", async () => {
    const { error } = await supabase.storage.from(SUPABASE_STORAGE.bucket).remove(pathsToRemove);
    if (error) throw new ImageUploadError(error.message, "delete_failed");
  });
}

/** Batch upload helper for sell form step 2. */
export async function uploadListingMedia(
  files: Array<{ file: File | UploadFileInput; type: "photo" | "video"; order: number }>,
  ctx: Omit<UploadContext, "order"> & {
    onProgress?: (order: number, event: UploadProgressEvent) => void;
  }
): Promise<
  Array<{
    order: number;
    type: "photo" | "video";
    url: string;
    thumbnailUrl?: string;
  }>
> {
  const results: Array<{
    order: number;
    type: "photo" | "video";
    url: string;
    thumbnailUrl?: string;
  }> = [];

  for (const item of files) {
    const itemCtx: UploadContext = {
      ...ctx,
      order: item.order,
      onProgress: (e) => ctx.onProgress?.(item.order, e),
    };

    if (item.type === "photo") {
      const r = await uploadImage(item.file, itemCtx);
      results.push({
        order: item.order,
        type: "photo",
        url: r.url,
        thumbnailUrl: r.thumbnailUrl,
      });
    } else {
      const r = await uploadVideo(item.file, itemCtx);
      results.push({ order: item.order, type: "video", url: r.url });
    }
  }

  return results;
}

export { SUPABASE_STORAGE, MEDIA_LIMITS };

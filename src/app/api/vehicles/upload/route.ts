import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiError, apiFromError, apiSuccess } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import {
  ImageUploadError,
  uploadImage,
  uploadVideo,
  UploadProgressEvent,
} from "../../../../../services/imageUpload";
import { isSupabaseConfigured } from "../../../../../services/supabase.client";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/vehicles/upload
 * Multipart upload → Supabase Storage (server-side processing).
 *
 * Form fields:
 *   file       — the media file
 *   listingId  — listing id (or "draft" before create)
 *   order      — display order (number)
 *   type       — "photo" | "video"
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError("not_configured", "Supabase storage is not configured", 503);
    }

    checkRateLimit(req, "vehicles/upload", 30, 60_000);
    const auth = await requireMarketplaceAuth(req);

    const form = await req.formData();
    const file = form.get("file");
    const listingId = String(form.get("listingId") || "draft");
    const order = Number(form.get("order") ?? 0);
    const type = String(form.get("type") || "photo");

    if (!file || !(file instanceof Blob)) {
      return apiError("missing_file", "No file provided", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const fileName = "name" in file ? String((file as File).name) : "upload";

    const progressLog: UploadProgressEvent[] = [];
    const ctx = {
      userId: auth.appUser.id,
      listingId,
      order,
      onProgress: (e: UploadProgressEvent) => progressLog.push(e),
    };

    const input = { data: buffer, mimeType, fileName, size: buffer.length };

    const result =
      type === "video"
        ? await uploadVideo(input, ctx)
        : await uploadImage(input, ctx);

    return apiSuccess({
      ...result,
      progress: progressLog,
    });
  } catch (err) {
    if (err instanceof ImageUploadError) {
      return apiError(err.code, err.message, 400);
    }
    return apiFromError(err);
  }
}

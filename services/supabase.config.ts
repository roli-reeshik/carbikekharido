/**
 * Supabase Storage configuration for vehicle listing media.
 *
 * Bucket setup (Supabase Dashboard → Storage):
 * 1. Create bucket `vehicle-listings`
 * 2. Public bucket: ON (read-only public access for listing photos)
 * 3. Enable CDN on project (default for Supabase Storage public URLs)
 * 4. Optional RLS policy for authenticated uploads:
 *    - INSERT: authenticated users to `listings/{userId}/**`
 *    - SELECT: public
 *
 * Env vars (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (server uploads only — never expose to client)
 */

export const SUPABASE_STORAGE = {
  bucket: "vehicle-listings",
  /** Object key prefix inside the bucket. */
  pathPrefix: "listings",
  publicAccess: true,
  cdnEnabled: true,
  maxRetries: 3,
  retryDelayMs: 750,
} as const;

export const MEDIA_LIMITS = {
  imageMaxBytes: 5 * 1024 * 1024,
  videoMaxBytes: 50 * 1024 * 1024,
  imageQuality: 80,
  thumbnailWidth: 200,
  thumbnailHeight: 150,
  imageMaxWidth: 1600,
} as const;

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm"] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];
export type AllowedVideoMime = (typeof ALLOWED_VIDEO_MIMES)[number];

export function listingObjectPath(
  userId: string,
  listingId: string,
  order: number,
  ext: string,
  variant: "full" | "thumb" = "full"
): string {
  const suffix = variant === "thumb" ? `-thumb` : "";
  return `${SUPABASE_STORAGE.pathPrefix}/${userId}/${listingId}/${order}${suffix}.${ext}`;
}

/** Storage path for scraped aggregated listing images. */
export function aggregatedListingObjectPath(
  source: string,
  listingId: string,
  order: number,
  variant: "full" | "thumb" = "full"
): string {
  const suffix = variant === "thumb" ? "-thumb" : "";
  return `aggregated-listings/${source}/${listingId}/${order}${suffix}.webp`;
}

export function getPublicObjectUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${SUPABASE_STORAGE.bucket}/${storagePath}`;
}

/** Extract storage object path from a public Supabase URL (for delete). */
export function pathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${SUPABASE_STORAGE.bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

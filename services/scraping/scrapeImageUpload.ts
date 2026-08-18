/**
 * @deprecated Prefer ImageDownloader — kept for backward compatibility.
 */
import { ImageDownloader } from "./imageDownloader";
import type { DownloadedImage } from "./persistence.types";

export async function uploadScrapedImageUrl(
  imageUrl: string,
  listingExternalId: string,
  order: number
): Promise<{ url: string; thumbnailUrl: string } | null> {
  const downloader = new ImageDownloader({ source: "olx", maxConcurrent: 1 });
  const results = await downloader.downloadImages([imageUrl], listingExternalId);
  const hit = results.find((r) => r.order === order) ?? results[0];
  if (!hit) return null;
  return { url: hit.publicUrl, thumbnailUrl: hit.thumbnailUrl };
}

export async function uploadScrapedImages(
  urls: string[],
  listingExternalId: string
): Promise<{ url: string; thumbnailUrl?: string }[]> {
  const downloader = new ImageDownloader({ source: "olx" });
  const results = await downloader.downloadImages(urls, listingExternalId);
  return results.map((r) => ({ url: r.publicUrl, thumbnailUrl: r.thumbnailUrl }));
}

export { ImageDownloader };
export type { DownloadedImage };

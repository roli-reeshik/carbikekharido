"use client";

import { getAuthToken } from "@/lib/session";
import type { UploadProgressEvent } from "../../../services/imageUpload";

export interface ClientUploadOptions {
  listingId: string;
  order: number;
  type: "photo" | "video";
  onProgress?: (event: UploadProgressEvent) => void;
}

export interface ClientUploadResult {
  url: string;
  thumbnailUrl?: string;
  path?: string;
}

/**
 * Browser helper — uploads via POST /api/vehicles/upload with XHR progress events.
 * Use in sell form step 2 instead of base64 localStorage when Supabase is enabled.
 */
export function uploadListingFile(
  file: File,
  opts: ClientUploadOptions
): Promise<ClientUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("listingId", opts.listingId);
    form.append("order", String(opts.order));
    form.append("type", opts.type);

    xhr.open("POST", "/api/vehicles/upload");

    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        opts.onProgress?.({
          phase: "upload",
          percent: Math.round((ev.loaded / ev.total) * 100),
          message: "Uploading…",
        });
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.ok) {
          opts.onProgress?.({ phase: "done", percent: 100, message: "Complete" });
          resolve(json.data);
        } else {
          reject(new Error(json.error || "Upload failed"));
        }
      } catch {
        reject(new Error("Invalid server response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}

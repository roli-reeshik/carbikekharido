"use client";

import { useCallback, useRef, useState } from "react";
import { useSellListing } from "@/lib/sell/SellListingProvider";
import { FieldErrorsSummary, FormSection } from "@/lib/sell/components/FormField";
import { compressImage, isAllowedMediaFile, readFileAsDataUrl } from "@/lib/sell/mediaUtils";
import { MAX_PHOTOS, MAX_VIDEOS, MIN_PHOTOS, SellMediaItem } from "@/lib/sell/types";

export default function Step2Media() {
  const { draft, errors, patchDraft, goNext, goBack } = useSellListing();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(draft.media[0]?.id ?? null);

  const photos = draft.media.filter((m) => m.type === "photo");
  const videos = draft.media.filter((m) => m.type === "video");
  const active = draft.media.find((m) => m.id === activeId) ?? draft.media[0];

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setLocalError(null);
      const list = Array.from(files);
      let photoCount = photos.length;
      let videoCount = videos.length;
      const newItems: SellMediaItem[] = [];

      setUploading(true);
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setUploadProgress(Math.round(((i + 1) / list.length) * 100));

        const check = isAllowedMediaFile(file);
        if (!check.ok) {
          setLocalError(check.error ?? "Invalid file");
          continue;
        }

        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          if (videoCount >= MAX_VIDEOS) {
            setLocalError(`Maximum ${MAX_VIDEOS} videos allowed`);
            continue;
          }
          videoCount++;
        } else {
          if (photoCount >= MAX_PHOTOS) {
            setLocalError(`Maximum ${MAX_PHOTOS} photos allowed`);
            continue;
          }
          photoCount++;
        }

        try {
          const previewUrl = isVideo ? await readFileAsDataUrl(file) : await compressImage(file, 0.8);
          newItems.push({
            id: crypto.randomUUID(),
            type: isVideo ? "video" : "photo",
            previewUrl,
            fileName: file.name,
            order: draft.media.length + newItems.length,
            isThumb: draft.media.length === 0 && newItems.length === 0,
          });
        } catch {
          setLocalError(`Failed to process ${file.name}`);
        }
      }

      if (newItems.length) {
        const merged = [...draft.media, ...newItems].map((m, idx) => ({ ...m, order: idx }));
        patchDraft({ media: merged });
        if (!activeId && merged[0]) setActiveId(merged[0].id);
      }
      setUploading(false);
      setUploadProgress(0);
    },
    [activeId, draft.media, patchDraft, photos.length, videos.length]
  );

  function removeItem(id: string) {
    const next = draft.media.filter((m) => m.id !== id).map((m, i) => ({ ...m, order: i }));
    if (next.length && !next.some((m) => m.isThumb) && next[0]?.type === "photo") {
      next[0].isThumb = true;
    }
    patchDraft({ media: next });
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  }

  function setThumb(id: string) {
    patchDraft({
      media: draft.media.map((m) => ({ ...m, isThumb: m.id === id })),
    });
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= draft.media.length) return;
    const items = [...draft.media];
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    patchDraft({ media: items.map((m, i) => ({ ...m, order: i })) });
  }

  const canContinue = photos.length >= MIN_PHOTOS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-sell-primary">Photos & videos</h1>
        <p className="mt-1 text-sm text-ink/55">Add at least {MIN_PHOTOS} clear photos. First photo is the cover.</p>
      </div>

      <FieldErrorsSummary errors={errors} />
      {localError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {localError}
        </p>
      )}

      {/* Main preview */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="relative aspect-video bg-paper">
          {active ? (
            active.type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.previewUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <video src={active.previewUrl} controls className="h-full w-full object-contain" />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-ink/30">No media yet</div>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-sell-primary px-3 py-1 text-xs font-bold text-white">
            {photos.length}/{MAX_PHOTOS} photos · {videos.length}/{MAX_VIDEOS} videos
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <FormSection title="Upload">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragOver
              ? "border-sell-accent bg-sell-accent/5"
              : "border-line hover:border-sell-primary/50 hover:bg-sell-primary/5"
          }`}
        >
          <p className="text-lg font-medium text-sell-primary">Drag & drop files here</p>
          <p className="mt-1 text-sm text-ink/50">or click to browse · JPEG, PNG, WebP · MP4, WebM</p>
          <p className="mt-2 text-xs text-ink/40">Max 5 MB/image · 50 MB/video</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => e.target.files && void addFiles(e.target.files)}
          />
        </div>

        {uploading && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-sell-accent transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink/45">Processing… {uploadProgress}%</p>
          </div>
        )}
      </FormSection>

      {/* Thumbnails */}
      {draft.media.length > 0 && (
        <FormSection title="Reorder & manage">
          <div className="flex flex-wrap gap-2">
            {draft.media.map((item, index) => (
              <div
                key={item.id}
                className={`group relative h-20 w-20 overflow-hidden rounded-lg border-2 ${
                  activeId === item.id ? "border-sell-accent" : "border-line"
                }`}
              >
                <button type="button" className="h-full w-full" onClick={() => setActiveId(item.id)}>
                  {item.type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center bg-ink/10 text-xs">▶ Video</span>
                  )}
                </button>
                {item.isThumb && (
                  <span className="absolute left-0 top-0 bg-sell-emerald px-1 text-[9px] font-bold text-white">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/50 p-0.5 opacity-0 transition group-hover:opacity-100">
                  {item.type === "photo" && (
                    <button type="button" className="text-[10px] text-white" onClick={() => setThumb(item.id)}>
                      ★
                    </button>
                  )}
                  <button type="button" className="text-[10px] text-white" onClick={() => moveItem(index, index - 1)}>
                    ←
                  </button>
                  <button type="button" className="text-[10px] text-white" onClick={() => moveItem(index, index + 1)}>
                    →
                  </button>
                  <button type="button" className="text-[10px] text-red-300" onClick={() => removeItem(item.id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      )}

      <div className="flex justify-between gap-3">
        <button type="button" onClick={goBack} className="btn-sell-ghost">
          ← Back
        </button>
        <button type="button" onClick={goNext} className="btn-sell-secondary" disabled={!canContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { ListingImage } from "@/lib/buy/listingDetail";

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const photos = images.filter((i) => i.type === "PHOTO");
  const media = images.length ? images : [];
  const [index, setIndex] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const current = media[index] ?? null;
  const total = media.length;

  const go = useCallback(
    (delta: number) => {
      if (!total) return;
      setIndex((i) => (i + delta + total) % total);
    },
    [total]
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = mainRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  if (!total) {
    return (
      <div
        className="listing-gallery-main flex aspect-[3/2] max-h-[400px] w-full items-center justify-center rounded-xl bg-paper text-6xl opacity-30"
        aria-label="No images"
      >
        🚗
      </div>
    );
  }

  return (
    <div className="listing-gallery">
      <div
        ref={mainRef}
        className="listing-gallery-main relative aspect-[3/2] max-h-[400px] w-full overflow-hidden rounded-xl bg-paper"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setZoomOrigin("50% 50%")}
      >
        {current?.type === "VIDEO" ? (
          <video
            src={current.url}
            className="listing-gallery-zoom h-full w-full object-cover"
            style={{ transformOrigin: zoomOrigin }}
            controls
            aria-label={`Video of ${title}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current?.url ?? photos[0]?.url}
            alt={title}
            className="listing-gallery-zoom h-full w-full object-cover"
            style={{ transformOrigin: zoomOrigin }}
          />
        )}

        {current?.type === "VIDEO" && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">
            ▶ Video
          </span>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="listing-gallery-nav absolute left-2 top-1/2 -translate-y-1/2"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="listing-gallery-nav absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Next image"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} of {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Gallery thumbnails">
          {media.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Image ${i + 1}${img.type === "VIDEO" ? " video" : ""}`}
              onClick={() => setIndex(i)}
              className={`listing-gallery-thumb relative shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? "border-sell-accent" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              {img.type === "VIDEO" ? (
                <span className="flex h-20 w-20 items-center justify-center bg-ink/80 text-white">▶</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="h-20 w-20 object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

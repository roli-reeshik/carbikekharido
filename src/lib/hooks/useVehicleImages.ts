"use client";

import { useEffect, useState } from "react";
import { Vehicle } from "@/lib/vehicles";

/**
 * Resolved image URLs, keyed by vehicle id. `null` means the lookup completed
 * and found nothing, which is distinct from "not resolved yet".
 */
export type VehicleImageMap = Record<string, string | null>;

/** Survives remounts and the car/bike toggle so images resolve only once. */
const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

function cacheKey(v: Vehicle): string {
  return `${v.type}:${v.brand ?? ""}:${v.modelName ?? ""}`;
}

function resolve(v: Vehicle): Promise<string | null> {
  const key = cacheKey(v);
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);

  const existing = inFlight.get(key);
  if (existing) return existing;

  if (!v.brand || !v.modelName) {
    cache.set(key, v.officialImageUrl ?? null);
    return Promise.resolve(v.officialImageUrl ?? null);
  }

  const params = new URLSearchParams({
    brand: v.brand,
    model: v.modelName,
    type: v.type,
  });

  const p = fetch(`/api/media/vehicle?${params}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { imageUrl?: string } | null) => d?.imageUrl ?? null)
    .catch(() => null)
    .then((url) => {
      cache.set(key, url);
      inFlight.delete(key);
      return url;
    });

  inFlight.set(key, p);
  return p;
}

/** Decodes the bitmap so a later swap paints immediately instead of flashing. */
function warm(url: string): Promise<void> {
  return new Promise((done) => {
    const img = new Image();
    img.onload = () => done();
    img.onerror = () => done();
    img.src = url;
  });
}

/**
 * Resolves and pre-decodes imagery for a whole set of vehicles at once, so a
 * rotating showcase never swaps to a frame that has not painted yet.
 */
export function useVehicleImages(vehicles: Vehicle[]): {
  images: VehicleImageMap;
  ready: boolean;
} {
  const ids = vehicles.map((v) => v.id).join(",");
  const [images, setImages] = useState<VehicleImageMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    if (vehicles.length === 0) {
      setImages({});
      setReady(true);
      return;
    }

    Promise.all(
      vehicles.map(async (v) => {
        const url = await resolve(v);
        if (url) await warm(url);
        return [v.id, url] as const;
      })
    ).then((pairs) => {
      if (cancelled) return;
      setImages(Object.fromEntries(pairs));
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
    // `ids` captures the identity of the set; `vehicles` is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return { images, ready };
}

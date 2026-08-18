"use client";

import { useEffect, useState } from "react";
import { BodyType, VehicleType } from "@/lib/vehicles";
import { VehicleIllustration } from "./VehicleIllustration";

interface Props {
  searchTerm: string;
  vehicleType: VehicleType;
  bodyType: BodyType;
  brand?: string;
  modelName?: string;
  /** Pre-resolved live image (from /api/catalog). Local /uploads paths are ignored. */
  officialImageUrl?: string;
  className?: string;
}

function isLocalUpload(url?: string): boolean {
  return !!url && (url.startsWith("/uploads/") || url.includes("/uploads/vehicles/"));
}

/**
 * Live-first vehicle imagery:
 *   1. CarDekho / BikeDekho photo via /api/media/vehicle (or catalog preload)
 *   2. SVG silhouette fallback
 */
export function VehiclePhoto({
  searchTerm,
  vehicleType,
  bodyType,
  brand,
  modelName,
  officialImageUrl,
  className = "",
}: Props) {
  const [liveUrl, setLiveUrl] = useState<string | null>(
    officialImageUrl && !isLocalUpload(officialImageUrl) ? officialImageUrl : null
  );
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!liveUrl && !!brand && !!modelName);

  useEffect(() => {
    if (officialImageUrl && !isLocalUpload(officialImageUrl)) {
      setLiveUrl(officialImageUrl);
      setFailed(false);
      setLoading(false);
      return;
    }

    if (!brand || !modelName) {
      setLiveUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    const params = new URLSearchParams({
      brand,
      model: modelName,
      type: vehicleType,
    });

    fetch(`/api/media/vehicle?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { imageUrl?: string } | null) => {
        if (!cancelled) {
          setLiveUrl(data?.imageUrl ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveUrl(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [brand, modelName, vehicleType, officialImageUrl]);

  if (loading) {
    return <div className={`animate-pulse bg-line ${className}`} aria-hidden />;
  }

  if (liveUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={liveUrl}
        alt={searchTerm}
        className={className}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return <VehicleIllustration vehicleType={vehicleType} bodyType={bodyType} className={className} />;
}

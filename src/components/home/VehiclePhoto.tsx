"use client";

import { useEffect, useState } from "react";
import { BodyType, VehicleType } from "@/lib/vehicles";
import { getCuratedVehiclePhoto } from "@/lib/curatedVehicleImages";

interface Props {
  searchTerm: string;
  vehicleType: VehicleType;
  bodyType: BodyType;
  brand?: string;
  modelName?: string;
  officialImageUrl?: string;
  className?: string;
}

function isLocalUpload(url?: string): boolean {
  return !!url && (url.startsWith("/uploads/") || url.includes("/uploads/vehicles/"));
}

export function VehiclePhoto({
  searchTerm,
  vehicleType,
  bodyType,
  brand,
  modelName,
  officialImageUrl,
  className = "",
}: Props) {
  // 1. Check curated high-resolution photography first (guaranteed 100% cloud uptime)
  const curatedPhoto = getCuratedVehiclePhoto({
    brand,
    model: modelName || searchTerm,
    vehicleType,
    bodyType,
  });

  const initialUrl = officialImageUrl && !isLocalUpload(officialImageUrl) ? officialImageUrl : curatedPhoto;
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialUrl ?? null);

  useEffect(() => {
    if (officialImageUrl && !isLocalUpload(officialImageUrl)) {
      setPhotoUrl(officialImageUrl);
      return;
    }

    const fallback = getCuratedVehiclePhoto({
      brand,
      model: modelName || searchTerm,
      vehicleType,
      bodyType,
    });

    if (fallback) {
      setPhotoUrl(fallback);
    }
  }, [brand, modelName, vehicleType, bodyType, officialImageUrl, searchTerm]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl || getCuratedVehiclePhoto({ vehicleType, bodyType }) || "/assets/vehicles/ferrari-sf90.svg"}
      alt={searchTerm || `${brand || ""} ${modelName || ""}`}
      className={`h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105 ${className}`}
      loading="lazy"
      onError={(e) => {
        // Fallback to category photo on error
        const target = e.currentTarget;
        const catFallback = getCuratedVehiclePhoto({ vehicleType, bodyType });
        if (catFallback && target.src !== catFallback) {
          target.src = catFallback;
        }
      }}
    />
  );
}

"use client";

import Link from "next/link";
import { VehicleDetailsResult } from "@/lib/db/vehiclesRepo";
import { VehicleHubWorkspace } from "./VehicleHubWorkspace";

const PLACEHOLDER_IMAGE_PATH = "/placeholder-vehicle.png";

type Vehicle = VehicleDetailsResult["vehicle"];

export function VehicleDetailView({ vehicle, images }: { vehicle: Vehicle; images: string[] }) {
  const accentVar = vehicle.vehicleType === "bike" ? "var(--accent-bike)" : "var(--accent-car)";
  const accentSoftVar = vehicle.vehicleType === "bike" ? "var(--accent-bike-soft)" : "var(--accent-car-soft)";

  const [heroImage, ...thumbs] = images.length > 0 ? images : [PLACEHOLDER_IMAGE_PATH];

  return (
    <div
      className="vehicle-detail-theme"
      style={{ ["--accent" as string]: accentVar, ["--accent-soft" as string]: accentSoftVar }}
    >
      <div className="shell">
        <div className="top-row">
          <div className="wordmark">
            CARBIKE<span>.</span>DEKHO
          </div>
          <Link href="/" className="back-link">
            ← Back to catalog
          </Link>
        </div>

        <div className="hero-zone">
          <div className="hero-image-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={`${vehicle.brand} ${vehicle.model} ${vehicle.variant}`}
              className="reveal"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_IMAGE_PATH;
              }}
            />
          </div>
          <div className="hero-info-card reveal" style={{ animationDelay: "0.1s" }}>
            <span className="hero-badge display">{vehicle.vehicleType.toUpperCase()}</span>
            <h1 className="hero-title display">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="hero-subtitle">
              {vehicle.variant}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </p>
            <p className="hero-price display">{vehicle.exShowroomPriceLabel}</p>
          </div>
        </div>

        {thumbs.length > 0 && (
          <div className="thumb-strip">
            {thumbs.map((url, i) => (
              <div key={url} className="thumb-tile reveal" style={{ animationDelay: `${0.15 + 0.08 * (i + 1)}s` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${vehicle.brand} ${vehicle.model} detail`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER_IMAGE_PATH;
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <VehicleHubWorkspace variantId={vehicle.id} />
      </div>
    </div>
  );
}

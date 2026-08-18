"use client";

import { useEffect, useState } from "react";
import { DEMO_VEHICLES, Vehicle } from "@/lib/vehicles";

/**
 * Homepage catalog — loads India-wide models from CarDekho / BikeDekho index.
 */
export function useVehicleCatalog() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEMO_VEHICLES);
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<{ brands: number; models: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog/search?pageSize=120&page=1")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
          if (data.meta) {
            setStats({ brands: data.meta.brands, models: data.meta.models });
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { vehicles, ready, stats };
}

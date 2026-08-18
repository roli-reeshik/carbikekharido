"use client";

import { useCallback, useEffect, useState } from "react";
import { Vehicle } from "@/lib/vehicles";

export interface CatalogMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  brands: number;
  models: number;
}

// In-memory client cache to make switching between Tabs, Cars, and Bikes 0ms instant
const clientCatalogCache = new Map<
  string,
  { vehicles: Vehicle[]; meta: CatalogMeta | null; timestamp: number }
>();

export function useIndiaCatalogSearch(params: {
  q?: string;
  category?: string;
  brand?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 24));
  const cacheKey = sp.toString();

  const cached = clientCatalogCache.get(cacheKey);

  const [vehicles, setVehicles] = useState<Vehicle[]>(cached?.vehicles ?? []);
  const [meta, setMeta] = useState<CatalogMeta | null>(cached?.meta ?? null);
  const [loading, setLoading] = useState(!cached);

  const fetchCatalog = useCallback(async () => {
    const mem = clientCatalogCache.get(cacheKey);
    if (mem) {
      setVehicles(mem.vehicles);
      setMeta(mem.meta);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/catalog/search?${cacheKey}`);
      const data = await res.json();
      if (Array.isArray(data.vehicles)) {
        clientCatalogCache.set(cacheKey, {
          vehicles: data.vehicles,
          meta: data.meta ?? null,
          timestamp: Date.now(),
        });
        setVehicles(data.vehicles);
        setMeta(data.meta ?? null);
      }
    } catch {
      if (!mem) {
        setVehicles([]);
        setMeta(null);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { vehicles, meta, loading, refresh: fetchCatalog };
}

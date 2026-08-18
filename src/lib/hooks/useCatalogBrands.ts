"use client";

import { useEffect, useState } from "react";

export interface CatalogBrandItem {
  slug: string;
  name: string;
  category: "car" | "bike";
}

export function useCatalogBrands(category?: "car" | "bike" | "all") {
  const [brands, setBrands] = useState<CatalogBrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sp = category ? `?category=${category}` : "";
    fetch(`/api/catalog/brands${sp}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.brands)) setBrands(data.brands);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return { brands, loading };
}

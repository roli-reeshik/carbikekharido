"use client";

import { getAuthToken } from "@/lib/session";

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export interface WishlistItem {
  wishlistId: string;
  savedAt: string;
  listingId: string;
  vehicleType: "CAR" | "BIKE";
  brand: string;
  model: string;
  yearOfManufacture: number;
  askingPrice: string;
  city: string;
  state: string;
  fuelType: string | null;
  transmission: string | null;
  currentMileage: number | null;
  bodyType: string | null;
  thumbnail: string | null;
  verified: boolean;
  sellerType: "INDIVIDUAL" | "DEALER";
  priceAlert: { id: string; maxPrice: string; isActive: boolean } | null;
}

export async function fetchWishlist(sort: "saved" | "price_asc" | "price_desc" = "saved") {
  const res = await fetch(`/api/wishlist?sort=${sort}`, { headers: authHeaders() });
  const json = (await res.json()) as {
    ok?: boolean;
    data?: { items: WishlistItem[]; count: number };
    error?: string;
  };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load wishlist");
  return json.data!;
}

export async function apiAddWishlist(vehicleId: string) {
  const res = await fetch("/api/wishlist/add", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ vehicleId }),
  });
  const json = (await res.json()) as { ok?: boolean; data?: { success: boolean; count: number }; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to add");
  return json.data!;
}

export async function apiRemoveWishlist(vehicleId: string) {
  const res = await fetch(`/api/wishlist/remove?vehicleId=${encodeURIComponent(vehicleId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = (await res.json()) as { ok?: boolean; data?: { success: boolean; count: number }; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to remove");
  return json.data!;
}

export async function apiSetPriceAlert(vehicleId: string, maxPrice: number) {
  const res = await fetch(`/api/wishlist/${encodeURIComponent(vehicleId)}/alert`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ maxPrice }),
  });
  const json = (await res.json()) as { ok?: boolean; data?: { maxPrice: string; triggered?: boolean }; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to set alert");
  return json.data!;
}

export async function apiSendDigest(email?: string) {
  const res = await fetch("/api/wishlist/digest", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(email ? { email } : {}),
  });
  const json = (await res.json()) as { ok?: boolean; data?: { sent: boolean }; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to send digest");
  return json.data!;
}

export async function apiMergeWishlist(listingIds: string[]) {
  const res = await fetch("/api/wishlist/merge", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ listingIds }),
  });
  const json = (await res.json()) as { ok?: boolean; data?: { count: number }; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Merge failed");
  return json.data!;
}

export function exportWishlistCsv(items: WishlistItem[]): string {
  const header = "Brand,Model,Year,Price,City,Saved At,Alert Max Price\n";
  const rows = items.map((i) =>
    [
      i.brand,
      i.model,
      i.yearOfManufacture,
      i.askingPrice,
      i.city,
      i.savedAt,
      i.priceAlert?.maxPrice ?? "",
    ].join(",")
  );
  return header + rows.join("\n");
}

export function wishlistShareUrl(listingIds: string[]): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/vehicles/wishlist?shared=${encodeURIComponent(listingIds.join(","))}`;
}

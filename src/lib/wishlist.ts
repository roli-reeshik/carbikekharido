"use client";

const WISHLIST_KEY = "cbd_wishlist";

/**
 * Wishlist saves are explicitly NOT an intent action (see lib/intent.ts) —
 * they work for anonymous visitors from the first tap, persisted on-device.
 * If/when the visitor later verifies their number for an unrelated reason
 * (e.g. contacting a seller), mergeWishlistIntoAccount() is called once to
 * hand this local list to the account — nothing is ever lost by having
 * browsed anonymously first.
 */
export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(WISHLIST_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function toggleWishlist(vehicleId: string): string[] {
  const current = getWishlist();
  const next = current.includes(vehicleId)
    ? current.filter((id) => id !== vehicleId)
    : [...current, vehicleId];
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return next;
}

export function isWishlisted(vehicleId: string): boolean {
  return getWishlist().includes(vehicleId);
}

/**
 * Called once, right after successful OTP verification. In a real backend
 * this POSTs the local list to the user's new/existing account record.
 * Demo version just logs — wire this to your account-service call.
 */
export async function mergeWishlistIntoAccount(phone: string): Promise<void> {
  const local = getWishlist();
  if (local.length === 0) return;
  console.log(`[wishlist-merge] merging ${local.length} saved vehicle(s) into account +91${phone}`);
  // await fetch("/api/account/wishlist/merge", { method: "POST", body: JSON.stringify({ phone, vehicleIds: local }) });
}

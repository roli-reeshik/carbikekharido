"use client";

const MP_WISHLIST_KEY = "cbd_mp_wishlist";
const MP_COMPARE_KEY = "cbd_mp_compare";
export const MAX_COMPARE = 4;

export function getMpWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MP_WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setMpWishlistLocal(ids: string[]) {
  window.localStorage.setItem(MP_WISHLIST_KEY, JSON.stringify(ids));
}

export function toggleMpWishlist(listingId: string): string[] {
  const current = getMpWishlist();
  const next = current.includes(listingId)
    ? current.filter((id) => id !== listingId)
    : [...current, listingId];
  setMpWishlistLocal(next);
  syncWishlistApi(listingId, next.includes(listingId));
  return next;
}

async function syncWishlistApi(listingId: string, adding: boolean) {
  try {
    const { getAuthToken } = await import("@/lib/session");
    const token = getAuthToken();
    if (!token) return;
    const { apiAddWishlist, apiRemoveWishlist } = await import("@/lib/wishlist/apiClient");
    if (adding) await apiAddWishlist(listingId);
    else await apiRemoveWishlist(listingId);
  } catch {
    /* local save still works offline / logged out */
  }
}

export function isMpWishlisted(listingId: string): boolean {
  return getMpWishlist().includes(listingId);
}

export function getMpCompare(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MP_COMPARE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleMpCompare(listingId: string): string[] {
  const current = getMpCompare();
  if (current.includes(listingId)) {
    const next = current.filter((id) => id !== listingId);
    window.localStorage.setItem(MP_COMPARE_KEY, JSON.stringify(next));
    return next;
  }
  const next = current.length >= MAX_COMPARE ? [...current.slice(1), listingId] : [...current, listingId];
  window.localStorage.setItem(MP_COMPARE_KEY, JSON.stringify(next));
  return next;
}

export function isMpCompared(listingId: string): boolean {
  return getMpCompare().includes(listingId);
}

export function setMpCompare(ids: string[]): string[] {
  const next = ids.slice(0, MAX_COMPARE);
  window.localStorage.setItem(MP_COMPARE_KEY, JSON.stringify(next));
  return next;
}

export function addMpCompare(listingId: string): string[] {
  const current = getMpCompare();
  if (current.includes(listingId)) return current;
  const next =
    current.length >= MAX_COMPARE ? [...current.slice(1), listingId] : [...current, listingId];
  return setMpCompare(next);
}

export function removeMpCompare(listingId: string): string[] {
  return setMpCompare(getMpCompare().filter((id) => id !== listingId));
}

/** Clear local marketplace wishlist after server merge. */
export function clearMpWishlistLocal() {
  window.localStorage.removeItem(MP_WISHLIST_KEY);
}

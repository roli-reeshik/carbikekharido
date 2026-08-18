"use client";

const ANON_ID_KEY = "cbd_anon_id";
const AUTH_TOKEN_KEY = "cbd_auth_token";
const AUTH_PHONE_KEY = "cbd_auth_phone";

/**
 * Every visitor gets an anonymous session id the moment they land, with
 * no server round-trip and no login. This id is what wishlist/comparison
 * data is keyed against for anonymous users, so it can be merged into a
 * real account later without ever having been blocked by a login wall.
 */
export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
}

export function getAuthedPhone(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_PHONE_KEY);
}

export function setAuthSession(token: string, phone: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_PHONE_KEY, phone);
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_PHONE_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

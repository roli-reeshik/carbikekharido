const TOKEN_KEY = "scrape_admin_token";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function adminHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...adminHeaders(), ...(init?.headers ?? {}) },
  });
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string };
  if (!res.ok || json.ok === false) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  if (json.data !== undefined) return json.data;
  return json as T;
}

export async function adminPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

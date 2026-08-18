const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export function extractOgImage(html: string): string | null {
  const match =
    html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"[^>]*property="og:image"/i);
  return match?.[1] ?? null;
}

export async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchOgImageFromPage(pageUrl: string): Promise<string | null> {
  const html = await fetchPageHtml(pageUrl);
  if (!html) return null;
  return extractOgImage(html);
}

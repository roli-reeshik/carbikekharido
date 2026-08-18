import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = [
  "stimg.cardekho.com",
  "stimg2.cardekho.com",
  "cdn.bikedekho.com",
  "imgd.aeplcdn.com",
  "upload.wikimedia.org",
];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((host) => target.hostname === host || target.hostname.endsWith(`.${host}`))) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: target.hostname.includes("bikedekho") ? "https://www.bikedekho.com/" : "https://www.cardekho.com/",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream_failed" }, { status: upstream.status });
    }

    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "proxy_failed" }, { status: 502 });
  }
}

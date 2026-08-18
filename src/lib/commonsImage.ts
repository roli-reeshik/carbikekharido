/**
 * Wikimedia Commons vehicle photo lookup.
 * Client code calls fetchCommonsVehicleImage → /api/commons-image proxy.
 * Server route calls fetchCommonsVehicleImageDirect (no recursion).
 */

export interface CommonsImageResult {
  imageUrl: string;
  attributionText: string;
  attributionUrl: string;
  license: string;
}

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

/** Server-side Commons API call (used by /api/commons-image). */
export async function fetchCommonsVehicleImageDirect(
  searchTerm: string
): Promise<CommonsImageResult | null> {
  try {
    const searchUrl = `${COMMONS_API}?action=query&list=search&srnamespace=6&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(
      `${searchTerm} filetype:bitmap`
    )}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const title: string | undefined = searchData?.query?.search?.[0]?.title;
    if (!title) return null;

    const infoUrl = `${COMMONS_API}?action=query&titles=${encodeURIComponent(
      title
    )}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const infoData = await infoRes.json();
    const pages = infoData?.query?.pages ?? {};
    const page = Object.values(pages)[0] as {
      imageinfo?: { url?: string; extmetadata?: Record<string, { value?: string }> }[];
    };
    const imageInfo = page?.imageinfo?.[0];
    if (!imageInfo?.url) return null;

    const meta = imageInfo.extmetadata ?? {};
    return {
      imageUrl: imageInfo.url,
      attributionText: meta.Artist?.value?.replace(/<[^>]+>/g, "") ?? "Wikimedia Commons",
      attributionUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      license: meta.LicenseShortName?.value ?? "See source for license",
    };
  } catch {
    return null;
  }
}

/** Browser-safe wrapper — hits our server proxy. */
export async function fetchCommonsVehicleImage(
  searchTerm: string
): Promise<CommonsImageResult | null> {
  try {
    const res = await fetch(`/api/commons-image?q=${encodeURIComponent(searchTerm)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as CommonsImageResult;
  } catch {
    return null;
  }
}

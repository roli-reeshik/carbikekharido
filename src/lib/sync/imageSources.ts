import { fetchCommonsVehicleImageDirect } from "@/lib/commonsImage";
import { AggregatorVehiclePayload } from "./types";

/**
 * Build ordered download candidates for one image slot.
 * Direct aggregator URLs are tried first; Commons search terms and a dev
 * placeholder cover mock-catalog gaps when hardcoded URLs go stale (404).
 */
export async function resolveImageCandidates(
  payload: AggregatorVehiclePayload,
  index: number
): Promise<string[]> {
  const seen = new Set<string>();
  const candidates: string[] = [];

  const add = (url?: string | null) => {
    if (url && !seen.has(url)) {
      seen.add(url);
      candidates.push(url);
    }
  };

  add(payload.image_urls[index]);

  if (index === 0) {
    const terms =
      payload.image_search_terms ??
      [`${payload.brand} ${payload.model}`, `${payload.model} ${payload.vehicle_type}`];

    for (const term of terms) {
      const commons = await fetchCommonsVehicleImageDirect(term);
      add(commons?.imageUrl);
    }

    if (!process.env.AGGREGATOR_API_URL && candidates.length === 0) {
      add(`https://picsum.photos/seed/${encodeURIComponent(payload.external_id)}/1280/720`);
    }
  }

  return candidates;
}

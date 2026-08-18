import { z } from "zod";

const sortEnum = z.enum(["newest", "popular", "price_asc", "price_desc", "relevance"]);

export const aggregatedListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: sortEnum.default("newest"),
  city: z.string().max(100).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().max(50_000_000).optional(),
  source: z.string().optional(),
  type: z.string().optional(),
});

export const aggregatedSearchQuerySchema = aggregatedListQuerySchema.extend({
  q: z.string().max(120).optional(),
  condition: z.string().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  yearMin: z.coerce.number().int().min(1990).optional(),
  yearMax: z.coerce.number().int().max(2100).optional(),
  mileageMin: z.coerce.number().int().min(0).optional(),
  mileageMax: z.coerce.number().int().max(999_999).optional(),
  bodyType: z.string().optional(),
  ownerType: z.string().optional(),
  sellerType: z.string().optional(),
  aggregatedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  merge: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
});

export type AggregatedListQueryInput = z.infer<typeof aggregatedListQuerySchema>;
export type AggregatedSearchQueryInput = z.infer<typeof aggregatedSearchQuerySchema>;

function splitCsv(val?: string): string[] | undefined {
  if (!val?.trim()) return undefined;
  const arr = val.split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

function parseAggregatedQuery<T extends z.ZodTypeAny>(schema: T, searchParams: URLSearchParams) {
  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) return parsed;

  const raw = parsed.data as AggregatedSearchQueryInput;
  return {
    success: true as const,
    data: {
      ...raw,
      sources: splitCsv(raw.source),
      categories: splitCsv(raw.type)?.map((t) => {
        const u = t.toUpperCase();
        if (u === "BIKE") return "bikes";
        if (u === "CAR") return "cars";
        return t.toLowerCase();
      }),
      conditions: splitCsv(raw.condition),
      fuelTypes: splitCsv(raw.fuel),
      transmissions: splitCsv(raw.transmission),
      bodyTypes: splitCsv(raw.bodyType),
      ownerTypes: splitCsv(raw.ownerType),
      sellerTypes: splitCsv(raw.sellerType),
    },
  };
}

export function parseAggregatedListQuery(searchParams: URLSearchParams) {
  return parseAggregatedQuery(aggregatedListQuerySchema, searchParams);
}

export function parseAggregatedSearchQuery(searchParams: URLSearchParams) {
  return parseAggregatedQuery(aggregatedSearchQuerySchema, searchParams);
}

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] = out[key] ?? [];
    out[key].push(issue.message);
  }
  return out;
}

import { z } from "zod";
import type { UsageProfile } from "./types";

/**
 * Bounds are wide but finite. An ownership period beyond about fifteen years or
 * a distance beyond 100,000 km a year says more about a typo than a rider, and
 * the model would answer either with confident nonsense.
 */
export const ownershipQuerySchema = z.object({
  /** Comma-separated catalog model ids to compare. */
  models: z.string().min(1).optional(),
  kmPerYear: z.coerce.number().min(500).max(100000).default(10000),
  years: z.coerce.number().min(1).max(15).default(5),
  petrolPriceInr: z.coerce.number().min(50).max(300).optional(),
  electricityPriceInr: z.coerce.number().min(1).max(50).optional(),
  comprehensiveInsurance: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),

  bodyType: z.string().max(40).optional(),
  electricOnly: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  maxPriceInr: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export type OwnershipQuery = z.infer<typeof ownershipQuerySchema>;

export function parseOwnershipQuery(params: URLSearchParams) {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value !== "") raw[key] = value;
  });
  return ownershipQuerySchema.safeParse(raw);
}

/** Split a validated query into the usage profile, the model list and filters. */
export function splitOwnershipQuery(query: OwnershipQuery): {
  usage: UsageProfile;
  modelIds: string[];
  filters: { bodyType?: string; electricOnly?: boolean; maxPriceInr?: number; limit?: number };
} {
  const modelIds = (query.models ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  return {
    usage: {
      kmPerYear: query.kmPerYear,
      years: query.years,
      petrolPriceInr: query.petrolPriceInr,
      electricityPriceInr: query.electricityPriceInr,
      comprehensiveInsurance: query.comprehensiveInsurance,
    },
    modelIds,
    filters: {
      bodyType: query.bodyType,
      electricOnly: query.electricOnly,
      maxPriceInr: query.maxPriceInr,
      limit: query.limit,
    },
  };
}

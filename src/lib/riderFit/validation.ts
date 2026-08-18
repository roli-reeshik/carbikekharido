import { z } from "zod";
import type { RiderProfile } from "./types";
import type { RiderFitFilters } from "./service";

/**
 * Height bounds are deliberately wide but finite — the ergonomics model is only
 * meaningful for adult riders, and out-of-range input would produce confident
 * nonsense rather than an error.
 */
export const riderFitQuerySchema = z.object({
  heightCm: z.coerce.number().min(120).max(220),
  weightKg: z.coerce.number().min(30).max(200).optional(),
  inseamCm: z.coerce.number().min(50).max(120).optional(),
  experience: z.enum(["beginner", "returning", "experienced"]).optional(),
  intent: z.enum(["commute", "touring", "sport", "adventure", "leisure"]).optional(),

  bodyType: z.string().max(40).optional(),
  minCc: z.coerce.number().min(0).max(2500).optional(),
  maxCc: z.coerce.number().min(0).max(2500).optional(),
  electricOnly: z.coerce.boolean().optional(),
  maxPriceInr: z.coerce.number().min(0).optional(),
  minPriceInr: z.coerce.number().min(0).optional(),
  minRatingCount: z.coerce.number().min(0).optional(),
  includePoorFits: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(60).optional(),
});

export type RiderFitQuery = z.infer<typeof riderFitQuerySchema>;

export function parseRiderFitQuery(params: URLSearchParams) {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value !== "") raw[key] = value;
  });
  return riderFitQuerySchema.safeParse(raw);
}

/** Split a validated query into the rider profile and the catalogue filters. */
export function splitRiderFitQuery(query: RiderFitQuery): {
  profile: RiderProfile;
  filters: RiderFitFilters;
} {
  const { heightCm, weightKg, inseamCm, experience, intent, ...filters } = query;
  return {
    profile: { heightCm, weightKg, inseamCm, experience, intent },
    filters,
  };
}

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

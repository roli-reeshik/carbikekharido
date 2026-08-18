import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;

export const mediaItemSchema = z.object({
  dataUrl: z.string().min(10, "Invalid media payload"),
  type: z.enum(["photo", "video"]),
  order: z.number().int().min(0),
  isThumb: z.boolean().default(false),
});

export const createVehicleSchema = z
  .object({
    publish: z.boolean().default(false),
    vehicleType: z.enum(["CAR", "BIKE"]),
    brand: z.string().min(1, "Brand is required").max(120),
    model: z.string().min(1, "Model is required").max(120),
    registrationNumber: z.string().min(4, "Registration number is required").max(20),
    bodyType: z.string().min(1).max(60),
    fuelType: z.string().min(1).max(30),
    transmission: z.string().min(1).max(30),
    engineCC: z.union([z.string(), z.number()]).optional(),
    power: z.string().max(60).optional(),
    torque: z.string().max(60).optional(),
    yearOfManufacture: z.union([z.string(), z.number()]),
    currentMileage: z.union([z.string(), z.number()]),
    ownerType: z.string().min(1).max(30),
    condition: z.string().min(1).max(30),
    color: z.string().max(40).optional(),
    insuranceValid: z.boolean().default(false),
    insuranceValidTill: z.string().optional(),
    pollutionCertValid: z.boolean().default(false),
    pollutionCertValidTill: z.string().optional(),
    serviceHistoryAvail: z.boolean().default(false),
    accidentHistory: z.enum(["none", "yes", "minor"]).default("none"),
    accidentDescription: z.string().max(2000).optional(),
    hasModifications: z.boolean().default(false),
    modifications: z.string().max(2000).optional(),
    askingPrice: z.union([z.string(), z.number()]),
    priceNegotiable: z.boolean().default(true),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    address: z.string().max(500).optional(),
    description: z.string().max(5000).optional(),
    sellerName: z.string().min(1).max(120),
    phone: z.string().regex(phoneRegex, "Invalid phone number"),
    email: z.string().email().optional().or(z.literal("")),
    phoneVerified: z.boolean().default(false),
    sellerType: z.enum(["INDIVIDUAL", "DEALER"]).default("INDIVIDUAL"),
    contactCall: z.boolean().default(true),
    contactWhatsApp: z.boolean().default(true),
    contactEmail: z.boolean().default(false),
    dealerName: z.string().max(200).optional(),
    dealerRegNumber: z.string().max(120).optional(),
    dealerWebsite: z.string().url().optional().or(z.literal("")),
    media: z.array(mediaItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const year = Number(data.yearOfManufacture);
    const currentYear = new Date().getFullYear();
    if (Number.isNaN(year) || year < 1990 || year > currentYear + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Year must be between 1990 and ${currentYear + 1}`,
        path: ["yearOfManufacture"],
      });
    }

    const price = Number(String(data.askingPrice).replace(/,/g, ""));
    if (Number.isNaN(price) || price < 10_000 || price > 999_999_999) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Asking price must be between ₹10,000 and ₹99,99,99,999",
        path: ["askingPrice"],
      });
    }

    const mileage = Number(String(data.currentMileage).replace(/,/g, ""));
    if (Number.isNaN(mileage) || mileage < 0 || mileage > 999_999) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage must be between 0 and 9,99,999",
        path: ["currentMileage"],
      });
    }

    if (data.publish) {
      const photos = data.media.filter((m) => m.type === "photo");
      if (photos.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 5 photos required to publish",
          path: ["media"],
        });
      }
      if (!data.phoneVerified) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone must be verified before publishing",
          path: ["phoneVerified"],
        });
      }
    }

    if (data.sellerType === "DEALER") {
      if (!data.dealerName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dealer name required", path: ["dealerName"] });
      }
      if (!data.dealerRegNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dealer registration required",
          path: ["dealerRegNumber"],
        });
      }
    }
  });

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = z.object({
  description: z.string().max(5000).optional(),
  askingPrice: z.union([z.string(), z.number()]).optional(),
  priceNegotiable: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "EXPIRED"]).optional(),
  media: z.array(mediaItemSchema).optional(),
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export const verifyPhoneSchema = z.object({
  phone: z.string().regex(phoneRegex),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["createdAt", "askingPrice", "viewCount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "EXPIRED", "all"]).optional(),
});

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = [];
    out[key].push(issue.message);
  }
  return out;
}

export function parseCreateVehicle(body: unknown) {
  return createVehicleSchema.safeParse(body);
}

export function parseUpdateVehicle(body: unknown) {
  return updateVehicleSchema.safeParse(body);
}

export function parseListQuery(searchParams: URLSearchParams) {
  return listQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
}

export const searchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "newest", "popular", "mileage"])
    .default("relevance"),
  type: z.string().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().max(50_000_000).optional(),
  city: z.string().max(100).optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  yearMin: z.coerce.number().int().min(1990).optional(),
  yearMax: z.coerce.number().int().max(2100).optional(),
  mileageMin: z.coerce.number().int().min(0).optional(),
  mileageMax: z.coerce.number().int().max(999_999).optional(),
  bodyType: z.string().optional(),
  ownerType: z.string().optional(),
  condition: z.string().optional(),
  sellerType: z.string().optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  recent: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  q: z.string().max(120).optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

function splitCsv(val?: string): string[] | undefined {
  if (!val?.trim()) return undefined;
  const arr = val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

export function parseSearchQuery(searchParams: URLSearchParams) {
  const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) return parsed;

  const raw = parsed.data;
  return {
    success: true as const,
    data: {
      ...raw,
      vehicleTypes: splitCsv(raw.type)?.map((t) => t.toUpperCase() as "CAR" | "BIKE"),
      fuelTypes: splitCsv(raw.fuel),
      transmissions: splitCsv(raw.transmission),
      bodyTypes: splitCsv(raw.bodyType),
      ownerTypes: splitCsv(raw.ownerType),
      conditions: splitCsv(raw.condition),
      sellerTypes: splitCsv(raw.sellerType)?.map((s) => s.toUpperCase() as "INDIVIDUAL" | "DEALER"),
    },
  };
}

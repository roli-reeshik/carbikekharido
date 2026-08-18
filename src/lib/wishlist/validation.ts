import { z } from "zod";

export const addWishlistSchema = z.object({
  vehicleId: z.string().min(1, "vehicleId is required"),
  listingId: z.string().min(1).optional(),
});

export const removeWishlistSchema = z.object({
  vehicleId: z.string().min(1).optional(),
  listingId: z.string().min(1).optional(),
});

export const priceAlertSchema = z.object({
  maxPrice: z.union([z.number(), z.string()]).transform((v) => Number(String(v).replace(/,/g, ""))),
});

export const wishlistQuerySchema = z.object({
  sort: z.enum(["saved", "price_asc", "price_desc"]).default("saved"),
});

export const digestSchema = z.object({
  email: z.string().email().optional(),
  enable: z.boolean().optional(),
});

export function resolveVehicleId(body: { vehicleId?: string; listingId?: string }): string | null {
  return body.vehicleId ?? body.listingId ?? null;
}

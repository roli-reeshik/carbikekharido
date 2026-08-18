import { NextRequest } from "next/server";
import { requireMarketplaceAuth } from "@/lib/vehicles/api/auth";
import { apiFromError, apiSuccess, parseJsonBody } from "@/lib/vehicles/api/responses";
import { checkRateLimit } from "@/lib/vehicles/api/rateLimit";
import { getPrisma } from "@/lib/sell/server/listingRepo";
import { sendWishlistDigest } from "@/lib/wishlist/alerts";

export const runtime = "nodejs";

/** POST /api/wishlist/digest — email wishlist digest to authenticated user */
export async function POST(req: NextRequest) {
  try {
    checkRateLimit(req, "wishlist/digest", 5, 60_000);
    const auth = await requireMarketplaceAuth(req);
    const body = (await parseJsonBody<{ email?: string }>(req).catch(() => ({}))) as {
      email?: string;
    };

    if (body.email) {
      const prisma = getPrisma();
      await prisma.user.update({
        where: { id: auth.appUser.id },
        data: { email: body.email },
      });
    }

    const result = await sendWishlistDigest(auth.appUser.id);
    return apiSuccess(result);
  } catch (err) {
    return apiFromError(err);
  }
}

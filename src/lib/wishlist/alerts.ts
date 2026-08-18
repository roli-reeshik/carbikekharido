import { getPrisma } from "@/lib/sell/server/listingRepo";
import { priceDropEmailHtml, sendEmail, wishlistDigestEmailHtml } from "./email";

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Notify users when listing price falls below their alert threshold. */
export async function processPriceAlertsForVehicle(
  vehicleId: string,
  newPrice: number,
  previousPrice?: number
) {
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return { notified: 0 };

  const alerts = await prisma.priceAlert.findMany({
    where: { vehicleId, isActive: true },
    include: { user: true },
  });

  let notified = 0;
  for (const alert of alerts) {
    const maxPrice = Number(alert.maxPrice);
    if (newPrice > maxPrice) continue;
    if (previousPrice !== undefined && previousPrice <= maxPrice && newPrice <= maxPrice) {
      continue;
    }

    const email = alert.user.email;
    if (email) {
      await sendEmail(
        email,
        `Price drop: ${vehicle.brand} ${vehicle.model} now ₹${newPrice.toLocaleString("en-IN")}`,
        priceDropEmailHtml({
          userName: alert.user.name,
          brand: vehicle.brand,
          model: vehicle.model,
          oldPrice: previousPrice ?? maxPrice,
          newPrice,
          listingUrl: `${APP_BASE}/vehicles/buy/${vehicleId}`,
        })
      );
    }

    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { isActive: false },
    });
    notified++;
  }

  return { notified };
}

/** Send digest email to a user with all wishlist items. */
export async function sendWishlistDigest(userId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) {
    return { sent: false, reason: "no_email" };
  }

  const rows = await prisma.wishlist.findMany({
    where: { userId },
    include: { vehicle: true },
    orderBy: { savedAt: "desc" },
    take: 20,
  });

  const items = rows
    .filter((r) => r.vehicle.status === "ACTIVE")
    .map((r) => ({
      brand: r.vehicle.brand,
      model: r.vehicle.model,
      price: Number(r.vehicle.askingPrice),
      city: r.vehicle.city,
      url: `${APP_BASE}/vehicles/buy/${r.vehicle.id}`,
    }));

  if (!items.length) return { sent: false, reason: "empty_wishlist" };

  const result = await sendEmail(
    user.email,
    `Your CarBikeKharido wishlist (${items.length} saved)`,
    wishlistDigestEmailHtml({ userName: user.name, items })
  );

  return { sent: result.sent || result.logged, itemCount: items.length };
}

/** Cron helper: check all active alerts against current prices. */
export async function scanAllPriceAlerts() {
  const prisma = getPrisma();
  const alerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: { vehicle: true, user: true },
  });

  let triggered = 0;
  for (const alert of alerts) {
    const price = Number(alert.vehicle.askingPrice);
    const max = Number(alert.maxPrice);
    if (price <= max && alert.user.email) {
      await sendEmail(
        alert.user.email,
        `Price alert: ${alert.vehicle.brand} ${alert.vehicle.model}`,
        priceDropEmailHtml({
          userName: alert.user.name,
          brand: alert.vehicle.brand,
          model: alert.vehicle.model,
          oldPrice: max,
          newPrice: price,
          listingUrl: `${APP_BASE}/vehicles/buy/${alert.vehicleId}`,
        })
      );
      await prisma.priceAlert.update({ where: { id: alert.id }, data: { isActive: false } });
      triggered++;
    }
  }
  return { triggered, scanned: alerts.length };
}

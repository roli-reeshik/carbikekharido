import { NextRequest, NextResponse } from "next/server";
import { getPrisma, saveListingMedia } from "@/lib/sell/server/listingRepo";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ListingPayload {
  draft: Record<string, unknown>;
  media: { dataUrl: string; type: "photo" | "video"; order: number; isThumb: boolean }[];
  publish: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ListingPayload;
    const d = body.draft;
    const prisma = getPrisma();

    const phone = String(d.phone || "").replace(/\D/g, "");
    const email = d.email ? String(d.email) : null;

    let user = email
      ? await prisma.user.findUnique({ where: { email } })
      : phone
        ? await prisma.user.findFirst({ where: { phone } })
        : null;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || undefined,
          phone: phone || undefined,
          name: String(d.sellerName || "Seller"),
          phoneVerified: Boolean(d.phoneVerified),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: String(d.sellerName || user.name),
          phone: phone || user.phone,
          phoneVerified: Boolean(d.phoneVerified),
        },
      });
    }

    let seller = await prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) {
      seller = await prisma.seller.create({
        data: {
          userId: user.id,
          sellerType: d.sellerType === "DEALER" ? "DEALER" : "INDIVIDUAL",
          dealerName: d.sellerType === "DEALER" ? String(d.dealerName || "") : null,
          dealerRegNumber: d.sellerType === "DEALER" ? String(d.dealerRegNumber || "") : null,
          dealerWebsite: d.dealerWebsite ? String(d.dealerWebsite) : null,
        },
      });
    }

    const askingPrice = BigInt(String(d.askingPrice || "0").replace(/,/g, ""));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const contactPrefs = [
      d.contactCall ? "call" : null,
      d.contactWhatsApp ? "whatsapp" : null,
      d.contactEmail ? "email" : null,
    ].filter(Boolean);

    const vehicle = await prisma.vehicle.create({
      data: {
        sellerId: seller.id,
        userId: user.id,
        vehicleType: d.vehicleType === "BIKE" ? "BIKE" : "CAR",
        brand: String(d.brand || ""),
        model: String(d.model || ""),
        yearOfManufacture: Number(d.yearOfManufacture),
        color: d.color ? String(d.color) : null,
        condition: String(d.condition || "good"),
        registrationNumber: String(d.registrationNumber || ""),
        fuelType: d.fuelType ? String(d.fuelType) : null,
        transmission: d.transmission ? String(d.transmission) : null,
        engineCC: d.engineCC ? Number(d.engineCC) : null,
        power: d.power ? String(d.power) : null,
        torque: d.torque ? String(d.torque) : null,
        currentMileage: d.currentMileage ? Number(d.currentMileage) : null,
        ownerType: d.ownerType ? String(d.ownerType) : null,
        insuranceValid: Boolean(d.insuranceValid),
        insuranceValidTill: d.insuranceValidTill ? new Date(String(d.insuranceValidTill)) : null,
        pollutionCertValid: Boolean(d.pollutionCertValid),
        pollutionCertValidTill: d.pollutionCertValidTill
          ? new Date(String(d.pollutionCertValidTill))
          : null,
        serviceHistoryAvail: Boolean(d.serviceHistoryAvail),
        accidentHistory: d.accidentHistory !== "none",
        accidentDescription:
          d.accidentHistory !== "none" ? String(d.accidentDescription || "") : null,
        modifications: d.hasModifications ? String(d.modifications || "") : null,
        askingPrice,
        priceNegotiable: Boolean(d.priceNegotiable),
        description: d.description ? String(d.description) : null,
        listingType: "NORMAL",
        status: body.publish ? "ACTIVE" : "INACTIVE",
        city: String(d.city || ""),
        state: String(d.state || ""),
        address: d.address ? String(d.address) : null,
        features: JSON.stringify([
          ...(contactPrefs as string[]),
          d.bodyType ? `body:${d.bodyType}` : null,
        ].filter(Boolean)),
        publishedAt: body.publish ? now : null,
        expiresAt,
      },
    });

    if (body.media?.length) {
      const saved = await saveListingMedia(vehicle.id, body.media);
      await prisma.vehicleImage.createMany({
        data: saved.map((m) => ({
          vehicleId: vehicle.id,
          url: m.url,
          type: m.type,
          order: m.order,
          isThumb: m.isThumb,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      vehicleId: vehicle.id,
      status: vehicle.status,
      url: `/vehicles/listing?id=${encodeURIComponent(vehicle.id)}`,
    });
  } catch (e) {
    console.error("[marketplace/listings]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to create listing" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getVehicleIdentity } from "@/lib/liveMedia/identity";
import { resolveLiveVehicleImage, proxyImageUrl } from "@/lib/liveMedia/vehicleImage";
import { DEMO_VEHICLES, Vehicle } from "@/lib/vehicles";

/**
 * Enriches the demo catalog with live vehicle photos from CarDekho / BikeDekho.
 * Images are proxied through /api/media/proxy so the browser never hotlinks.
 */
export async function GET() {
  const vehicles: Vehicle[] = await Promise.all(
    DEMO_VEHICLES.map(async (vehicle) => {
      const identity = getVehicleIdentity(vehicle);
      if (!identity) return vehicle;

      const live = await resolveLiveVehicleImage(identity);
      if (!live) return vehicle;

      return {
        ...vehicle,
        officialImageUrl: proxyImageUrl(live.imageUrl),
        brand: identity.brand,
        modelName: vehicle.modelName ?? identity.model,
      };
    })
  );

  const withImages = vehicles.filter((v) => v.officialImageUrl).length;

  return NextResponse.json({
    vehicles,
    meta: {
      total: vehicles.length,
      withImages,
      imageSource: withImages > 0 ? "live" : "none",
    },
  });
}

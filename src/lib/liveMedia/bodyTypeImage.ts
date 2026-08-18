import { BodyType, VehicleType } from "@/lib/vehicles";
import { getCached, setCached } from "./cache";
import { resolveLiveVehicleImage } from "./vehicleImage";

/** Representative live models per body type — real photos from CarDekho/BikeDekho. */
const BODY_TYPE_MODELS: Record<
  BodyType,
  { brand: string; model: string; vehicleType: VehicleType }
> = {
  suv: { brand: "Hyundai", model: "Creta", vehicleType: "car" },
  hatchback: { brand: "Maruti Suzuki", model: "Swift", vehicleType: "car" },
  sedan: { brand: "Honda", model: "City", vehicleType: "car" },
  muv: { brand: "Maruti Suzuki", model: "Ertiga", vehicleType: "car" },
  luxury: { brand: "Toyota", model: "Camry", vehicleType: "car" },
  commuter: { brand: "Hero MotoCorp", model: "Splendor+", vehicleType: "bike" },
  scooter: { brand: "Honda", model: "Activa 6G", vehicleType: "bike" },
  sports: { brand: "Bajaj", model: "Pulsar NS200", vehicleType: "bike" },
};

export async function resolveBodyTypeImage(bodyType: BodyType) {
  const cacheKey = `body-type:${bodyType}`;
  const cached = getCached<Awaited<ReturnType<typeof resolveLiveVehicleImage>>>(cacheKey);
  if (cached) return cached;

  const spec = BODY_TYPE_MODELS[bodyType];
  const result = await resolveLiveVehicleImage({
    brand: spec.brand,
    model: spec.model,
    vehicleType: spec.vehicleType,
  });
  if (result) setCached(cacheKey, result);
  return result;
}

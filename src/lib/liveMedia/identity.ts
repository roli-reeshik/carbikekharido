import { Vehicle, VehicleType } from "@/lib/vehicles";

export interface VehicleIdentity {
  brand: string;
  model: string;
  vehicleType: VehicleType;
}

/** Pull brand/model from structured fields or English display name. */
export function getVehicleIdentity(vehicle: Vehicle): VehicleIdentity | null {
  if (vehicle.brand && vehicle.modelName) {
    return {
      brand: vehicle.brand,
      model: vehicle.modelName,
      vehicleType: vehicle.type,
    };
  }

  const name = vehicle.name.en.replace(/\s*\(\d{4}\)\s*$/, "").trim();
  const rules: { prefix: string; brand: string }[] = [
    { prefix: "Maruti Suzuki ", brand: "Maruti Suzuki" },
    { prefix: "Tata ", brand: "Tata Motors" },
    { prefix: "Hyundai ", brand: "Hyundai" },
    { prefix: "Mahindra ", brand: "Mahindra" },
    { prefix: "Honda ", brand: "Honda" },
    { prefix: "Hero ", brand: "Hero MotoCorp" },
    { prefix: "Bajaj ", brand: "Bajaj" },
    { prefix: "TVS ", brand: "TVS" },
    { prefix: "Royal Enfield ", brand: "Royal Enfield" },
    { prefix: "Yamaha ", brand: "Yamaha" },
  ];

  for (const rule of rules) {
    if (name.startsWith(rule.prefix)) {
      return {
        brand: rule.brand,
        model: name.slice(rule.prefix.length),
        vehicleType: vehicle.type,
      };
    }
  }

  return null;
}

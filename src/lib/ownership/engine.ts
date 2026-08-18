/**
 * The ownership cost model — pure functions, no data access.
 *
 * The question this answers is the one a sticker price cannot: over the years
 * you will actually keep it, what does this bike cost you? A ₹78,000 Splendor
 * and a ₹1.25 lakh electric scooter are not ₹47,000 apart once fuel, servicing,
 * wear items, insurance and resale are counted, and for a high-mileage rider
 * the order can reverse entirely.
 *
 * Every figure is built from published specs plus the rates in `rates.ts`, and
 * anything assumed is recorded so the UI can show its working rather than
 * presenting a total on faith.
 */
import * as R from "./rates";
import type { CostLine, CostableBike, OwnershipCost, UsageProfile } from "./types";

/** Pick the first band whose ceiling the value falls under. */
function band<T extends { maxCc: number }>(table: T[], cc: number): T {
  return table.find((row) => cc <= row.maxCc) ?? table[table.length - 1];
}

function bandKw<T extends { maxKw: number }>(table: T[], kw: number): T {
  return table.find((row) => kw <= row.maxKw) ?? table[table.length - 1];
}

const round = (n: number) => Math.round(n);

/** Scooters and hub-drive electrics have no chain to replace. */
function hasChain(bike: CostableBike): boolean {
  if (bike.isElectric) return false;
  const body = bike.bodyType ?? "";
  return body !== "scooter" && body !== "moped";
}

function isScooterLike(bike: CostableBike): boolean {
  const body = bike.bodyType ?? "";
  return body === "scooter" || body === "moped";
}

/**
 * Engine size used for cost banding.
 *
 * Electrics have no displacement, so motor power is mapped onto a rough
 * equivalent. Scooters are then capped: an 11 kW electric scooter is quick, but
 * it still rolls on 12-inch wheels and small discs, and pricing its tyres like
 * a 220cc motorcycle's overstated its wear bill by more than double.
 */
function effectiveCc(bike: CostableBike): number {
  if (bike.displacementCc) return bike.displacementCc;

  const fromMotor = bike.motorKw ? Math.round(bike.motorKw * 20) : 125;
  return isScooterLike(bike) ? Math.min(fromMotor, 150) : fromMotor;
}

/** On-road price, which already includes registration, GST and first-year cover. */
function acquisitionCost(bike: CostableBike): { inr: number; assumed: boolean } {
  if (bike.onRoadInr && bike.onRoadInr > bike.exShowroomInr) {
    return { inr: bike.onRoadInr, assumed: false };
  }
  // Registration, road tax and mandatory five-year third-party cover add
  // roughly a seventh to the ex-showroom price on a two-wheeler in Delhi.
  return { inr: round(bike.exShowroomInr * 1.14), assumed: true };
}

interface EnergyResult {
  totalInr: number;
  detail: string;
  assumed: boolean;
  efficiency: { value: number; unit: "kmpl" | "km/kWh" } | null;
}

function energyCost(bike: CostableBike, totalKm: number, usage: UsageProfile): EnergyResult {
  if (bike.isElectric) {
    const tariff = usage.electricityPriceInr ?? R.ELECTRICITY_INR_PER_KWH;

    if (!bike.batteryKwh || !bike.claimedRangeKm) {
      return {
        totalInr: 0,
        detail: "Battery size or range not published, so charging cost cannot be estimated.",
        assumed: true,
        efficiency: null,
      };
    }

    const realRangeKm = bike.claimedRangeKm * R.REAL_WORLD_EV_RANGE_FACTOR;
    const kmPerKwh = realRangeKm / bike.batteryKwh;
    const kwh = (totalKm / kmPerKwh) * R.CHARGING_LOSS_FACTOR;

    return {
      totalInr: round(kwh * tariff),
      detail: `${round(kwh).toLocaleString("en-IN")} kWh at ₹${tariff}/unit, allowing for charging losses and a real-world range of ${round(realRangeKm)} km against the claimed ${bike.claimedRangeKm} km.`,
      assumed: true,
      efficiency: { value: Math.round(kmPerKwh * 10) / 10, unit: "km/kWh" },
    };
  }

  const price = usage.petrolPriceInr ?? R.PETROL_PRICE_INR_PER_L;

  if (!bike.mileageKmpl) {
    return {
      totalInr: 0,
      detail: "Mileage not published, so fuel cost cannot be estimated.",
      assumed: true,
      efficiency: null,
    };
  }

  const realKmpl = bike.mileageKmpl * R.REAL_WORLD_MILEAGE_FACTOR;
  const litres = totalKm / realKmpl;

  return {
    totalInr: round(litres * price),
    detail: `${round(litres).toLocaleString("en-IN")} litres at ₹${price}/l, using a real-world ${realKmpl.toFixed(1)} kmpl against the claimed ${bike.mileageKmpl} kmpl.`,
    assumed: true,
    efficiency: { value: Math.round(realKmpl * 10) / 10, unit: "kmpl" },
  };
}

function serviceIntervalKm(bike: CostableBike): { km: number; assumed: boolean } {
  if (bike.serviceIntervalKm && bike.serviceIntervalKm > 0) {
    return { km: bike.serviceIntervalKm, assumed: false };
  }

  const cc = effectiveCc(bike);
  const km =
    cc <= 125
      ? R.DEFAULT_SERVICE_INTERVAL_KM.small
      : cc <= 350
        ? R.DEFAULT_SERVICE_INTERVAL_KM.medium
        : R.DEFAULT_SERVICE_INTERVAL_KM.large;

  return { km, assumed: true };
}

function serviceCost(bike: CostableBike, totalKm: number, years: number) {
  if (bike.isElectric) {
    const visits = years * R.EV_SERVICES_PER_YEAR;
    return {
      totalInr: round(visits * R.EV_SERVICE_COST_INR),
      detail: `${visits} annual check-ups at about ₹${R.EV_SERVICE_COST_INR} each — no oil, filters or valve work.`,
      assumed: true,
    };
  }

  const interval = serviceIntervalKm(bike);
  const visits = Math.ceil(totalKm / interval.km);
  const perVisit = band(R.SERVICE_COST_BY_CC, effectiveCc(bike)).inr;

  return {
    totalInr: round(visits * perVisit),
    detail: `${visits} services at roughly ₹${perVisit.toLocaleString("en-IN")} each, one every ${interval.km.toLocaleString("en-IN")} km${interval.assumed ? " (interval assumed — not published)" : ""}.`,
    assumed: interval.assumed,
  };
}

/** Tyres, brake pads and final drive, amortised across the distance ridden. */
function consumablesCost(bike: CostableBike, totalKm: number) {
  const cc = effectiveCc(bike);
  const parts: { name: string; costInr: number; lifeKm: number }[] = [
    { name: "tyres", ...band(R.TYRE_PAIR_BY_CC, cc).rate },
    { name: "brake pads", ...band(R.BRAKE_PADS_BY_CC, cc).rate },
  ];

  if (hasChain(bike)) {
    parts.push({ name: "chain and sprockets", ...band(R.CHAIN_SET_BY_CC, cc).rate });
  } else if (isScooterLike(bike) && !bike.isElectric) {
    parts.push({ name: "drive belt", ...R.SCOOTER_BELT });
  }

  let total = 0;
  const pieces: string[] = [];

  for (const part of parts) {
    // Amortised rather than counted in whole replacements: over a short
    // ownership a rider genuinely only uses up part of a set of tyres.
    const cost = (totalKm / part.lifeKm) * part.costInr;
    total += cost;
    pieces.push(`${part.name} ₹${round(cost).toLocaleString("en-IN")}`);
  }

  return {
    totalInr: round(total),
    detail: `Wear items across ${round(totalKm).toLocaleString("en-IN")} km — ${pieces.join(", ")}.`,
    assumed: true,
  };
}

/** Statutory third-party premium for one year, before GST. */
function thirdPartyAnnualInr(bike: CostableBike): number {
  if (bike.isElectric && bike.motorKw) {
    return bandKw(R.TP_PREMIUM_BY_KW, bike.motorKw).annualInr;
  }
  if (bike.isElectric) {
    // Most electric two-wheelers sold in India sit in the 3-7 kW band.
    return R.TP_PREMIUM_BY_KW[1].annualInr;
  }
  return band(R.TP_PREMIUM_BY_CC, effectiveCc(bike)).annualInr;
}

function idvDepreciation(completedYears: number): number {
  if (completedYears <= 0) return 0.05;
  const index = completedYears - 1;
  return R.IDV_DEPRECIATION_BY_YEAR[index] ?? R.IDV_DEPRECIATION_BEYOND_5_YEARS;
}

/**
 * Insurance beyond the first year.
 *
 * A new two-wheeler must carry five years of third-party cover bought upfront,
 * and that is already inside the on-road price, so charging it again here would
 * double-count. Only cover the buyer arranges later is added.
 */
function insuranceCost(bike: CostableBike, years: number, comprehensive: boolean) {
  const tpAnnual = thirdPartyAnnualInr(bike);
  let total = 0;
  const notes: string[] = [];

  // Third party for years 6 onward, the five-year policy having lapsed.
  const tpYears = Math.max(0, years - 5);
  if (tpYears > 0) {
    total += tpYears * tpAnnual * (1 + R.GST_ON_INSURANCE);
    notes.push(`${tpYears} year${tpYears > 1 ? "s" : ""} of third-party cover at ₹${tpAnnual}/year`);
  }

  if (comprehensive) {
    // Own-damage cover is renewed annually from year two; year one comes with
    // the bike.
    let odTotal = 0;
    for (let year = 1; year < years; year++) {
      const idv = bike.exShowroomInr * (1 - idvDepreciation(year));
      odTotal += idv * R.OWN_DAMAGE_RATE_OF_IDV * (1 + R.GST_ON_INSURANCE);
    }
    total += odTotal;
    if (odTotal > 0) {
      notes.push(`own-damage cover from year two, ₹${round(odTotal).toLocaleString("en-IN")} as the insured value falls`);
    }
  }

  const joined = notes.join("; ");
  const detail = joined
    ? `${joined.charAt(0).toUpperCase()}${joined.slice(1)}. The mandatory five-year third-party policy is already inside the on-road price.`
    : "Covered by the five-year third-party policy included in the on-road price.";

  return { totalInr: round(total), detail, assumed: comprehensive };
}

/** Traction battery replacement, if the rider keeps the bike long enough. */
function batteryCost(bike: CostableBike, years: number) {
  if (!bike.isElectric) return null;

  if (!bike.batteryKwh) {
    return {
      totalInr: 0,
      detail: "Battery size not published, so replacement cost cannot be estimated.",
      assumed: true,
    };
  }

  if (years < R.BATTERY_REPLACEMENT_AT_YEAR) {
    return {
      totalInr: 0,
      detail: `No replacement expected inside ${years} years — packs are warranted for ${R.BATTERY_WARRANTY_YEARS} and typically last longer. Budget about ₹${round(bike.batteryKwh * R.BATTERY_COST_INR_PER_KWH).toLocaleString("en-IN")} around year ${R.BATTERY_REPLACEMENT_AT_YEAR}.`,
      assumed: true,
    };
  }

  const cost = bike.batteryKwh * R.BATTERY_COST_INR_PER_KWH;
  return {
    totalInr: round(cost),
    detail: `One replacement pack around year ${R.BATTERY_REPLACEMENT_AT_YEAR} — ${bike.batteryKwh} kWh at about ₹${R.BATTERY_COST_INR_PER_KWH.toLocaleString("en-IN")}/kWh.`,
    assumed: true,
  };
}

/**
 * Estimated resale value at the end of the period.
 *
 * This is a depreciation curve, not a prediction learned from sale prices —
 * the site holds no resale history. Treated separately from the IDV schedule
 * because insurers and the used market value a bike quite differently.
 */
export function estimateResaleInr(bike: CostableBike, years: number): number {
  const table = R.RESALE_DEPRECIATION_BY_YEAR;
  const base =
    years <= 0
      ? 0
      : years <= table.length
        ? table[years - 1]
        : table[table.length - 1] + (years - table.length) * R.RESALE_DEPRECIATION_TAIL_PER_YEAR;

  const lost = Math.min(1 - R.RESALE_FLOOR, base + (bike.isElectric ? R.EV_RESALE_PENALTY : 0));
  return round(bike.exShowroomInr * (1 - lost));
}

/** Full ownership cost for one bike under one usage profile. */
export function computeOwnershipCost(bike: CostableBike, usage: UsageProfile): OwnershipCost {
  const years = usage.years;
  const kmPerYear = usage.kmPerYear;
  const totalKm = years * kmPerYear;
  const comprehensive = usage.comprehensiveInsurance ?? true;

  const acquisition = acquisitionCost(bike);
  const energy = energyCost(bike, totalKm, usage);
  const service = serviceCost(bike, totalKm, years);
  const consumables = consumablesCost(bike, totalKm);
  const insurance = insuranceCost(bike, years, comprehensive);
  const battery = batteryCost(bike, years);
  const resaleInr = estimateResaleInr(bike, years);

  const lines: CostLine[] = [
    {
      key: "acquisition",
      label: "On-road price",
      totalInr: acquisition.inr,
      detail: acquisition.assumed
        ? "On-road price not published, so estimated at 14% above ex-showroom for registration, road tax and mandatory cover."
        : "Published on-road price for Delhi, including registration, road tax and the five-year third-party policy.",
      assumed: acquisition.assumed,
    },
    { key: "energy", label: bike.isElectric ? "Charging" : "Fuel", totalInr: energy.totalInr, detail: energy.detail, assumed: energy.assumed },
    { key: "service", label: "Servicing", totalInr: service.totalInr, detail: service.detail, assumed: service.assumed },
    { key: "consumables", label: "Tyres and wear items", totalInr: consumables.totalInr, detail: consumables.detail, assumed: consumables.assumed },
    { key: "insurance", label: "Insurance", totalInr: insurance.totalInr, detail: insurance.detail, assumed: insurance.assumed },
  ];

  if (battery) {
    lines.push({ key: "battery", label: "Battery replacement", totalInr: battery.totalInr, detail: battery.detail, assumed: battery.assumed });
  }

  lines.push({
    key: "resale",
    label: "Resale value",
    totalInr: -resaleInr,
    detail: `Estimated sale value after ${years} years, credited back against what you paid. An estimate from a standard depreciation curve, not from sale records.`,
    assumed: true,
  });

  const runningInr = lines
    .filter((l) => l.key !== "acquisition" && l.key !== "resale")
    .reduce((sum, l) => sum + l.totalInr, 0);

  const totalInr = acquisition.inr + runningInr - resaleInr;

  const assumptions: string[] = [];
  if (!bike.isElectric && !bike.mileageKmpl) {
    assumptions.push("Mileage is not published for this model, so fuel is missing from the total.");
  }
  if (bike.isElectric && (!bike.batteryKwh || !bike.claimedRangeKm)) {
    assumptions.push("Battery size or range is not published, so charging is missing from the total.");
  }
  if (acquisition.assumed) {
    assumptions.push("On-road price estimated from ex-showroom.");
  }
  assumptions.push(
    `Real-world efficiency taken at ${Math.round((bike.isElectric ? R.REAL_WORLD_EV_RANGE_FACTOR : R.REAL_WORLD_MILEAGE_FACTOR) * 100)}% of the manufacturer's claim.`
  );
  assumptions.push("Servicing at authorised centres; a local mechanic costs less.");

  return {
    bike,
    years,
    kmPerYear,
    totalKm,
    acquisitionInr: acquisition.inr,
    runningInr,
    resaleInr,
    totalInr,
    costPerKmInr: totalKm > 0 ? Math.round((totalInr / totalKm) * 100) / 100 : 0,
    runningCostPerKmInr: totalKm > 0 ? Math.round((runningInr / totalKm) * 100) / 100 : 0,
    lines,
    effectiveEfficiency: energy.efficiency,
    assumptions,
  };
}

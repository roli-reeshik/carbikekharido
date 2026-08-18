/** Types for the ownership cost model. */

/** What the rider tells us about how they will use the bike. */
export interface UsageProfile {
  /** Distance ridden per year, km. */
  kmPerYear: number;
  /** Length of ownership, years. */
  years: number;
  /** Petrol, ₹/litre. Defaults to the Delhi rate in `rates.ts`. */
  petrolPriceInr?: number;
  /** Domestic electricity, ₹/kWh. */
  electricityPriceInr?: number;
  /** Include comprehensive cover rather than the statutory minimum. */
  comprehensiveInsurance?: boolean;
}

/** The specs a bike needs for its running costs to be estimated. */
export interface CostableBike {
  modelId: string;
  modelName: string;
  brandSlug: string;
  bodyType?: string | null;
  isElectric: boolean;
  exShowroomInr: number;
  onRoadInr?: number | null;
  displacementCc?: number | null;
  /** Manufacturer mileage claim, km/l. Derated before use. */
  mileageKmpl?: number | null;
  serviceIntervalKm?: number | null;
  batteryKwh?: number | null;
  claimedRangeKm?: number | null;
  motorKw?: number | null;
}

/** One line of the cost breakdown, over the whole ownership period. */
export interface CostLine {
  key: CostKey;
  label: string;
  totalInr: number;
  /** How the figure was arrived at, in plain language. */
  detail: string;
  /** True when the figure rests on an assumed input rather than a published one. */
  assumed: boolean;
}

export type CostKey =
  | "acquisition"
  | "energy"
  | "service"
  | "consumables"
  | "insurance"
  | "battery"
  | "resale";

/** A complete ownership cost estimate for one bike. */
export interface OwnershipCost {
  bike: CostableBike;
  years: number;
  kmPerYear: number;
  totalKm: number;

  /** On-road price paid up front. */
  acquisitionInr: number;
  /** Everything spent after purchase, before resale is credited back. */
  runningInr: number;
  /** Estimated sale value at the end of the period, subtracted from the total. */
  resaleInr: number;
  /**
   * What the bike actually costs to own: purchase plus running, less resale.
   * This is the number that makes a cheap bike with poor mileage look
   * expensive next to a costlier one that sips fuel and holds its value.
   */
  totalInr: number;
  /** Total divided by distance covered — the figure that compares bikes fairly. */
  costPerKmInr: number;
  /** Running cost only, per km, excluding purchase and resale. */
  runningCostPerKmInr: number;

  lines: CostLine[];
  /** Real-world mileage or range used, after derating the manufacturer claim. */
  effectiveEfficiency: { value: number; unit: "kmpl" | "km/kWh" } | null;
  /** Inputs we had to assume, so the estimate is never presented as fact. */
  assumptions: string[];
}

export interface OwnershipComparison {
  usage: Required<Pick<UsageProfile, "kmPerYear" | "years">> & {
    petrolPriceInr: number;
    electricityPriceInr: number;
    comprehensiveInsurance: boolean;
  };
  results: OwnershipCost[];
  /** Models asked for that lack the specs to be costed, with the reason. */
  skipped: { modelId: string; reason: string }[];
  ratesCheckedOn: string;
}

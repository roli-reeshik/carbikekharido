/**
 * Every external rate the ownership cost model depends on, in one place.
 *
 * These are the numbers that go stale. Keeping them together — each with its
 * source and the date it was checked — means a yearly review is one file to
 * read rather than a hunt through the engine. `RATES_CHECKED_ON` is surfaced in
 * the UI so a rider can judge how current the figures are.
 *
 * Statutory figures (third-party premiums, IDV depreciation) are exact and
 * taken from the notified rules. Everything else is a market estimate and is
 * labelled as such.
 */

export const RATES_CHECKED_ON = "2026-07-31";

// -----------------------------------------------------------------------------
// Fuel and electricity
// -----------------------------------------------------------------------------

/** Petrol, ₹/litre, Delhi. Source: OMC retail price, 30 Jul 2026. */
export const PETROL_PRICE_INR_PER_L = 102.12;

/**
 * Domestic electricity, ₹/kWh. Slab tariffs vary widely by state, so this is a
 * mid-range figure for a household already past the subsidised early slabs.
 */
export const ELECTRICITY_INR_PER_KWH = 8;

/**
 * Manufacturer mileage figures are obtained under favourable conditions. Indian
 * owner-reported mileage typically lands well below the claim, so the quoted
 * figure is derated rather than used directly — otherwise every running cost
 * the tool prints would be optimistic.
 */
export const REAL_WORLD_MILEAGE_FACTOR = 0.85;

/** Electric range claims run further ahead of reality than petrol mileage does. */
export const REAL_WORLD_EV_RANGE_FACTOR = 0.78;

/** Energy drawn from the wall exceeds energy stored, through charger losses. */
export const CHARGING_LOSS_FACTOR = 1.12;

// -----------------------------------------------------------------------------
// Insurance — statutory
// -----------------------------------------------------------------------------

/**
 * Annual third-party premiums, ₹, by engine capacity.
 *
 * Source: Motor Vehicles (Third Party Insurance Base Premium and Liability)
 * Rules, 2022. Identical across every insurer by law. GST is charged on top.
 *
 * Note: an 18-25% revision has been proposed but not notified as of the check
 * date, so the 2022 figures still stand.
 */
export const TP_PREMIUM_BY_CC: { maxCc: number; annualInr: number }[] = [
  { maxCc: 75, annualInr: 538 },
  { maxCc: 150, annualInr: 714 },
  { maxCc: 350, annualInr: 1366 },
  { maxCc: Infinity, annualInr: 2804 },
];

/**
 * Annual third-party premiums, ₹, for electric two-wheelers by motor power.
 * Same source. Set roughly 15% below the petrol equivalent to encourage uptake.
 */
export const TP_PREMIUM_BY_KW: { maxKw: number; annualInr: number }[] = [
  { maxKw: 3, annualInr: 457 },
  { maxKw: 7, annualInr: 607 },
  { maxKw: 16, annualInr: 1161 },
  { maxKw: Infinity, annualInr: 2383 },
];

export const GST_ON_INSURANCE = 0.18;

/**
 * Own-damage premium as a share of IDV.
 *
 * Unlike third-party cover this is not regulated, and insurers discount it
 * heavily, so it is a market estimate rather than a fixed rate.
 */
export const OWN_DAMAGE_RATE_OF_IDV = 0.017;

/**
 * IDV depreciation by completed years of age.
 *
 * Source: India Motor Tariff GR-8, as carried in the IRDAI standard policy
 * wording. Used to value the bike for insurance, not to predict resale — the
 * two diverge sharply and are modelled separately.
 */
export const IDV_DEPRECIATION_BY_YEAR: number[] = [0.15, 0.2, 0.3, 0.4, 0.5];

/** Beyond five years IDV is agreed between insurer and owner; this is typical. */
export const IDV_DEPRECIATION_BEYOND_5_YEARS = 0.6;

// -----------------------------------------------------------------------------
// Servicing and consumables — market estimates
// -----------------------------------------------------------------------------

/**
 * Cost of one scheduled service at an authorised centre, ₹, by engine size.
 * Covers labour, engine oil and filters. Larger engines take more oil and are
 * charged at higher labour rates.
 */
export const SERVICE_COST_BY_CC: { maxCc: number; inr: number }[] = [
  { maxCc: 125, inr: 600 },
  { maxCc: 200, inr: 950 },
  { maxCc: 350, inr: 1800 },
  { maxCc: 500, inr: 3000 },
  { maxCc: Infinity, inr: 4500 },
];

/** An electric two-wheeler service has no oil, filters or valve work. */
export const EV_SERVICE_COST_INR = 500;

/**
 * Distance between scheduled services, km, when the manufacturer's own figure
 * is unpublished — which is the case for most of the catalog.
 */
export const DEFAULT_SERVICE_INTERVAL_KM = { small: 3000, medium: 5000, large: 6000 };

/** Electric two-wheelers are serviced on time rather than distance. */
export const EV_SERVICES_PER_YEAR = 1;

/**
 * Wear items, as replacement cost in ₹ and expected life in km.
 *
 * These dominate running cost over a long ownership and are the part of the
 * bill riders most often forget when comparing a scooter against a motorcycle.
 */
export interface ConsumableRate {
  costInr: number;
  lifeKm: number;
}

export const TYRE_PAIR_BY_CC: { maxCc: number; rate: ConsumableRate }[] = [
  { maxCc: 125, rate: { costInr: 3200, lifeKm: 22000 } },
  { maxCc: 200, rate: { costInr: 5000, lifeKm: 20000 } },
  { maxCc: 350, rate: { costInr: 9000, lifeKm: 18000 } },
  { maxCc: Infinity, rate: { costInr: 16000, lifeKm: 14000 } },
];

export const BRAKE_PADS_BY_CC: { maxCc: number; rate: ConsumableRate }[] = [
  { maxCc: 200, rate: { costInr: 700, lifeKm: 18000 } },
  { maxCc: 350, rate: { costInr: 1400, lifeKm: 16000 } },
  { maxCc: Infinity, rate: { costInr: 2800, lifeKm: 14000 } },
];

/** Chain and sprocket. Scooters and hub-drive electrics have neither. */
export const CHAIN_SET_BY_CC: { maxCc: number; rate: ConsumableRate }[] = [
  { maxCc: 200, rate: { costInr: 2200, lifeKm: 28000 } },
  { maxCc: 350, rate: { costInr: 3800, lifeKm: 26000 } },
  { maxCc: Infinity, rate: { costInr: 7000, lifeKm: 24000 } },
];

/** Drive belt on a scooter, in place of a chain. */
export const SCOOTER_BELT: ConsumableRate = { costInr: 1800, lifeKm: 24000 };

// -----------------------------------------------------------------------------
// Electric traction battery
// -----------------------------------------------------------------------------

/**
 * Replacement pack cost, ₹ per kWh.
 *
 * Derived from 2026 service-centre quotes across Ola, Ather and TVS, where
 * quoted price tracks pack size almost linearly from ₹45,000 for 2 kWh to
 * ₹1.2 lakh for 5.3 kWh. This is the single largest cost an electric owner
 * faces and the one most often left out of a comparison.
 */
export const BATTERY_COST_INR_PER_KWH = 22000;

/** Typical traction battery warranty, in years, on Indian electric two-wheelers. */
export const BATTERY_WARRANTY_YEARS = 3;

/**
 * Age at which a pack is assumed to need replacing. Beyond the warranty most
 * packs keep useful capacity for several more years, so this is deliberately
 * later than the warranty rather than equal to it.
 */
export const BATTERY_REPLACEMENT_AT_YEAR = 7;

// -----------------------------------------------------------------------------
// Resale
// -----------------------------------------------------------------------------

/**
 * Share of ex-showroom price lost by the end of each year of ownership.
 *
 * This is a market estimate, not a prediction from transaction data — the site
 * has no resale history to learn from, and the UI says so. Indian two-wheelers
 * lose a large slice in year one and then decline more gently.
 */
export const RESALE_DEPRECIATION_BY_YEAR = [0.2, 0.3, 0.39, 0.47, 0.55, 0.61, 0.66, 0.71, 0.75, 0.78];

/** Yearly loss applied past the end of the table above. */
export const RESALE_DEPRECIATION_TAIL_PER_YEAR = 0.025;

/** Resale never falls below this share of ex-showroom while the bike still runs. */
export const RESALE_FLOOR = 0.08;

/**
 * Electric two-wheelers lose value faster than petrol ones: the used market is
 * thin, buyers discount an ageing battery heavily, and new models keep
 * undercutting old ones on both price and range.
 */
export const EV_RESALE_PENALTY = 0.1;

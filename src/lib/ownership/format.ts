/** Rupee formatting shared by the ownership cost UI. */

/** Rupees in the lakh/thousand shorthand Indian buyers read prices in. */
export function formatInr(rupees: number): string {
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? "-" : "";

  if (abs >= 100000) {
    const lakh = abs / 100000;
    return `${sign}₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} lakh`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

/** Exact rupees, for breakdown tables where rounding to lakhs hides detail. */
export function formatInrExact(rupees: number): string {
  const sign = rupees < 0 ? "-" : "";
  return `${sign}₹${Math.round(Math.abs(rupees)).toLocaleString("en-IN")}`;
}

export function formatPerKm(rupees: number): string {
  return `₹${rupees.toFixed(2)}`;
}

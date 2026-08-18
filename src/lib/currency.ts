/**
 * Indian numbering system formatting — Lakhs/Crores, not the Western
 * million/billion grouping. 1 Lakh = 100,000; 1 Crore = 10,000,000.
 *
 * This is ported from the standalone indian-vehicle-portal-demo, where
 * testing caught a real rounding-boundary bug: a value just under
 * ₹1,00,00,000 (e.g. ₹99,99,999) rounds up under toFixed(2) to display
 * as "100.00 Lakh" — which is confusing since 100 Lakh IS 1 Crore. The
 * guard below catches that and correctly shows Crore notation instead.
 */
export function formatIndianPrice(amountInr: number): { exact: string; label: string } {
  const exact = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);

  let label: string;
  if (amountInr >= 10000000) {
    label = `₹${(amountInr / 10000000).toFixed(2)} Crore`;
  } else if (amountInr >= 100000) {
    const lakhValue = amountInr / 100000;
    if (Math.round(lakhValue * 100) / 100 >= 100) {
      label = `₹${(amountInr / 10000000).toFixed(2)} Crore`;
    } else {
      label = `₹${lakhValue.toFixed(2)} Lakh`;
    }
  } else {
    label = exact;
  }

  return { exact, label };
}

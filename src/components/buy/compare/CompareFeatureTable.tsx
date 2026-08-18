import {
  collectAllFeatures,
  COMPARE_SPEC_KEYS,
  COMPARE_SPEC_LABELS,
  getSpecValue,
  hasFeature,
} from "@/lib/buy/compare";
import { MarketplaceListingDetail } from "@/lib/buy/listingDetail";

interface CompareFeatureTableProps {
  listings: MarketplaceListingDetail[];
}

export function CompareFeatureTable({ listings }: CompareFeatureTableProps) {
  const features = collectAllFeatures(listings);

  return (
    <div className="compare-print-section overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-line bg-paper">
            <th className="p-3 text-left text-xs font-bold uppercase text-ink/45">Feature</th>
            {listings.map((l) => (
              <th key={l.listingId} className="p-3 text-center text-xs font-semibold text-ink">
                {l.brand} {l.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature} className="border-b border-line/60">
              <td className="p-3 text-xs font-medium text-ink/55">{feature}</td>
              {listings.map((l) => (
                <td key={l.listingId} className="p-3 text-center text-base">
                  {hasFeature(l, feature) ? (
                    <span className="text-sell-emerald" aria-label="Has feature">
                      ✓
                    </span>
                  ) : (
                    <span className="text-ink/25" aria-label="Does not have feature">
                      ✗
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mt-6 w-full min-w-[480px] border-t border-line text-sm">
        <thead>
          <tr className="border-b border-line bg-paper">
            <th className="p-3 text-left text-xs font-bold uppercase text-ink/45">Spec</th>
            {listings.map((l) => (
              <th key={l.listingId} className="p-3 text-center text-xs font-semibold text-ink">
                {l.brand}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_SPEC_KEYS.map((key) => (
            <tr key={key} className="border-b border-line/60">
              <td className="p-3 text-xs font-medium text-ink/55">{COMPARE_SPEC_LABELS[key]}</td>
              {listings.map((l) => (
                <td key={l.listingId} className="p-3 text-center text-xs font-medium text-ink">
                  {getSpecValue(l, key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

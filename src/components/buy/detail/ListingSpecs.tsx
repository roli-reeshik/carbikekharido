import { buildSpecRows, MarketplaceListingDetail } from "@/lib/buy/listingDetail";

export function ListingSpecs({ listing }: { listing: MarketplaceListingDetail }) {
  const rows = buildSpecRows(listing);

  return (
    <section aria-labelledby="vehicle-details-heading">
      <h2 id="vehicle-details-heading" className="font-display text-xl font-bold text-ink">
        Vehicle Details
      </h2>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-line/80 pb-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">{row.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

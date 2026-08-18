import { deriveFeaturePills, MarketplaceListingDetail } from "@/lib/buy/listingDetail";

export function ListingFeaturePills({ listing }: { listing: MarketplaceListingDetail }) {
  const pills = deriveFeaturePills(listing);

  return (
    <section aria-labelledby="features-heading">
      <h2 id="features-heading" className="font-display text-xl font-bold text-ink">
        Features
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {pills.map((pill) => (
          <li
            key={pill.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              pill.present
                ? "bg-sell-emerald/12 text-sell-emerald"
                : "bg-line/60 text-ink/35 line-through"
            }`}
          >
            {pill.present ? "✓" : "✗"} {pill.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

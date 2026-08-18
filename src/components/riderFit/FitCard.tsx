import type { FitResult, FitTier } from "@/lib/riderFit/types";
import { ReachDiagram } from "./ReachDiagram";

const TIER_BADGE: Record<FitTier, { label: string; className: string }> = {
  excellent: { label: "Excellent fit", className: "bg-teal text-white" },
  good: { label: "Good fit", className: "bg-teal-light text-white" },
  workable: { label: "Workable", className: "bg-marigold text-highway" },
  poor: { label: "Poor fit", className: "bg-coral text-white" },
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

/** Rupees as the lakh/thousand shorthand Indian buyers read prices in. */
function formatInr(rupees: number) {
  if (rupees >= 100000) {
    const lakh = rupees / 100000;
    return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} lakh`;
  }
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

export function FitCard({ result }: { result: FitResult }) {
  const { bike, reach, manageability, intent, tier } = result;
  const badge = TIER_BADGE[tier];

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">{bike.modelName}</h3>
          {bike.exShowroomMinInr ? (
            <p className="mt-1 text-sm font-semibold text-ink">
              {formatInr(bike.exShowroomMinInr)}
              <span className="ml-1 text-xs font-normal text-ink/45">onwards, ex-showroom</span>
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-ink/50">
            {bike.seatHeightMm} mm seat · {bike.kerbWeightKg} kg
            {bike.displacementCc ? ` · ${bike.displacementCc}cc` : ""}
            {bike.bodyType ? ` · ${titleCase(bike.bodyType)}` : ""}
            {bike.isElectric ? " · Electric" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bike.ratingCount ? (
            <span className="whitespace-nowrap text-xs text-ink/50">
              {bike.ratingAvg ? `${bike.ratingAvg}★ · ` : ""}
              {bike.ratingCount.toLocaleString("en-IN")} owners
            </span>
          ) : null}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </header>

      <div className="mt-4">
        <ReachDiagram reach={reach} />
      </div>

      <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Handling it
          </dt>
          <dd className="mt-1 text-sm text-ink/70">{manageability.reason}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">
            Suits your riding
          </dt>
          <dd className="mt-1 text-sm text-ink/70">{intent.reason}</dd>
        </div>
      </dl>

      {result.cautioned ? (
        <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm text-coral">
          Worth sitting on this one before you commit.
        </p>
      ) : null}
    </article>
  );
}

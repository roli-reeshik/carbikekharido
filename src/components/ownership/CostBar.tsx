import type { CostLine } from "@/lib/ownership/types";

/** Colour per cost component, kept consistent between the bar and the legend. */
const SEGMENT_COLOR: Record<string, string> = {
  acquisition: "bg-highway",
  energy: "bg-teal",
  service: "bg-teal-light",
  consumables: "bg-marigold",
  insurance: "bg-ink/40",
  battery: "bg-coral",
};

export const COST_SEGMENT_COLOR = SEGMENT_COLOR;

/**
 * Stacked bar of what makes up the total, scaled against the most expensive
 * bike on screen so the columns are directly comparable rather than each
 * filling its own width.
 */
export function CostBar({ lines, scaleMaxInr }: { lines: CostLine[]; scaleMaxInr: number }) {
  const segments = lines.filter((l) => l.key !== "resale" && l.totalInr > 0);
  const gross = segments.reduce((sum, l) => sum + l.totalInr, 0);
  const widthPct = scaleMaxInr > 0 ? (gross / scaleMaxInr) * 100 : 0;

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-line/50">
      <div className="flex h-full" style={{ width: `${Math.min(100, widthPct)}%` }}>
        {segments.map((line) => (
          <div
            key={line.key}
            className={SEGMENT_COLOR[line.key] ?? "bg-ink/30"}
            style={{ width: `${(line.totalInr / gross) * 100}%` }}
            title={`${line.label}: ₹${line.totalInr.toLocaleString("en-IN")}`}
          />
        ))}
      </div>
    </div>
  );
}

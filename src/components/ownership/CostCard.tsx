"use client";

import { useState } from "react";
import { COST_SEGMENT_COLOR, CostBar } from "./CostBar";
import { formatInr, formatInrExact, formatPerKm } from "@/lib/ownership/format";
import type { OwnershipCost } from "@/lib/ownership/types";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

export function CostCard({
  cost,
  scaleMaxInr,
  cheapest,
  onRemove,
}: {
  cost: OwnershipCost;
  scaleMaxInr: number;
  cheapest: boolean;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { bike } = cost;

  return (
    <article
      className={`rounded-3xl border bg-surface p-5 sm:p-6 ${
        cheapest ? "border-teal ring-1 ring-teal/30" : "border-line"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-ink">{bike.modelName}</h3>
            {cheapest ? (
              <span className="rounded-full bg-teal px-2.5 py-0.5 text-xs font-semibold text-white">
                Cheapest to own
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            {formatInr(bike.exShowroomInr)} ex-showroom
            {bike.displacementCc ? ` · ${bike.displacementCc}cc` : ""}
            {bike.bodyType ? ` · ${titleCase(bike.bodyType)}` : ""}
            {cost.effectiveEfficiency
              ? ` · ${cost.effectiveEfficiency.value} ${cost.effectiveEfficiency.unit} real-world`
              : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="font-display text-2xl font-bold text-ink">
            {formatPerKm(cost.costPerKmInr)}
            <span className="ml-1 text-xs font-normal text-ink/45">per km</span>
          </p>
          <p className="text-xs text-ink/50">{formatInr(cost.totalInr)} over {cost.years} years</p>
        </div>
      </header>

      <div className="mt-4">
        <CostBar lines={cost.lines} scaleMaxInr={scaleMaxInr} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="On-road" value={formatInr(cost.acquisitionInr)} />
        <Stat label={`Running (${cost.years}y)`} value={formatInr(cost.runningInr)} />
        <Stat label="Resale back" value={formatInr(cost.resaleInr)} />
        <Stat label="Running per km" value={formatPerKm(cost.runningCostPerKmInr)} />
      </dl>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-xs font-semibold text-teal hover:underline"
      >
        {open ? "Hide the breakdown" : "Show the breakdown"}
      </button>

      {open ? (
        <div className="mt-3 border-t border-line pt-3">
          <table className="w-full text-sm">
            <tbody>
              {cost.lines.map((line) => (
                <tr key={line.key} className="align-top">
                  <td className="py-2 pr-3 w-4">
                    <span
                      className={`mt-1.5 block h-2.5 w-2.5 rounded-sm ${
                        COST_SEGMENT_COLOR[line.key] ?? "bg-line"
                      }`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-medium text-ink">{line.label}</span>
                    <p className="mt-0.5 text-xs text-ink/50">{line.detail}</p>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right font-mono tabular-nums text-ink">
                    {formatInrExact(line.totalInr)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td />
                <td className="py-2 font-semibold text-ink">Total cost of ownership</td>
                <td className="whitespace-nowrap py-2 text-right font-mono font-bold tabular-nums text-ink">
                  {formatInrExact(cost.totalInr)}
                </td>
              </tr>
            </tbody>
          </table>

          <ul className="mt-3 space-y-1 text-xs text-ink/45">
            {cost.assumptions.map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="mt-3 text-xs text-ink/40 hover:text-coral"
        >
          Remove
        </button>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink/40">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">{value}</dd>
    </div>
  );
}

import { ReactNode } from "react";

interface Props {
  stageNumber: number;
  totalStages: number;
  label: string;
  children: ReactNode;
}

/**
 * The homepage's one signature element: a dashed route-line running down
 * the page, with a milestone node at each real stage of buying a vehicle
 * (Explore -> Compare -> Verify -> Own). Unlike decorative numbered
 * steps, this ordering encodes something true — it's the actual sequence
 * a buyer moves through — so it earns its place rather than decorating.
 *
 * Desktop: rail sits to the left, dashed line runs continuously behind it.
 * Mobile: collapses to a compact horizontal label above each stage.
 */
export function StageSection({ stageNumber, totalStages, label, children }: Props) {
  return (
    <section className="relative flex gap-6 sm:gap-10">
      {/* Rail — desktop only */}
      <div className="hidden sm:flex flex-col items-center w-10 shrink-0">
        <div
          className="route-node flex h-10 w-10 items-center justify-center rounded-full bg-highway text-sm font-semibold text-white font-mono"
          aria-hidden
        >
          {String(stageNumber).padStart(2, "0")}
        </div>
        {stageNumber < totalStages && <div className="route-line flex-1 mt-2" aria-hidden />}
      </div>

      <div className="flex-1 pb-14 sm:pb-20">
        <p className="sm:hidden mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-highway-light">
          {String(stageNumber).padStart(2, "0")} · {label}
        </p>
        <p className="hidden sm:block mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-highway-light">
          {label}
        </p>
        {children}
      </div>
    </section>
  );
}

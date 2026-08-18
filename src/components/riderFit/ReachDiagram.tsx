import type { ReachScore, ReachVerdict } from "@/lib/riderFit/types";

/**
 * Seat height in millimetres tells a rider almost nothing. This puts their own
 * reach on the same scale beside it, so the question becomes visual: does my
 * leg get to the ground, and by how much do I miss?
 */

const VERDICT_STYLE: Record<ReachVerdict, { bar: string; text: string; label: string }> = {
  "flat-both-bent": { bar: "bg-teal", text: "text-teal-dark", label: "Flat feet, knees bent" },
  "flat-both": { bar: "bg-teal", text: "text-teal-dark", label: "Both feet flat" },
  "balls-both": { bar: "bg-teal-light", text: "text-teal-dark", label: "Balls of both feet" },
  "tiptoe-both": { bar: "bg-marigold", text: "text-marigold-dark", label: "Tiptoe both sides" },
  "tiptoe-marginal": { bar: "bg-coral-light", text: "text-coral", label: "Barely tiptoeing" },
  unreachable: { bar: "bg-coral", text: "text-coral", label: "Cannot reach safely" },
};

export function reachStyle(verdict: ReachVerdict) {
  return VERDICT_STYLE[verdict];
}

interface Props {
  reach: ReachScore;
}

export function ReachDiagram({ reach }: Props) {
  const style = VERDICT_STYLE[reach.verdict];

  // Shared scale with headroom, so neither bar ever fills the track completely.
  const scaleMax = Math.max(reach.effectiveSeatHeightMm, reach.usableInseamMm) * 1.12;
  const seatPct = (reach.effectiveSeatHeightMm / scaleMax) * 100;
  const reachPct = (reach.usableInseamMm / scaleMax) * 100;

  const shortfall = reach.gapMm > 0;

  return (
    <div className="space-y-2">
      <Row
        label="Seat height, with you on it"
        valueMm={reach.effectiveSeatHeightMm}
        widthPct={seatPct}
        barClass="bg-highway"
      />
      <Row
        label="How far your leg reaches"
        valueMm={reach.usableInseamMm}
        widthPct={reachPct}
        barClass={style.bar}
      />

      <p className={`pt-1 text-sm font-semibold ${style.text}`}>
        {style.label}
        <span className="ml-2 font-normal text-ink/60">
          {shortfall
            ? `seat sits ${reach.gapMm} mm above your reach`
            : `you clear it by ${Math.abs(reach.gapMm)} mm`}
        </span>
      </p>
    </div>
  );
}

function Row({
  label,
  valueMm,
  widthPct,
  barClass,
}: {
  label: string;
  valueMm: number;
  widthPct: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-ink/60">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{valueMm} mm</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(2, Math.min(100, widthPct))}%` }}
        />
      </div>
    </div>
  );
}

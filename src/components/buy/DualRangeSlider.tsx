"use client";

interface DualRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  step?: number;
  formatLabel?: (v: number) => string;
  onChange: (min: number, max: number) => void;
  className?: string;
}

export function DualRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  step = 1,
  formatLabel = (v) => String(v),
  onChange,
  className = "",
}: DualRangeSliderProps) {
  const lo = Math.min(valueMin, valueMax);
  const hi = Math.max(valueMin, valueMax);
  const range = max - min || 1;
  const leftPct = ((lo - min) / range) * 100;
  const widthPct = ((hi - lo) / range) * 100;

  return (
    <div className={className}>
      <div className="mb-2 flex justify-between text-xs font-medium text-ink/60">
        <span>{formatLabel(lo)}</span>
        <span>{formatLabel(hi)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-line">
        <div
          className="absolute h-full rounded-full bg-sell-accent/80"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onChange(Number(e.target.value), hi)}
          className="buy-range pointer-events-auto absolute inset-0 h-2 w-full appearance-none bg-transparent"
          aria-label="Minimum value"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onChange(lo, Number(e.target.value))}
          className="buy-range pointer-events-auto absolute inset-0 h-2 w-full appearance-none bg-transparent"
          aria-label="Maximum value"
        />
      </div>
    </div>
  );
}

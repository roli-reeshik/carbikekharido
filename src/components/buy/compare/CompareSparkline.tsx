"use client";

interface CompareSparklineProps {
  data: number[];
  color?: string;
  label: string;
}

export function CompareSparkline({ data, color = "#FF6B35", label }: CompareSparklineProps) {
  if (!data.length) return null;

  const w = 200;
  const h = 48;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="compare-sparkline" aria-label={`30-day price trend for ${label}`}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink/45">30-day price</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-hidden="true">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={w}
          cy={h - ((data[data.length - 1] - min) / range) * (h - 8) - 4}
          r={3}
          fill={color}
        />
      </svg>
    </div>
  );
}

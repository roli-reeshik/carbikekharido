"use client";

import { RADAR_AXES, RadarScores } from "@/lib/buy/compare";

const COLORS = ["#FF6B35", "#1E3A5F", "#2D7A6B", "#F5A623"];

interface CompareRadarChartProps {
  series: { id: string; label: string; scores: RadarScores }[];
}

function polarPoint(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function CompareRadarChart({ series }: CompareRadarChartProps) {
  const axes = [...RADAR_AXES];
  const n = axes.length;
  const cx = 160;
  const cy = 160;
  const maxR = 120;

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <figure className="compare-radar" aria-label="Specification radar comparison">
      <svg viewBox="0 0 320 340" className="mx-auto w-full max-w-sm" role="img">
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={axes
              .map((_, i) => {
                const p = polarPoint(cx, cy, maxR * level, i, n);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#E2E6EB"
            strokeWidth={1}
          />
        ))}
        {axes.map((axis, i) => {
          const p = polarPoint(cx, cy, maxR, i, n);
          return (
            <g key={axis}>
              <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E2E6EB" strokeWidth={1} />
              <text
                x={polarPoint(cx, cy, maxR + 18, i, n).x}
                y={polarPoint(cx, cy, maxR + 18, i, n).y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-ink/50 text-[9px]"
              >
                {axis}
              </text>
            </g>
          );
        })}
        {series.map((s, si) => {
          const points = axes
            .map((axis, i) => {
              const r = (s.scores[axis] / 100) * maxR;
              const p = polarPoint(cx, cy, r, i, n);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={s.id}
              points={points}
              fill={COLORS[si % COLORS.length]}
              fillOpacity={0.15}
              stroke={COLORS[si % COLORS.length]}
              strokeWidth={2}
            />
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap justify-center gap-3">
        {series.map((s, i) => (
          <span key={s.id} className="flex items-center gap-1.5 text-xs text-ink/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

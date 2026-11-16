"use client";

import { useState } from "react";
import type { PracticeWeek } from "@/lib/data/supabase/results";

// One subject's practice score per week (0–100%). A single series, so no
// legend: the card's title names the subject. Hover or focus a dot for the week.

const W = 320;
const H = 130;
const L = 30;
const R = 10;
const T = 10;
const B = 22;

const weekLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function PracticeChart({ weeks }: { weeks: PracticeWeek[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (weeks.length === 0) return null;
  const times = weeks.map((w) => Date.parse(`${w.week}T00:00:00Z`));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const x = (t: number) => (t1 === t0 ? L + (W - L - R) / 2 : L + ((t - t0) / (t1 - t0)) * (W - L - R));
  const y = (p: number) => T + ((100 - p) / 100) * (H - T - B);
  const pts = weeks.map((w, i) => ({ w, p: w.max ? (w.score / w.max) * 100 : 0, cx: x(times[i]) })).map((d) => ({ ...d, cy: y(d.p) }));
  const path = pts.map((d, i) => `${i ? "L" : "M"} ${d.cx.toFixed(1)} ${d.cy.toFixed(1)}`).join(" ");
  const active = hover === null ? null : pts[hover];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Practice score by week: ${pts.map((d) => `${Math.round(d.p)}% in the week of ${weekLabel(d.w.week)}`).join(", ")}`}>
        {[0, 50, 100].map((p) => (
          <g key={p}>
            <line x1={L} x2={W - R} y1={y(p)} y2={y(p)} stroke="var(--color-outline-variant)" strokeWidth={p === 50 ? 1 : 0.5} strokeDasharray={p === 50 ? undefined : "2 3"} />
            <text x={L - 6} y={y(p)} dy="0.35em" textAnchor="end" fontSize="10" fill="var(--color-on-surface-variant)">
              {p}%
            </text>
          </g>
        ))}
        <text x={L} y={H - 6} fontSize="10" fill="var(--color-on-surface-variant)">
          {weekLabel(weeks[0].week)}
        </text>
        {weeks.length > 1 && (
          <text x={W - R} y={H - 6} textAnchor="end" fontSize="10" fill="var(--color-on-surface-variant)">
            {weekLabel(weeks[weeks.length - 1].week)}
          </text>
        )}
        {pts.length > 1 && <path d={path} fill="none" stroke="var(--color-chart-2)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map((d, i) => (
          <g key={d.w.week}>
            <circle cx={d.cx} cy={d.cy} r={hover === i ? 6 : 4.5} fill="var(--color-chart-2)" stroke="var(--color-surface-container-lowest)" strokeWidth={2} />
            <circle
              cx={d.cx}
              cy={d.cy}
              r={12}
              fill="transparent"
              tabIndex={0}
              aria-label={`Week of ${weekLabel(d.w.week)}: ${d.w.score}/${d.w.max} marks (${Math.round(d.p)}%), ${d.w.questions} questions`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            />
          </g>
        ))}
      </svg>
      {active && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-outline-variant bg-surface-raised shadow-md px-sm py-xs text-label-sm text-on-surface whitespace-nowrap"
          style={{ left: `${(active.cx / W) * 100}%`, top: `calc(${(active.cy / H) * 100}% - 10px)` }}
        >
          <p className="font-semibold">Week of {weekLabel(active.w.week)}</p>
          <p>
            {Math.round(active.p)}% · {active.w.score}/{active.w.max} marks
          </p>
          <p className="text-on-surface-variant">{active.w.questions} questions</p>
        </div>
      )}
    </div>
  );
}

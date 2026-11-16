"use client";

import { useState } from "react";
import { chartGrade, describeResult, RESULT_KIND_LABEL, type StudentResult } from "@/lib/results";
import type { Boundaries } from "@/lib/grade-boundaries";

// One subject's grades over time (1–7). A single series, so no legend: the
// card's title names the subject. Filled dots are IB grades as logged;
// hollow dots are estimates from a percentage or marks. Hover or focus a dot
// for the result.

const W = 320;
const H = 150;
const L = 22; // room for the 1–7 labels
const R = 10;
const T = 10;
const B = 22;

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function GradeChart({ results, boundaries }: { results: StudentResult[]; boundaries: Boundaries }) {
  const [hover, setHover] = useState<number | null>(null);
  const points = results
    .map((r) => ({ r, g: chartGrade(r, boundaries) }))
    .filter((p): p is { r: StudentResult; g: NonNullable<ReturnType<typeof chartGrade>> } => p.g !== null);
  if (points.length === 0) return null;

  const times = points.map((p) => Date.parse(`${p.r.takenOn}T00:00:00Z`));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const x = (t: number) => (t1 === t0 ? L + (W - L - R) / 2 : L + ((t - t0) / (t1 - t0)) * (W - L - R));
  const y = (g: number) => T + ((7 - g) / 6) * (H - T - B);
  const xy = points.map((p, i) => ({ ...p, cx: x(times[i]), cy: y(p.g.grade) }));
  const path = xy.map((p, i) => `${i ? "L" : "M"} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(" ");
  const active = hover === null ? null : xy[hover];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Grades over time: ${points.map((p) => `${p.g.grade} on ${shortDate(p.r.takenOn)}`).join(", ")}`}>
        {/* Recessive grid: one line per grade, labels on the odd ones. */}
        {[1, 2, 3, 4, 5, 6, 7].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--color-outline-variant)" strokeWidth={g === 4 ? 1 : 0.5} strokeDasharray={g === 4 ? undefined : "2 3"} />
            {g % 2 === 1 && (
              <text x={L - 8} y={y(g)} dy="0.35em" textAnchor="end" fontSize="10" fill="var(--color-on-surface-variant)">
                {g}
              </text>
            )}
          </g>
        ))}
        <text x={L} y={H - 6} fontSize="10" fill="var(--color-on-surface-variant)">
          {shortDate(points[0].r.takenOn)}
        </text>
        {points.length > 1 && (
          <text x={W - R} y={H - 6} textAnchor="end" fontSize="10" fill="var(--color-on-surface-variant)">
            {shortDate(points[points.length - 1].r.takenOn)}
          </text>
        )}
        {xy.length > 1 && <path d={path} fill="none" stroke="var(--color-chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {xy.map((p, i) => (
          <g key={p.r.id}>
            {/* A 2px surface ring keeps overlapping dots apart. */}
            <circle
              cx={p.cx}
              cy={p.cy}
              r={hover === i ? 6 : 4.5}
              fill={p.g.estimated ? "var(--color-surface-container-lowest)" : "var(--color-chart-1)"}
              stroke={p.g.estimated ? "var(--color-chart-1)" : "var(--color-surface-container-lowest)"}
              strokeWidth={2}
            />
            {/* Bigger invisible hit target than the dot. */}
            <circle
              cx={p.cx}
              cy={p.cy}
              r={12}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.r.title}, ${shortDate(p.r.takenOn)}: ${describeResult(p.r)}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="cursor-default outline-none"
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
          <p className="font-semibold">{active.r.title}</p>
          <p className="text-on-surface-variant">
            {RESULT_KIND_LABEL[active.r.kind]} · {shortDate(active.r.takenOn)}
          </p>
          <p>
            {describeResult(active.r)}
            {active.g.estimated ? ` · about a ${active.g.grade}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

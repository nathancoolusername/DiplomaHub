"use client";

import { useMemo, useState } from "react";

export type LineSeries = {
  key: string;
  label: string;
  color: string;
  data: { date: string; count: number }[];
};

// A "clean" round number at or above `value` — 1/2/5 x a power of 10 — so
// y-axis ticks never read as 0 / 347 / 694 / 1,041.
function niceMax(value: number): number {
  // Below 4, the 0/25/50/75/100% tick fractions round to duplicate integers
  // (e.g. max=1 -> ticks 0,0,1,1,1) — 4 is the smallest max that keeps all
  // 5 ticks distinct.
  if (value <= 4) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const WIDTH = 700;
const HEIGHT = 220;
const PAD_LEFT = 40;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export function LineChart({ series }: { series: LineSeries[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const dates = series[0]?.data.map((d) => d.date) ?? [];
  const maxValue = useMemo(() => {
    const rawMax = Math.max(
      1,
      ...series.flatMap((s) => s.data.map((d) => d.count)),
    );
    return niceMax(rawMax);
  }, [series]);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(index: number) {
    if (dates.length <= 1) return PAD_LEFT + plotWidth / 2;
    return PAD_LEFT + (index / (dates.length - 1)) * plotWidth;
  }
  function yFor(value: number) {
    return PAD_TOP + plotHeight - (value / maxValue) * plotHeight;
  }

  function pathFor(data: { count: number }[]) {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.count)}`)
      .join(" ");
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxValue * t));

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, relX / rect.width));
    const index = Math.round(ratio * (dates.length - 1));
    setHoverIndex(index);
  }

  const isSingleSeries = series.length === 1;

  return (
    <div className="flex flex-col gap-sm">
      {!isSingleSeries && (
        <div className="flex flex-row flex-wrap gap-md">
          {series.map((s) => (
            <div key={s.key} className="flex flex-row items-center gap-xs">
              <span
                className="inline-block w-4 h-0.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-label-sm text-on-surface-variant">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label={series.map((s) => s.label).join(", ")}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="var(--color-outline-variant)"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={yFor(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-on-surface-variant"
                fontSize={10}
              >
                {tick.toLocaleString()}
              </text>
            </g>
          ))}

          {isSingleSeries &&
            series[0] &&
            series[0].data.length > 1 && (
              <path
                d={`${pathFor(series[0].data)} L ${xFor(series[0].data.length - 1)} ${yFor(0)} L ${xFor(0)} ${yFor(0)} Z`}
                fill={series[0].color}
                opacity={0.1}
              />
            )}

          {series.map((s) => (
            <path
              key={s.key}
              d={pathFor(s.data)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {isSingleSeries && series[0] && series[0].data.length > 0 && (
            <>
              <circle
                cx={xFor(series[0].data.length - 1)}
                cy={yFor(series[0].data[series[0].data.length - 1].count)}
                r={4}
                fill={series[0].color}
                stroke="var(--color-surface-container-lowest)"
                strokeWidth={2}
              />
              <text
                x={xFor(series[0].data.length - 1) - 6}
                y={yFor(series[0].data[series[0].data.length - 1].count) - 8}
                textAnchor="end"
                fontSize={11}
                fontWeight={700}
                className="fill-on-surface"
              >
                {series[0].data[series[0].data.length - 1].count}
              </text>
            </>
          )}

          {hoverIndex !== null && dates[hoverIndex] && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke="var(--color-outline)"
              strokeWidth={1}
            />
          )}
          {hoverIndex !== null &&
            series.map((s) => {
              const point = s.data[hoverIndex];
              if (!point) return null;
              return (
                <circle
                  key={s.key}
                  cx={xFor(hoverIndex)}
                  cy={yFor(point.count)}
                  r={4}
                  fill={s.color}
                  stroke="var(--color-surface-container-lowest)"
                  strokeWidth={2}
                />
              );
            })}

          <text
            x={PAD_LEFT}
            y={HEIGHT - 6}
            fontSize={10}
            className="fill-on-surface-variant"
          >
            {dates[0] && formatShortDate(dates[0])}
          </text>
          <text
            x={WIDTH - PAD_RIGHT}
            y={HEIGHT - 6}
            textAnchor="end"
            fontSize={10}
            className="fill-on-surface-variant"
          >
            {dates[dates.length - 1] && formatShortDate(dates[dates.length - 1])}
          </text>

          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hoverIndex !== null && dates[hoverIndex] && (
          <div
            className="absolute top-0 pointer-events-none bg-surface-container-lowest border-1 border-outline-variant rounded-lg shadow-md px-sm py-xs text-label-sm flex flex-col gap-1 z-10"
            style={{
              left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
              transform:
                xFor(hoverIndex) / WIDTH > 0.75
                  ? "translateX(-100%)"
                  : "translateX(8px)",
            }}
          >
            <p className="font-semibold text-on-surface">
              {formatShortDate(dates[hoverIndex])}
            </p>
            {series.map((s) => (
              <p key={s.key} className="flex flex-row items-center gap-xs">
                <span
                  className="inline-block w-3 h-0.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-bold text-on-surface">
                  {s.data[hoverIndex]?.count ?? 0}
                </span>
                {!isSingleSeries && (
                  <span className="text-on-surface-variant">{s.label}</span>
                )}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

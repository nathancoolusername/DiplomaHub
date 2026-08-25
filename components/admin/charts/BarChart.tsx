"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number };

const ROW_HEIGHT = 32;
const BAR_HEIGHT = 20;
const LABEL_WIDTH = 160;
const CHART_WIDTH = 700;

export function BarChart({
  data,
  color,
}: {
  data: BarDatum[];
  color: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const plotWidth = CHART_WIDTH - LABEL_WIDTH - 48;
  const height = data.length * ROW_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d, i) => {
        const barWidth = (d.value / maxValue) * plotWidth;
        const y = i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
        const isHovered = hoverIndex === i;
        return (
          <g
            key={d.label}
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex(null)}
            className="cursor-default"
          >
            <rect
              x={0}
              y={i * ROW_HEIGHT}
              width={CHART_WIDTH}
              height={ROW_HEIGHT}
              fill="transparent"
            />
            <text
              x={LABEL_WIDTH - 12}
              y={y + BAR_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              className="fill-on-surface-variant"
            >
              {d.label.length > 26 ? `${d.label.slice(0, 25)}…` : d.label}
            </text>
            <rect
              x={LABEL_WIDTH}
              y={y}
              width={Math.max(2, barWidth)}
              height={BAR_HEIGHT}
              rx={4}
              fill={color}
              opacity={isHovered ? 0.85 : 1}
            />
            <text
              x={LABEL_WIDTH + Math.max(2, barWidth) + 8}
              y={y + BAR_HEIGHT / 2}
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={700}
              className="fill-on-surface"
            >
              {d.value.toLocaleString()}
            </text>
            <title>{`${d.label}: ${d.value.toLocaleString()}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

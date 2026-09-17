"use client";

import { useEffect, useState } from "react";
import { Gauge, Plus } from "lucide-react";
import { isSameDay } from "./calendar/calendar-utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHART_WIDTH = 280;
const CHART_HEIGHT = 90;
const BAR_WIDTH = 22;
const GAP = (CHART_WIDTH - BAR_WIDTH * 7) / 8;
const PLOT_TOP = 6;
const PLOT_BOTTOM = 74;
const GOAL_HOURS = 30;

const SESSION_PRESETS = [
  { label: "15m", hours: 0.25 },
  { label: "30m", hours: 0.5 },
  { label: "1h", hours: 1 },
  { label: "2h", hours: 2 },
];

export default function StudyTimeCard({
  studyLog,
  weekDates,
  onLogSession,
}: {
  studyLog: number[];
  weekDates: Date[];
  onLogSession: (hours: number) => void;
}) {
  const today = new Date();
  const totalLogged = studyLog.reduce((a, b) => a + b, 0);
  const maxValue = Math.max(6, ...studyLog);
  const percent = Math.min(100, Math.round((totalLogged / GOAL_HOURS) * 100));
  const remaining = Math.max(0, GOAL_HOURS - totalLogged);

  const [justLoggedLabel, setJustLoggedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!justLoggedLabel) return;
    const id = setTimeout(() => setJustLoggedLabel(null), 2500);
    return () => clearTimeout(id);
  }, [justLoggedLabel]);

  function handleLog(preset: (typeof SESSION_PRESETS)[number]) {
    onLogSession(preset.hours);
    setJustLoggedLabel(preset.label);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <Gauge size={20} className="text-secondary" />
          <h3 className="text-headline-sm font-semibold text-on-surface">Study Time This Week</h3>
        </div>
        <span className="px-sm py-1 rounded bg-surface-container text-label-sm text-on-surface-variant font-medium">
          Goal: {GOAL_HOURS}h
        </span>
      </div>

      <div className="flex items-baseline gap-sm">
        <span className="text-display-lg font-bold text-primary">{totalLogged.toFixed(1)}</span>
        <span className="text-label-md text-on-surface-variant font-medium">hours logged</span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-24"
        role="img"
        aria-label={`Daily study hours: ${WEEKDAY_LABELS.map((label, i) => `${label} ${studyLog[i]} hours`).join(", ")}`}
      >
        <line
          x1={0}
          x2={CHART_WIDTH}
          y1={PLOT_BOTTOM}
          y2={PLOT_BOTTOM}
          stroke="var(--color-outline-variant)"
          strokeWidth={1}
        />
        {studyLog.map((hours, i) => {
          const x = GAP + i * (BAR_WIDTH + GAP);
          const plotHeight = PLOT_BOTTOM - PLOT_TOP;
          const barHeight = hours === 0 ? 0 : Math.max(4, (hours / maxValue) * plotHeight);
          const y = PLOT_BOTTOM - barHeight;
          const isToday = isSameDay(weekDates[i], today);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={3}
                fill={isToday ? "var(--color-primary)" : "var(--color-surface-tint)"}
                opacity={isToday ? 1 : hours === 0 ? 0.3 : 0.65}
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - 2}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isToday ? 700 : 500}
                className={isToday ? "fill-primary" : "fill-on-surface-variant"}
              >
                {WEEKDAY_LABELS[i]}
              </text>
              <title>{`${WEEKDAY_LABELS[i]}: ${hours.toFixed(1)}h`}</title>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-sm border-t border-outline-variant/50">
        <span>{percent}% of weekly target achieved</span>
        <span className="font-semibold text-primary">{remaining.toFixed(1)}h remaining</span>
      </div>

      <div className="flex items-center justify-between gap-sm pt-sm border-t border-outline-variant/50">
        <div className="flex items-center gap-sm flex-wrap">
          <span className="text-label-sm font-semibold text-on-surface-variant shrink-0">Log a session:</span>
          {SESSION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleLog(preset)}
              className="inline-flex items-center gap-1 px-sm py-1 rounded-full border border-outline-variant text-label-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Plus size={12} />
              {preset.label}
            </button>
          ))}
        </div>
        <span
          className={`text-label-sm font-semibold text-secondary transition-opacity ${justLoggedLabel ? "opacity-100" : "opacity-0"}`}
          aria-live="polite"
        >
          {justLoggedLabel ? `Logged +${justLoggedLabel}` : ""}
        </span>
      </div>
    </div>
  );
}

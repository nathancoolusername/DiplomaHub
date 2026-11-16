"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The calendar's own toolbar: Week / Month, ‹ Today › and the dates. It sits
 * on the calendar so changing week or month doesn't mean scrolling back up
 * to the Hub header.
 */
export function CalendarToolbar({
  view,
  onChangeView,
  onPrev,
  onNext,
  onToday,
  label,
}: {
  view: "week" | "month";
  onChangeView: (v: "week" | "month") => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  label: string;
}) {
  const unit = view === "week" ? "week" : "month";
  return (
    <div className="flex flex-wrap items-center justify-between gap-sm px-md py-xs bg-surface-container-low border-b border-outline-variant">
      <div className="flex items-center gap-xs">
        <button type="button" onClick={onPrev} aria-label={`Previous ${unit}`} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary cursor-pointer">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={onToday} className="px-sm py-0.5 rounded-lg text-label-md font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary cursor-pointer">
          Today
        </button>
        <button type="button" onClick={onNext} aria-label={`Next ${unit}`} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary cursor-pointer">
          <ChevronRight size={18} />
        </button>
        <span className="ml-xs text-label-md font-semibold text-on-surface tabular-nums">{label}</span>
      </div>
      <div className="inline-flex rounded-lg bg-surface-container p-0.5" role="group" aria-label="Calendar view">
        {(["week", "month"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChangeView(v)}
            aria-pressed={view === v}
            className={`px-sm py-0.5 rounded-md text-label-md font-semibold cursor-pointer ${
              view === v ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {v === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>
    </div>
  );
}

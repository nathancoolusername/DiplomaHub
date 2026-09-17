"use client";

import { AlertCircle, Check, PlayCircle, Plus, Target } from "lucide-react";
import type { HubItem } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { getDueStatus } from "./format";
import { formatTime, isSameDay } from "./calendar/calendar-utils";

export default function TodayFocus({
  items,
  onSelect,
  onToggleStatus,
  onStartFocus,
  onAddItem,
}: {
  items: HubItem[];
  onSelect: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onStartFocus: (id: string) => void;
  onAddItem: () => void;
}) {
  const now = new Date();

  // Timed items due today, plus anything still overdue from an earlier day
  // (excluded here so it isn't double-counted — a same-day item that's
  // overdue is still picked up by the first filter and just gets the
  // "overdue" badge instead of a plain time). All-day milestones live in
  // MilestonesBar, not here.
  const todayItems = items.filter((item) => !item.allDay && isSameDay(item.start, now));
  const overdueFromBefore = items.filter(
    (item) => !item.allDay && item.status !== "done" && !isSameDay(item.start, now) && getDueStatus(item, now) === "overdue",
  );
  const stripItems = [...overdueFromBefore, ...todayItems].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const activeItems = stripItems.filter((item) => item.status !== "done");
  const nextItem = activeItems[0] ?? null;

  return (
    <div
      data-tour="today-focus"
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm"
    >
      <div className="flex items-center gap-1.5">
        <Target size={16} className="text-primary-container" />
        <span className="text-label-md font-bold text-on-surface">Today&apos;s Focus</span>
      </div>

      {stripItems.length === 0 ? (
        <div className="flex items-center justify-between gap-sm py-1">
          <p className="text-body-md text-on-surface-variant">Nothing scheduled for today.</p>
          <button
            type="button"
            onClick={onAddItem}
            className="shrink-0 inline-flex items-center gap-1 px-sm py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={14} />
            Add item
          </button>
        </div>
      ) : activeItems.length === 0 ? (
        <p className="text-body-md text-on-surface-variant py-1">
          You&apos;re done for today — nice work.
        </p>
      ) : (
        <div className="flex flex-col md:flex-row gap-sm md:overflow-x-auto md:pb-1">
          {stripItems.map((item) => {
            const isNext = item.id === nextItem?.id;
            const color = getSubjectColor(item.subjectId);
            const dueStatus = getDueStatus(item, now);
            const isOverdue = dueStatus === "overdue";
            const isDone = item.status === "done";

            return (
              <div
                key={item.id}
                className={`flex items-center gap-sm p-sm rounded-lg border md:shrink-0 md:w-72 transition-colors ${
                  isNext
                    ? "border-primary bg-primary-fixed/40"
                    : isOverdue
                      ? "border-error-container bg-error-container/30"
                      : "border-outline-variant/50 bg-surface-container-low"
                } ${isDone ? "opacity-60" : ""}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(item.id);
                  }}
                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                  aria-pressed={isDone}
                  className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    isDone ? "bg-primary border-primary text-on-primary" : "border-outline-variant hover:border-primary"
                  }`}
                >
                  {isDone && <Check size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex-1 min-w-0 flex flex-col items-start text-left cursor-pointer"
                >
                  <span
                    className={`text-label-md font-semibold truncate w-full ${isDone ? "line-through text-on-surface-variant" : "text-on-surface"}`}
                  >
                    {item.title}
                  </span>
                  <span
                    className={`text-[11px] font-medium flex items-center gap-1 ${isOverdue ? "text-error" : "text-on-surface-variant"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color.base }} aria-hidden="true" />
                    {isOverdue && <AlertCircle size={11} className="shrink-0" aria-hidden="true" />}
                    {isOverdue ? "Overdue" : formatTime(item.start)}
                  </span>
                </button>

                {isNext && (
                  <button
                    type="button"
                    onClick={() => onStartFocus(item.id)}
                    aria-label="Start focus session"
                    title="Start focus session"
                    className="shrink-0 p-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <PlayCircle size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

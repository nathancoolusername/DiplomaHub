"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { HubItem, SubjectId } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { ITEM_TYPE_META } from "./item-type-meta";
import { formatTime, isSameDay } from "./calendar/calendar-utils";

export default function DayAgenda({
  weekDates,
  items,
  activeSubjectIds,
  selectedItemId,
  onSelect,
  onClose,
}: {
  weekDates: Date[];
  items: HubItem[];
  activeSubjectIds: Set<SubjectId>;
  selectedItemId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [activeDate, setActiveDate] = useState<Date>(() => weekDates.find((d) => isSameDay(d, today)) ?? weekDates[0]);

  const dayItems = items
    .filter((item) => !item.allDay)
    .filter((item) => item.subjectId === null || activeSubjectIds.has(item.subjectId))
    .filter((item) => isSameDay(item.start, activeDate))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
      <div className="flex overflow-x-auto border-b border-outline-variant bg-surface-container-low">
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          const isActive = isSameDay(date, activeDate);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveDate(date)}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-1 px-md py-sm min-w-16 shrink-0 border-b-2 transition-colors cursor-pointer ${
                isActive ? "border-primary" : "border-transparent"
              }`}
            >
              <span className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-on-surface-variant"}`}>
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span
                className={`text-label-md font-bold flex items-center justify-center w-7 h-7 rounded-full ${
                  isActive ? "bg-primary text-on-primary" : "text-on-surface"
                }`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-col divide-y divide-outline-variant/40 min-h-40"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {dayItems.length === 0 && (
          <p className="text-body-md text-on-surface-variant text-center py-xl">Nothing scheduled this day.</p>
        )}
        {dayItems.map((item) => {
          const color = getSubjectColor(item.subjectId);
          const { Icon } = ITEM_TYPE_META[item.type];
          const done = item.status === "done";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-sm px-md py-sm text-left border-l-[3px] hover:bg-surface-container transition-colors cursor-pointer ${
                selectedItemId === item.id ? "bg-surface-container" : ""
              } ${done ? "opacity-60" : ""}`}
              style={{ borderLeftColor: color.base }}
            >
              <span className="text-label-sm text-on-surface-variant font-semibold w-14 shrink-0">
                {formatTime(item.start)}
              </span>
              {done ? (
                <Check size={14} className="shrink-0 text-on-surface-variant" />
              ) : (
                <Icon size={14} className="shrink-0" style={{ color: color.base }} />
              )}
              <span className={`text-body-md font-semibold ${done ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

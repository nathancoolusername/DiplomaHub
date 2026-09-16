"use client";

import type { HubItem } from "./mock-data";
import { getSubject } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { isSameDay } from "./calendar/calendar-utils";

export default function MonthView({
  anchorDate,
  items,
  onSelectDay,
}: {
  anchorDate: Date;
  items: HubItem[];
  onSelectDay: (date: Date) => void;
}) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-start
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstWeekday);

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-sm text-center text-[11px] font-semibold text-outline">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const dayItems = items.filter((item) => isSameDay(item.start, day));
          const subjectNames = dayItems.map(
            (item) => getSubject(item.subjectId)?.name ?? "General",
          );
          const label =
            dayItems.length === 0
              ? `${day.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, no items`
              : `${day.toLocaleDateString(undefined, { month: "long", day: "numeric" })}: ${subjectNames.join(", ")}`;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={label}
              className={`flex flex-col items-center gap-1 py-sm border-b border-r border-outline-variant/40 min-h-20 hover:bg-surface-container transition-colors cursor-pointer ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`text-label-sm font-bold flex items-center justify-center w-6 h-6 rounded-full ${
                  isToday ? "bg-primary text-on-primary" : "text-on-surface"
                }`}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-wrap justify-center gap-1 max-w-14">
                {dayItems.slice(0, 4).map((item) => (
                  <span
                    key={item.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getSubjectColor(item.subjectId).base }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

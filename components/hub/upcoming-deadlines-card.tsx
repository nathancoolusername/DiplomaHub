"use client";

import { CalendarDays } from "lucide-react";
import type { HubItem } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { getDueStatus, relativeDayLabel } from "./format";

export default function UpcomingDeadlinesCard({
  items,
  onSelect,
}: {
  items: HubItem[];
  onSelect: (id: string) => void;
}) {
  const now = new Date();
  const fourteenDaysOut = now.getTime() + 14 * 86400000;

  const upcoming = items
    .filter((item) => item.status !== "done" && item.end.getTime() <= fourteenDaysOut)
    .sort((a, b) => a.end.getTime() - b.end.getTime())
    .slice(0, 6);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <CalendarDays size={20} className="text-secondary" />
          <h3 className="text-headline-sm font-semibold text-on-surface">Upcoming Deadlines</h3>
        </div>
        <span className="text-label-sm text-on-surface-variant">Next 14 Days</span>
      </div>

      <div className="flex flex-col gap-sm">
        {upcoming.length === 0 && (
          <p className="text-body-md text-on-surface-variant">Nothing due in the next two weeks.</p>
        )}
        {upcoming.map((item) => {
          const color = getSubjectColor(item.subjectId);
          const status = getDueStatus(item, now);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex items-center justify-between gap-sm p-sm rounded-lg bg-surface-container-low border border-outline-variant/40 hover:border-primary transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-sm min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color.base }}
                  aria-hidden="true"
                />
                <div className="flex flex-col truncate">
                  <span className="text-label-md font-semibold text-on-surface truncate">{item.title}</span>
                  <span className="text-[11px] text-on-surface-variant">{item.weightLabel ?? "Deadline"}</span>
                </div>
              </div>
              <span
                className={`text-label-sm px-sm py-1 rounded font-bold shrink-0 ${
                  status === "overdue"
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {relativeDayLabel(item.end, now)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

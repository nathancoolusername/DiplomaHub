"use client";

import { AlertCircle, Pencil } from "lucide-react";
import type { HubItem, Subject, SubjectId } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { ITEM_TYPE_META } from "./item-type-meta";
import { formatDueLabel, getDueStatus } from "./format";

export default function MilestonesBar({
  subjects,
  activeSubjectIds,
  onToggleSubject,
  onEditSubjects,
  allDayItems,
  selectedItemId,
  onSelect,
}: {
  subjects: Subject[];
  activeSubjectIds: Set<SubjectId>;
  onToggleSubject: (id: SubjectId) => void;
  onEditSubjects: () => void;
  allDayItems: HubItem[];
  selectedItemId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      data-tour="milestones"
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between gap-sm h-full"
    >
      <div data-tour="subject-filter" className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[11px] font-semibold text-outline mr-1 uppercase tracking-wider shrink-0">
          Filter:
        </span>
        {subjects.map((subject) => {
          const color = getSubjectColor(subject.id);
          const active = activeSubjectIds.has(subject.id);
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onToggleSubject(subject.id)}
              aria-pressed={active}
              className="inline-flex items-center gap-1.5 px-sm py-1 rounded-full border text-label-sm font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
              style={
                active
                  ? { backgroundColor: `${color.base}1f`, borderColor: color.base, color: color.base }
                  : { borderColor: "var(--color-outline-variant)", color: "var(--color-on-surface-variant)" }
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: active ? color.base : "var(--color-outline-variant)" }}
                aria-hidden="true"
              />
              {subject.shortName}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onEditSubjects}
          className="inline-flex items-center gap-1 px-sm py-1 rounded-full border border-dashed border-outline-variant text-label-sm font-medium text-on-surface-variant hover:text-primary hover:border-primary transition-colors cursor-pointer shrink-0"
        >
          <Pencil size={11} />
          Edit subjects
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-sm pt-sm border-t border-outline-variant/40">
        {allDayItems.length === 0 && (
          <p className="text-label-sm text-on-surface-variant col-span-full">
            No all-day milestones this week.
          </p>
        )}
        {allDayItems.map((item) => {
          const color = getSubjectColor(item.subjectId);
          const { Icon } = ITEM_TYPE_META[item.type];
          const now = new Date();
          const dueStatus = getDueStatus(item, now);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`p-sm rounded-lg bg-surface-container-low border-l-[3px] flex items-start gap-sm text-left shadow-xs hover:bg-surface-container transition-colors cursor-pointer ${
                selectedItemId === item.id ? "ring-2 ring-primary" : ""
              } ${item.status === "done" ? "opacity-60" : ""}`}
              style={{ borderLeftColor: color.base }}
            >
              <Icon size={16} className="shrink-0 mt-0.5" style={{ color: color.base }} />
              <div className="flex flex-col min-w-0 gap-0.5">
                <span className="text-label-sm font-bold text-on-surface truncate flex items-center gap-1">
                  {item.title}
                  {dueStatus === "overdue" && (
                    <AlertCircle size={12} className="text-error shrink-0" aria-label="Overdue" />
                  )}
                </span>
                <span
                  className={`text-[11px] truncate ${dueStatus === "due-today" ? "text-primary font-medium" : "text-on-surface-variant"}`}
                >
                  {item.weightLabel ?? formatDueLabel(item, now)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

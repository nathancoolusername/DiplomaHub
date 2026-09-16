"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  PlayCircle,
  X,
} from "lucide-react";
import type { Resource } from "@/app/lib/types";
import type { HubItem } from "./mock-data";
import { getSubject } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { ITEM_TYPE_META } from "./item-type-meta";
import { formatDueLabel, getDueStatus } from "./format";
import { toTimeInputValue } from "./calendar/calendar-utils";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export type TaskDetailsPanelProps = {
  item: HubItem;
  variant: "panel" | "sheet";
  panelLeft?: number;
  panelWidth?: number;
  side?: "left" | "right";
  resources: Resource[];
  savedResourceIds: Set<string>;
  onToggleSaveResource: (id: string) => void;
  onClose: () => void;
  onToggleStage: (itemId: string, stageIndex: number) => void;
  onToggleStatus: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onUpdateTime: (itemId: string, start: Date, end: Date) => void;
  onStartFocus: (itemId: string) => void;
};

export default function TaskDetailsPanel(props: TaskDetailsPanelProps) {
  const { variant, panelLeft, panelWidth, side, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus in on mount, return it to whatever triggered the open on
  // unmount. Deliberately separate from the keydown effect below so that
  // typing in the notes field (which re-renders this component) never
  // re-steals focus back to the first element.
  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    getFocusable(panelRef.current)[0]?.focus();
    return () => prevActive?.focus?.();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable(panelRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const content = <PanelContent {...props} />;

  if (variant === "sheet") {
    return createPortal(
      <div className="fixed inset-0 z-100 flex items-end justify-center">
        <div
          className="absolute inset-0 bg-on-surface/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${props.item.title} details`}
          className="relative bg-surface-container-lowest rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-lg flex flex-col gap-md shadow-xl"
        >
          {content}
        </div>
      </div>,
      document.body,
    );
  }

  const shadow =
    side === "right"
      ? "-12px 0 24px -12px rgba(11,28,48,0.25)"
      : "12px 0 24px -12px rgba(11,28,48,0.25)";

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={`${props.item.title} details`}
      className="absolute top-0 bottom-0 bg-surface-container-lowest z-30 overflow-y-auto p-lg flex flex-col gap-md rounded-xl"
      style={{
        left: panelLeft,
        width: panelWidth,
        boxShadow: shadow,
      }}
    >
      {content}
    </div>
  );
}

function PanelContent({
  item,
  resources,
  savedResourceIds,
  onToggleSaveResource,
  onClose,
  onToggleStage,
  onToggleStatus,
  onUpdateNotes,
  onUpdateTime,
  onStartFocus,
}: TaskDetailsPanelProps) {
  const subject = getSubject(item.subjectId);
  const color = getSubjectColor(item.subjectId);
  const typeMeta = ITEM_TYPE_META[item.type];
  const now = new Date();
  const dueStatus = getDueStatus(item, now);
  const dueLabel = formatDueLabel(item, now);
  // `resources` is already the real, subject-matched list for this item
  // (computed by the parent from its subjectId) — no further filtering needed.
  const shownResources = resources.slice(0, 3);

  function handleTimeChange(field: "start" | "end", value: string) {
    if (!value) return;
    const [h, m] = value.split(":").map(Number);
    const base = field === "start" ? item.start : item.end;
    const next = new Date(base);
    next.setHours(h, m, 0, 0);
    if (field === "start") onUpdateTime(item.id, next, item.end);
    else onUpdateTime(item.id, item.start, next);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-sm pb-sm border-b border-outline-variant/50">
        <div className="flex items-center gap-sm min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color.base }}
            aria-hidden="true"
          />
          <span className="text-label-sm font-bold uppercase tracking-wide truncate" style={{ color: color.base }}>
            {subject ? subject.name : "General"} · {typeMeta.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details panel"
          className="p-sm rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-sm">
        <h2 className="text-headline-md font-serif font-bold text-on-surface">{item.title}</h2>
        <div className="flex flex-wrap items-center gap-sm">
          <span
            className={`inline-flex items-center gap-1 px-sm py-1 rounded-md text-label-sm font-bold ${
              dueStatus === "overdue"
                ? "bg-error-container text-on-error-container"
                : dueStatus === "done"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {dueStatus === "done" ? (
              <Check size={13} />
            ) : dueStatus === "overdue" ? (
              <AlertCircle size={13} />
            ) : (
              <Clock size={13} />
            )}
            {dueLabel}
          </span>
          {item.weightLabel && (
            <span className="text-label-sm text-on-surface-variant font-medium">
              {item.weightLabel}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggleStatus(item.id)}
        className="self-start flex items-center gap-sm text-label-md font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
      >
        <span
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
            item.status === "done" ? "bg-primary border-primary text-on-primary" : "border-outline-variant"
          }`}
        >
          {item.status === "done" && <Check size={13} />}
        </span>
        {item.status === "done" ? "Marked as done" : "Mark as done"}
      </button>

      {item.stages.length > 0 && (
        <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/50">
          <div className="flex items-center justify-between">
            <span className="text-label-sm uppercase tracking-wide text-outline font-bold">
              Assessment Milestone
            </span>
            <span className="text-label-sm font-semibold text-primary">
              Stage {item.stages.filter((s) => s.done).length} of {item.stages.length}
            </span>
          </div>
          <div className="grid gap-xs" style={{ gridTemplateColumns: `repeat(${item.stages.length}, minmax(0,1fr))` }}>
            {item.stages.map((stage, i) => (
              <button
                key={stage.label}
                type="button"
                onClick={() => onToggleStage(item.id, i)}
                className="flex flex-col items-center gap-1 text-center cursor-pointer group"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold transition-colors ${
                    stage.done
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-outline group-hover:bg-surface-container-high"
                  }`}
                >
                  {stage.done ? <Check size={14} /> : i + 1}
                </span>
                <span className={`text-[11px] font-medium ${stage.done ? "text-primary" : "text-outline"}`}>
                  {stage.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!item.allDay && (
        <div className="grid grid-cols-2 gap-sm pt-sm border-t border-outline-variant/50">
          <label className="flex flex-col gap-1 text-label-sm text-on-surface-variant font-medium">
            Start time
            <input
              type="time"
              value={toTimeInputValue(item.start)}
              onChange={(e) => handleTimeChange("start", e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-1 text-body-md text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1 text-label-sm text-on-surface-variant font-medium">
            End time
            <input
              type="time"
              value={toTimeInputValue(item.end)}
              onChange={(e) => handleTimeChange("end", e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-1 text-body-md text-on-surface"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={() => onStartFocus(item.id)}
        className="w-full bg-primary text-on-primary py-sm rounded-lg text-label-md font-semibold flex items-center justify-center gap-sm hover:opacity-90 transition-opacity cursor-pointer"
      >
        <PlayCircle size={20} />
        Start focus session
      </button>

      {shownResources.length > 0 && (
        <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/50">
          <div className="flex items-center justify-between">
            <span className="text-label-sm uppercase tracking-wide text-outline font-bold">
              Recommended Resources
            </span>
            <Link href="/resources" className="text-label-sm text-secondary hover:text-primary transition-colors">
              Resources →
            </Link>
          </div>
          <div className="flex flex-col gap-sm">
            {shownResources.map((resource) => {
              const saved = savedResourceIds.has(resource.id);
              return (
                <div
                  key={resource.id}
                  className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/50 flex items-start justify-between gap-sm"
                >
                  <Link href={`/resources/${resource.id}`} className="flex flex-col min-w-0 gap-1 group">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-secondary">
                      {resource.type_tag}
                    </span>
                    <span className="text-label-md font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors">
                      {resource.title}
                    </span>
                    {resource.description && (
                      <span className="text-[11px] text-on-surface-variant line-clamp-1">
                        {resource.description}
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => onToggleSaveResource(resource.id)}
                    aria-label={saved ? "Remove from saved resources" : "Save resource"}
                    aria-pressed={saved}
                    className="p-1 text-outline hover:text-primary transition-colors cursor-pointer shrink-0"
                  >
                    {saved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 pt-sm border-t border-outline-variant/50">
        <label htmlFor={`notes-${item.id}`} className="text-label-sm uppercase tracking-wide text-outline font-bold">
          Notes
        </label>
        <textarea
          id={`notes-${item.id}`}
          rows={3}
          value={item.notes}
          onChange={(e) => onUpdateNotes(item.id, e.target.value)}
          placeholder="Add notes for this item…"
          className="w-full bg-surface-container-low text-on-surface text-body-md p-sm rounded-lg border border-outline-variant/50 resize-none placeholder:text-outline"
        />
      </div>
    </>
  );
}

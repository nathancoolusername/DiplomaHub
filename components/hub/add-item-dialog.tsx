"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { HubItem, HubItemDetails, HubItemKind, HubItemType, Subject, SubjectId } from "./mock-data";
import { Switch } from "@/components/shared/Switch";

// No "Study session" here: the Study session type already says it, and saves kind "study".
const KINDS: { value: HubItemKind; label: string }[] = [
  { value: "deadline", label: "Deadline" },
  { value: "test", label: "Test" },
  { value: "mock", label: "Mock" },
];
import { ITEM_TYPE_META } from "./item-type-meta";
import { toDateInputValue } from "./calendar/calendar-utils";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

const TYPE_OPTIONS: HubItemType[] = ["ib_component", "task", "study_block", "university"];

function isEditingItem(item: HubItem | null | undefined): boolean {
  return !!item;
}

export default function AddItemDialog({
  defaultDate,
  subjects,
  item,
  onClose,
  onAdd,
  onSave,
  prefill,
}: {
  defaultDate: Date;
  /** Starting values for a new item, e.g. a study session for a deadline ("Plan time"). */
  prefill?: { type: HubItemType; title: string; subjectId: SubjectId | null };
  subjects: Subject[];
  // When set, the dialog edits this item instead of creating a new one.
  item?: HubItem | null;
  onClose: () => void;
  onAdd?: (item: HubItem) => void;
  onSave?: (id: string, details: HubItemDetails) => void;
}) {
  const isEditing = !!item;
  const dialogRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<HubItemType>(item?.type ?? prefill?.type ?? "task");
  const [title, setTitle] = useState(item?.title ?? prefill?.title ?? "");
  const [subjectId, setSubjectId] = useState<SubjectId | "">(item?.subjectId ?? prefill?.subjectId ?? "");
  const [date, setDate] = useState(toDateInputValue(item?.start ?? defaultDate));
  const [startTime, setStartTime] = useState(
    item && !item.allDay
      ? `${String(item.start.getHours()).padStart(2, "0")}:${String(item.start.getMinutes()).padStart(2, "0")}`
      : "09:00",
  );
  const [endTime, setEndTime] = useState(
    item && !item.allDay
      ? `${String(item.end.getHours()).padStart(2, "0")}:${String(item.end.getMinutes()).padStart(2, "0")}`
      : "10:00",
  );
  const [error, setError] = useState<string | null>(null);
  // What it is (so suggestions know a test from a deadline) and whether Home counts down to it.
  const [kind, setKind] = useState<HubItemKind>(item?.kind && item.kind !== "study" ? item.kind : "deadline");
  const [hasTimer, setHasTimer] = useState(item?.hasTimer ?? false);
  const [timerTouched, setTimerTouched] = useState(isEditingItem(item));
  // All-day items (currently only ever created via .ics import — there's no
  // in-app way to create one) can have a multi-day span; editing that span
  // through a single date+time-of-day form would be lossy, so this dialog
  // only lets an all-day item's title/type/subject change, keeping its
  // original start/end exactly as imported.
  const isAllDay = item?.allDay ?? false;

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    getFocusable(dialogRef.current)[0]?.focus();
    return () => prevActive?.focus?.();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable(dialogRef.current);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const savedKind: HubItemKind = type === "study_block" ? "study" : kind;
    if (!title.trim()) {
      setError("Give this item a title.");
      return;
    }

    let start: Date;
    let end: Date;
    if (isAllDay && item) {
      start = item.start;
      end = item.end;
    } else {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      start = new Date(`${date}T00:00:00`);
      start.setHours(sh, sm, 0, 0);
      end = new Date(`${date}T00:00:00`);
      end.setHours(eh, em, 0, 0);
      if (end.getTime() <= start.getTime()) {
        setError("End time must be after the start time.");
        return;
      }
    }

    if (isEditing && item) {
      onSave?.(item.id, { title: title.trim(), type, subjectId: subjectId || null, start, end, hasTimer, kind: savedKind });
    } else {
      onAdd?.({
        id: `itm-${crypto.randomUUID().slice(0, 8)}`,
        title: title.trim(),
        type,
        subjectId: subjectId || null,
        start,
        end,
        allDay: false,
        status: "todo",
        stages: [],
        notes: "",
        resourceIds: [],
        hasTimer,
        kind: savedKind,
      });
    }
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-scrim/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        className="relative bg-surface-raised glass rounded-xl border border-outline-variant shadow-xl w-full max-w-120 max-h-[90vh] overflow-y-auto p-lg flex flex-col gap-md"
      >
        <div className="flex items-center justify-between">
          <h2 id="add-item-title" className="text-headline-sm font-serif font-bold text-on-surface">
            {isEditing ? "Edit item" : "Add item"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-sm rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <fieldset className="flex flex-col gap-1">
            <legend className="text-label-sm font-semibold text-on-surface-variant mb-1">Type</legend>
            <div className="grid grid-cols-2 gap-sm">
              {TYPE_OPTIONS.map((t) => {
                const meta = ITEM_TYPE_META[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className={`flex items-center gap-sm px-sm py-2 rounded-lg border text-label-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <meta.Icon size={16} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1 text-label-sm font-semibold text-on-surface-variant">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draft cover letter"
              className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-2 text-body-md text-on-surface"
            />
          </label>

          <label className="flex flex-col gap-1 text-label-sm font-semibold text-on-surface-variant">
            Subject
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value as SubjectId | "")}
              className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-2 text-body-md text-on-surface"
            >
              <option value="">None / General</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {isAllDay ? (
            <p className="text-label-sm text-on-surface-variant bg-surface-container-low rounded-md px-sm py-2">
              This is an all-day item — its date is kept as imported.
            </p>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-label-sm font-semibold text-on-surface-variant">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-2 text-body-md text-on-surface"
                />
              </label>

              <div className="grid grid-cols-2 gap-sm">
                <label className="flex flex-col gap-1 text-label-sm font-semibold text-on-surface-variant">
                  Start time
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-2 text-body-md text-on-surface"
                  />
                </label>
                <label className="flex flex-col gap-1 text-label-sm font-semibold text-on-surface-variant">
                  End time
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-2 text-body-md text-on-surface"
                  />
                </label>
              </div>
            </>
          )}

          <div className="flex flex-col gap-sm">
            {type !== "study_block" && (
              <>
                <span className="text-label-sm font-semibold text-on-surface-variant">What is it?</span>
                <div role="radiogroup" aria-label="What is it?" className="flex flex-wrap gap-xs">
                  {KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      role="radio"
                      aria-checked={kind === k.value}
                      onClick={() => {
                        setKind(k.value);
                        // Tests and mocks usually deserve a countdown, unless the student already chose.
                        if (!timerTouched) setHasTimer(k.value === "test" || k.value === "mock");
                      }}
                      className={`rounded-full border px-md py-1 text-label-md font-semibold cursor-pointer transition-colors ${
                        kind === k.value ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <Switch
              checked={hasTimer}
              onChange={(on) => {
                setHasTimer(on);
                setTimerTouched(true);
              }}
              label="Show a countdown on Home"
            />
          </div>

          {error && <p className="text-label-sm text-error">{error}</p>}

          <div className="flex justify-end gap-sm pt-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-2 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

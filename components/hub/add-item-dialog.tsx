"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { HubItem, HubItemType, Subject, SubjectId } from "./mock-data";
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

export default function AddItemDialog({
  defaultDate,
  subjects,
  item,
  onClose,
  onAdd,
  onSave,
}: {
  defaultDate: Date;
  subjects: Subject[];
  // When set, the dialog edits this item instead of creating a new one.
  item?: HubItem | null;
  onClose: () => void;
  onAdd?: (item: HubItem) => void;
  onSave?: (
    id: string,
    details: { title: string; type: HubItemType; subjectId: SubjectId | null; start: Date; end: Date },
  ) => void;
}) {
  const isEditing = !!item;
  const dialogRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<HubItemType>(item?.type ?? "task");
  const [title, setTitle] = useState(item?.title ?? "");
  const [subjectId, setSubjectId] = useState<SubjectId | "">(item?.subjectId ?? "");
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
      onSave?.(item.id, { title: title.trim(), type, subjectId: subjectId || null, start, end });
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
      });
    }
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-on-surface/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        className="relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-120 max-h-[90vh] overflow-y-auto p-lg flex flex-col gap-md"
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

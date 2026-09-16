"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, Loader2, Undo2, Upload, X } from "lucide-react";
import {
  parseIcsImportPreview,
  confirmIcsImport,
  getRecentImportBatches,
  undoImportBatch,
  type ImportPreview,
  type ImportPreviewEvent,
  type RecentImportBatch,
} from "@/app/lib/actions/ics-import";
import type { HubItemType, Subject, SubjectId } from "./mock-data";
import { ITEM_TYPE_META } from "./item-type-meta";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

const TYPE_OPTIONS: HubItemType[] = ["ib_component", "task", "study_block", "university"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

type RowOverride = { subjectId: SubjectId | ""; type: HubItemType };

function formatEventTime(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) return "All day";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatGroupDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function ImportDialog({
  isGuest,
  subjects,
  onClose,
  onImported,
}: {
  isGuest: boolean;
  subjects: Subject[];
  onClose: () => void;
  onImported: (info: { count: number; batchId: string }) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [includeRecurring, setIncludeRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, RowOverride>>({});
  const [importing, setImporting] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("");

  const [recentBatches, setRecentBatches] = useState<RecentImportBatch[]>([]);
  const [undoingBatchId, setUndoingBatchId] = useState<string | null>(null);

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

  useEffect(() => {
    if (isGuest) return;
    getRecentImportBatches().then((result) => {
      if (result.success) setRecentBatches(result.data);
    });
  }, [isGuest]);

  async function runParse(text: string, recurring: boolean) {
    setLoading(true);
    setError(null);
    const result = await parseIcsImportPreview(text, recurring);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      setPreview(null);
      return;
    }
    setPreview(result.data);
    setSelected(new Set(result.data.events.filter((e) => !e.isRecurring).map((e) => e.externalUid)));
    const nextOverrides: Record<string, RowOverride> = {};
    for (const e of result.data.events) {
      nextOverrides[e.externalUid] = { subjectId: e.suggestedSubjectId ?? "", type: e.suggestedType };
    }
    setOverrides(nextOverrides);
    setBulkSubject("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!file.name.toLowerCase().endsWith(".ics")) {
      setError("Please choose a .ics calendar file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is too large — the limit is 2 MB.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setFileText(text);
      runParse(text, includeRecurring);
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  }

  function handleToggleRecurring(checked: boolean) {
    setIncludeRecurring(checked);
    if (fileText) runParse(fileText, checked);
  }

  function handleChooseDifferentFile() {
    setFileText(null);
    setFileName(null);
    setPreview(null);
    setError(null);
    setIncludeRecurring(false);
  }

  function toggleSelected(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function selectAll() {
    if (!preview) return;
    setSelected(new Set(preview.events.map((e) => e.externalUid)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function setRowSubject(uid: string, subjectId: string) {
    setOverrides((prev) => ({ ...prev, [uid]: { ...prev[uid], subjectId: subjectId as SubjectId | "" } }));
  }

  function setRowType(uid: string, type: HubItemType) {
    setOverrides((prev) => ({ ...prev, [uid]: { ...prev[uid], type } }));
  }

  function applyBulkSubject(subjectId: string) {
    setBulkSubject(subjectId);
    if (!subjectId || selected.size === 0) return;
    setOverrides((prev) => {
      const next = { ...prev };
      for (const uid of selected) {
        next[uid] = { ...next[uid], subjectId: subjectId as SubjectId };
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!preview) return;
    setImporting(true);
    setError(null);
    const eventsToSave = preview.events
      .filter((e) => selected.has(e.externalUid))
      .map((e) => {
        const o = overrides[e.externalUid];
        return {
          externalUid: e.externalUid,
          title: e.title,
          type: o?.type ?? e.suggestedType,
          subjectId: o?.subjectId || null,
          start: e.start,
          end: e.end,
          allDay: e.allDay,
        };
      });
    const result = await confirmIcsImport(eventsToSave);
    setImporting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onImported({ count: result.data.imported, batchId: result.data.batchId });
  }

  async function handleUndoRecent(batchId: string) {
    setUndoingBatchId(batchId);
    const result = await undoImportBatch(batchId);
    setUndoingBatchId(null);
    if (result.success) {
      setRecentBatches((prev) => prev.filter((b) => b.batchId !== batchId));
    }
  }

  const groupedByDate = useMemo(() => {
    if (!preview) return [] as [string, ImportPreviewEvent[]][];
    const groups = new Map<string, ImportPreviewEvent[]>();
    for (const e of preview.events) {
      const key = formatGroupDate(e.start);
      const list = groups.get(key) ?? [];
      list.push(e);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [preview]);

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-on-surface/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-160 max-h-[90vh] overflow-y-auto p-lg flex flex-col gap-md"
      >
        <div className="flex items-center justify-between">
          <h2 id="import-title" className="text-headline-sm font-serif font-bold text-on-surface">
            Import calendar file
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isGuest ? (
          <div className="flex flex-col gap-sm py-sm">
            <p className="text-body-md text-on-surface-variant">
              Importing saves to your account, so you&apos;ll need to sign in first.
            </p>
            <Link
              href="/login?next=/hub"
              className="self-start px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-label-md text-error bg-error-container/30 rounded-lg px-sm py-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                {error}
              </p>
            )}

            {!preview && (
              <div className="flex flex-col gap-md">
                <p className="text-body-md text-on-surface-variant">
                  Bring in deadlines and classes from a school timetable or another calendar app — pick a
                  .ics file (up to 2 MB) to preview before anything is saved.
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-sm p-xl rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? <Loader2 size={24} className="animate-spin text-primary" /> : <Upload size={24} className="text-on-surface-variant" />}
                  <span className="text-label-md font-semibold text-on-surface">
                    {loading ? "Reading your file…" : fileName ? fileName : "Choose a .ics file"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,text/calendar"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </button>

                {recentBatches.length > 0 && (
                  <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/50">
                    <span className="text-label-sm uppercase tracking-wide text-outline font-bold">
                      Recent imports
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {recentBatches.map((batch) => (
                        <div
                          key={batch.batchId}
                          className="flex items-center justify-between gap-sm p-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                        >
                          <span className="text-body-sm text-on-surface-variant">
                            {batch.count} item{batch.count === 1 ? "" : "s"} ·{" "}
                            {new Date(batch.importedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUndoRecent(batch.batchId)}
                            disabled={undoingBatchId === batch.batchId}
                            className="shrink-0 flex items-center gap-1 text-label-sm font-semibold text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {undoingBatchId === batch.batchId ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Undo2 size={13} />
                            )}
                            Undo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {preview && (
              <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between gap-sm flex-wrap">
                  <p className="text-body-md text-on-surface">
                    <span className="font-semibold">{preview.newCount} new</span>
                    {preview.updateCount > 0 && `, ${preview.updateCount} will update existing items`}
                    {preview.recurringGroupCount > 0 &&
                      `, ${preview.recurringGroupCount} hidden recurring event${preview.recurringGroupCount === 1 ? "" : "s"}`}
                  </p>
                  <button
                    type="button"
                    onClick={handleChooseDifferentFile}
                    className="text-label-sm text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    Choose a different file
                  </button>
                </div>

                {preview.truncated && (
                  <p className="text-label-sm text-on-surface-variant bg-surface-container-low rounded-lg px-sm py-1.5">
                    This file has more than 500 matching events — only the first 500 are shown.
                  </p>
                )}

                {preview.recurringGroupCount > 0 && (
                  <label className="flex items-center gap-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRecurring}
                      onChange={(e) => handleToggleRecurring(e.target.checked)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span className="text-body-sm text-on-surface-variant">
                      Include recurring events (probably your timetable — shown unchecked by default)
                    </span>
                  </label>
                )}

                <div className="flex items-center gap-sm flex-wrap pt-sm border-t border-outline-variant/50">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-label-sm font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-label-sm font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    Deselect all
                  </button>
                  <span className="text-outline-variant">·</span>
                  <span className="text-label-sm text-on-surface-variant">Set subject for selected:</span>
                  <select
                    value={bulkSubject}
                    onChange={(e) => applyBulkSubject(e.target.value)}
                    className="bg-surface-container-low border border-outline-variant rounded-md px-sm py-1 text-label-sm text-on-surface"
                  >
                    <option value="">Choose…</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-sm py-lg text-on-surface-variant">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-body-md">Updating preview…</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-md max-h-96 overflow-y-auto pr-1">
                    {groupedByDate.map(([dateLabel, dayEvents]) => (
                      <div key={dateLabel} className="flex flex-col gap-1.5">
                        <span className="text-label-sm uppercase tracking-wide text-outline font-bold">
                          {dateLabel}
                        </span>
                        {dayEvents.map((event) => {
                          const override = overrides[event.externalUid];
                          const isChecked = selected.has(event.externalUid);
                          return (
                            <div
                              key={event.externalUid}
                              className="flex items-center gap-sm p-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelected(event.externalUid)}
                                className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                <span className="text-label-md font-semibold text-on-surface truncate">
                                  {event.title}
                                </span>
                                <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                                  {formatEventTime(event.start, event.allDay)}
                                  {event.isRecurring && (
                                    <span className="px-1 py-0.5 rounded bg-surface-container text-outline">
                                      Recurring
                                    </span>
                                  )}
                                  {event.existsAlready && (
                                    <span className="px-1 py-0.5 rounded bg-secondary-container text-on-secondary-container">
                                      Will update
                                    </span>
                                  )}
                                </span>
                              </div>
                              <select
                                value={override?.subjectId ?? ""}
                                onChange={(e) => setRowSubject(event.externalUid, e.target.value)}
                                className="shrink-0 bg-surface-container-lowest border border-outline-variant rounded-md px-1.5 py-1 text-[11px] text-on-surface max-w-28"
                              >
                                <option value="">No subject</option>
                                {subjects.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.shortName}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={override?.type ?? event.suggestedType}
                                onChange={(e) => setRowType(event.externalUid, e.target.value as HubItemType)}
                                className="shrink-0 bg-surface-container-lowest border border-outline-variant rounded-md px-1.5 py-1 text-[11px] text-on-surface max-w-28"
                              >
                                {TYPE_OPTIONS.map((t) => (
                                  <option key={t} value={t}>
                                    {ITEM_TYPE_META[t].label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {preview.events.length === 0 && (
                      <p className="text-body-md text-on-surface-variant py-sm">
                        No events found in the selected date range.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-md py-2 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selected.size === 0 || importing}
                    className="flex items-center gap-1.5 px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
                  >
                    {importing && <Loader2 size={16} className="animate-spin" />}
                    Import {selected.size} event{selected.size === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

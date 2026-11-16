"use client";

import { useMemo, useState, useTransition } from "react";
import { createHubSetCodeAction } from "@/app/codes/actions";
import { createHubSet } from "@/app/lib/actions/hub-sets";
import { HUB_SET_MAX_ITEMS } from "@/lib/codes";
import { Dialog } from "@/components/shared/Dialog";
import { ShareCodeDialog } from "@/components/codes/ShareCodeDialog";
import { Spinner } from "@/components/spinner";
import type { CustomSubject, HubItem } from "./mock-data";
import { getSubject } from "./mock-data";
import { getSubjectColor } from "./subject-colors";

const DAY = 86_400_000;

/** YYYY-MM-DD in the student's own timezone. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromYmd(s: string, endOfDay = false): Date {
  const [y, m, d] = s.split("-").map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
}
function itemDate(i: HubItem): string {
  return i.start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/**
 * "Share a set" on the Hub: choose a date range (and subject), untick what
 * you don't want, name it, and get one code for a copy of those items.
 * mode "create" ("New set" in Sets): the same picker, but it saves a Hub set
 * the student keeps (migration 46) instead of making a code.
 */
export function ShareSetDialog({
  items,
  customSubjects,
  onClose,
  mode = "share",
  onCreated,
}: {
  items: HubItem[];
  customSubjects: CustomSubject[];
  onClose: () => void;
  mode?: "share" | "create";
  onCreated?: (set: { id: string; name: string; itemIds: string[] }) => void;
}) {
  // Default range: today to eight weeks out (a typical revision block).
  const [from, setFrom] = useState(() => ymd(new Date()));
  const [to, setTo] = useState(() => ymd(new Date(Date.now() + 56 * DAY)));
  const [subject, setSubject] = useState<string | "all">("all");
  const [name, setName] = useState("");
  // Unticked items (so new items entering the range start ticked).
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState<{ code: string; name: string; useCount: number } | null>(null);
  const [busy, start] = useTransition();

  const inRange = useMemo(() => {
    if (!from || !to) return [];
    const lo = fromYmd(from).getTime();
    const hi = fromYmd(to, true).getTime();
    return items.filter((i) => i.start.getTime() <= hi && i.end.getTime() >= lo).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [items, from, to]);

  const subjectsInRange = useMemo(() => {
    const ids = [...new Set(inRange.map((i) => i.subjectId ?? "none"))];
    return ids.map((id) => ({ id, name: id === "none" ? "General" : (getSubject(id, customSubjects)?.shortName ?? "General") }));
  }, [inRange, customSubjects]);

  const shown = subject === "all" ? inRange : inRange.filter((i) => (i.subjectId ?? "none") === subject);
  const picked = shown.filter((i) => !unticked.has(i.id));
  const tooMany = picked.length > HUB_SET_MAX_ITEMS;

  const toggle = (id: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setAll = (on: boolean) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      for (const i of shown) {
        if (on) next.delete(i.id);
        else next.add(i.id);
      }
      return next;
    });

  const create = () => {
    setError(null);
    start(async () => {
      if (mode === "create") {
        const ids = picked.map((i) => i.id);
        const made = await createHubSet(name, ids);
        if (!made.success) return setError(made.error);
        onCreated?.({ ...made.data, itemIds: ids });
        return;
      }
      const r = await createHubSetCodeAction(name, picked.map((i) => i.id));
      if (!r.ok) return setError(r.error);
      setShared({ code: r.code, name: r.name, useCount: r.useCount });
    });
  };

  if (shared) {
    return <ShareCodeDialog type="hub_set" code={shared.code} title={shared.name} useCount={shared.useCount} onClose={onClose} />;
  }

  const field = "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface";

  return (
    <Dialog
      title={mode === "create" ? "New set" : "Share a set"}
      onClose={onClose}
      width="max-w-140"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={busy || picked.length === 0 || tooMany || !name.trim()}
            className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {busy && <Spinner size={14} />}
            {mode === "create"
              ? busy
                ? "Making the set…"
                : `Make a set of ${picked.length} item${picked.length === 1 ? "" : "s"}`
              : busy
                ? "Making the code…"
                : `Share ${picked.length} item${picked.length === 1 ? "" : "s"}`}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {mode === "create" ? (
          <p className="text-body-md text-on-surface-variant">
            Group items that belong together, like your mock timetable or a revision plan. You can share the set as a code any time.
          </p>
        ) : (
          <p className="text-body-md text-on-surface-variant">
            Friends get a copy of these items on their own Hub, with your dates or moved to start on a day they choose. Changes you make later don&apos;t reach
            them: share again for a new version.
          </p>
        )}

        <label className="flex flex-col gap-xs">
          <span className="text-label-md font-semibold text-on-surface-variant">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Paper 1 revision plan" className={field} autoFocus />
        </label>

        <div className="flex flex-wrap items-end gap-md">
          <label className="flex flex-col gap-xs">
            <span className="text-label-md font-semibold text-on-surface-variant">From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={field} />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="text-label-md font-semibold text-on-surface-variant">To</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={field} />
          </label>
        </div>

        {subjectsInRange.length > 1 && (
          <div className="flex flex-wrap gap-xs" role="group" aria-label="Subject">
            {[{ id: "all", name: "All subjects" }, ...subjectsInRange].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubject(s.id)}
                aria-pressed={subject === s.id}
                className={`rounded-full px-md py-1 text-label-md font-semibold border cursor-pointer ${
                  subject === s.id ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant hover:text-primary"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-sm">
          <p className="text-label-md text-on-surface-variant tabular-nums">
            {picked.length} of {shown.length} selected
          </p>
          {shown.length > 0 && (
            <div className="flex gap-sm">
              <button type="button" onClick={() => setAll(true)} className="text-label-md font-semibold text-primary hover:underline cursor-pointer">
                All
              </button>
              <button type="button" onClick={() => setAll(false)} className="text-label-md font-semibold text-primary hover:underline cursor-pointer">
                None
              </button>
            </div>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
            Nothing on your Hub between these dates.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant rounded-xl border border-outline-variant max-h-72 overflow-y-auto">
            {shown.map((i) => {
              const color = getSubjectColor(i.subjectId);
              return (
                <li key={i.id}>
                  <label className="flex items-center gap-sm px-md py-sm cursor-pointer hover:bg-surface-container">
                    <input type="checkbox" checked={!unticked.has(i.id)} onChange={() => toggle(i.id)} className="accent-[var(--color-primary)]" />
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color.base }} aria-hidden="true" />
                    <span className="flex-1 min-w-0 truncate text-body-md text-on-surface">{i.title}</span>
                    <span className="shrink-0 text-label-sm text-on-surface-variant tabular-nums">{itemDate(i)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {tooMany && (
          <p role="alert" className="text-label-md text-error">
            A set can have at most {HUB_SET_MAX_ITEMS} items. Narrow the dates or untick some.
          </p>
        )}
        {error && (
          <p role="alert" className="text-label-md text-error">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

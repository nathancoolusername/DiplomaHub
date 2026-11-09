"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarPlus, Check, Pencil, RotateCcw, X, XCircle } from "lucide-react";
import {
  reviewFortyFive,
  saveFortyFiveGroups,
  scheduleFortyFive,
  unscheduleFortyFive,
  type AdminFortyFivePuzzle,
  type FortyFiveStatus,
} from "@/app/lib/actions/admin-forty-five";
import { GROUP_SUBJECTS, type SourceGroup } from "@/lib/forty-five/format";
import { TIERS, type Tier } from "@/lib/forty-five/tiers";

const BTN = "inline-flex items-center gap-xs rounded-lg px-md py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer";
const INPUT = "border border-outline-variant rounded-lg px-sm py-xs w-full bg-surface-container-lowest text-body-md";

type Filter = "draft" | "approved" | "scheduled" | "rejected" | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "draft", label: "Drafts" },
  { id: "approved", label: "Approved, unscheduled" },
  { id: "scheduled", label: "Scheduled" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** "Schedule approved": fills the next free days with approved, unscheduled daily puzzles. */
export function ScheduleButton({ ready, demo = false }: { ready: number; demo?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-xs">
      <button
        type="button"
        disabled={pending || ready === 0 || demo}
        onClick={() =>
          start(async () => {
            const r = await scheduleFortyFive();
            if (!r.success) setMsg(r.error);
            else {
              setMsg(r.data.scheduled ? `Scheduled ${r.data.scheduled}: ${formatDay(r.data.from!)} to ${formatDay(r.data.to!)}` : "Nothing to schedule");
              router.refresh();
            }
          })
        }
        className={`${BTN} bg-primary text-on-primary`}
      >
        <CalendarPlus size={16} aria-hidden="true" />
        {pending ? "Scheduling…" : `Schedule ${ready} approved`}
      </button>
      {msg && <p className="text-label-sm text-on-surface-variant">{msg}</p>}
    </div>
  );
}

export function FortyFiveReview({ puzzles, demo = false }: { puzzles: AdminFortyFivePuzzle[]; demo?: boolean }) {
  const [filter, setFilter] = useState<Filter>("draft");
  const [warningsOnly, setWarningsOnly] = useState(false);
  const shown = useMemo(
    () =>
      puzzles
        .filter((p) =>
          filter === "all" ? true : filter === "scheduled" ? !!p.scheduledFor : filter === "approved" ? p.status === "approved" && !p.scheduledFor : p.status === filter,
        )
        .filter((p) => !warningsOnly || p.check.warnings.length + p.check.errors.length > 0)
        .sort((a, b) => (filter === "scheduled" ? (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? "") : a.slug.localeCompare(b.slug))),
    [puzzles, filter, warningsOnly],
  );
  const countFor = (f: Filter) =>
    f === "all" ? puzzles.length : f === "scheduled" ? puzzles.filter((p) => p.scheduledFor).length : f === "approved" ? puzzles.filter((p) => p.status === "approved" && !p.scheduledFor).length : puzzles.filter((p) => p.status === f).length;

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <nav aria-label="Filter puzzles" className="inline-flex flex-wrap gap-0.5 rounded-xl bg-surface-container p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-lg px-md py-xs text-label-md font-semibold cursor-pointer ${
                filter === f.id ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {f.label} <span className="tabular-nums opacity-70">{countFor(f.id)}</span>
            </button>
          ))}
        </nav>
        <label className="inline-flex items-center gap-xs text-label-md text-on-surface-variant cursor-pointer">
          <input type="checkbox" checked={warningsOnly} onChange={(e) => setWarningsOnly(e.target.checked)} />
          Only puzzles with warnings
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">Nothing here.</p>
      ) : (
        <ul className="grid gap-md xl:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id}>
              <PuzzleCard puzzle={p} demo={demo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<FortyFiveStatus, string> = {
  draft: "bg-surface-container text-on-surface-variant",
  approved: "bg-secondary-container text-on-secondary-container",
  rejected: "bg-error-container text-on-error-container",
};

function PuzzleCard({ puzzle: p, demo }: { puzzle: AdminFortyFivePuzzle; demo: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SourceGroup[]>(p.groups);
  const [note, setNote] = useState(p.reviewNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError(null);
      if (demo) return setError("Demo: nothing is saved.");
      const r = await fn();
      if (!r.success) setError(r.error ?? "Something went wrong");
      else {
        after?.();
        router.refresh();
      }
    });

  const setGroup = (i: number, patch: Partial<SourceGroup>) => setDraft((d) => d.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const setWord = (i: number, w: number, value: string) =>
    setDraft((d) => d.map((g, j) => (j === i ? { ...g, words: g.words.map((x, k) => (k === w ? value : x)) as SourceGroup["words"] } : g)));
  const locked = p.live;

  return (
    <article className="flex flex-col gap-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-md h-full">
      <header className="flex flex-wrap items-center gap-sm">
        <h3 className="font-semibold text-body-lg text-on-surface tabular-nums">{p.slug}</h3>
        <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
        {p.scheduledFor && (
          <span className="rounded-full px-sm py-0.5 text-label-sm font-semibold bg-primary-fixed text-on-primary-fixed tabular-nums">
            #{p.number} · {formatDay(p.scheduledFor)}
            {p.live ? " · live" : ""}
          </span>
        )}
        {p.mode === "subject" && <span className="text-label-sm text-on-surface-variant">{p.subject}</span>}
        <span className="ml-auto text-label-sm text-on-surface-variant">
          {p.check.errors.length > 0 && <span className="text-error font-semibold">{p.check.errors.length} errors · </span>}
          {p.check.warnings.length} warnings
        </span>
      </header>

      {editing ? (
        <div className="flex flex-col gap-sm">
          {draft.map((g, i) => (
            <fieldset key={i} className="flex flex-col gap-xs rounded-xl border border-outline-variant p-sm">
              <div className="flex flex-wrap gap-xs">
                <select aria-label="Difficulty" value={g.difficulty} onChange={(e) => setGroup(i, { difficulty: Number(e.target.value) as Tier })} className={`${INPUT} w-auto`}>
                  {([1, 2, 3, 4] as Tier[]).map((t) => (
                    <option key={t} value={t}>
                      {t} · {TIERS[t].name}
                    </option>
                  ))}
                </select>
                <select aria-label="Subject" value={g.subject} onChange={(e) => setGroup(i, { subject: e.target.value as SourceGroup["subject"] })} className={`${INPUT} w-auto`}>
                  {GROUP_SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input aria-label="Label" value={g.label} onChange={(e) => setGroup(i, { label: e.target.value })} className={`${INPUT} flex-1 min-w-40 font-semibold`} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
                {g.words.map((w, k) => (
                  <input key={k} aria-label={`Word ${k + 1}`} value={w} onChange={(e) => setWord(i, k, e.target.value)} className={INPUT} />
                ))}
              </div>
              <textarea aria-label="Explanation" value={g.explanation} onChange={(e) => setGroup(i, { explanation: e.target.value })} rows={2} className={INPUT} />
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {[...p.groups].sort((a, b) => a.difficulty - b.difficulty).map((g) => {
            const t = TIERS[g.difficulty as Tier];
            return (
              <div key={g.difficulty} className={`rounded-xl px-sm py-xs ${t.bg} ${t.text}`}>
                <p className="text-label-md font-bold">
                  {g.label} <span className="font-normal opacity-80">· {t.name} · {g.subject}</span>
                </p>
                <p className="text-body-md font-semibold">{g.words.join(" · ")}</p>
                <p className="text-label-sm opacity-90">{g.explanation}</p>
              </div>
            );
          })}
        </div>
      )}

      {p.traps.length > 0 && (
        <details className="text-label-md text-on-surface-variant">
          <summary className="cursor-pointer font-semibold">Traps ({p.traps.length})</summary>
          <ul className="mt-xs flex flex-col gap-0.5 list-disc pl-lg">
            {p.traps.map((t, i) => (
              <li key={i}>
                <strong className="text-on-surface">{t.word}</strong> → {t.decoy}: {t.why}
              </li>
            ))}
          </ul>
        </details>
      )}

      {(p.check.errors.length > 0 || p.check.warnings.length > 0) && (
        <ul className="flex flex-col gap-0.5 text-label-md">
          {p.check.errors.map((e, i) => (
            <li key={`e${i}`} className="flex gap-xs text-error">
              <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {e}
            </li>
          ))}
          {p.check.warnings.map((w, i) => (
            <li key={`w${i}`} className="flex gap-xs text-on-surface-variant">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />
              {w}
            </li>
          ))}
        </ul>
      )}

      {!locked && (
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note (optional, saved with approve/reject)" aria-label="Review note" className={INPUT} />
      )}
      {locked && p.reviewNote && <p className="text-label-md text-on-surface-variant">Note: {p.reviewNote}</p>}
      {p.live && <p className="text-label-sm text-on-surface-variant">Already played, so it&apos;s locked.</p>}
      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}

      {!locked && (
        <footer className="mt-auto flex flex-wrap gap-xs pt-xs">
          {editing ? (
            <>
              <button type="button" disabled={pending} onClick={() => run(() => saveFortyFiveGroups(p.id, draft), () => setEditing(false))} className={`${BTN} bg-primary text-on-primary`}>
                <Check size={16} aria-hidden="true" />
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setDraft(p.groups);
                  setEditing(false);
                  setError(null);
                }}
                className={`${BTN} border border-outline-variant text-on-surface`}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {p.status !== "approved" && (
                <button type="button" disabled={pending || p.check.errors.length > 0} onClick={() => run(() => reviewFortyFive(p.id, "approved", note))} className={`${BTN} bg-secondary text-on-secondary`}>
                  <Check size={16} aria-hidden="true" /> Approve
                </button>
              )}
              {p.status !== "rejected" && (
                <button type="button" disabled={pending} onClick={() => run(() => reviewFortyFive(p.id, "rejected", note))} className={`${BTN} border border-error text-error`}>
                  <X size={16} aria-hidden="true" /> Reject
                </button>
              )}
              {p.status !== "draft" && (
                <button type="button" disabled={pending} onClick={() => run(() => reviewFortyFive(p.id, "draft", note))} className={`${BTN} border border-outline-variant text-on-surface`}>
                  <RotateCcw size={16} aria-hidden="true" /> Back to draft
                </button>
              )}
              <button type="button" disabled={pending} onClick={() => setEditing(true)} className={`${BTN} border border-outline-variant text-on-surface`}>
                <Pencil size={16} aria-hidden="true" /> Edit
              </button>
              {p.scheduledFor && (
                <button type="button" disabled={pending} onClick={() => run(() => unscheduleFortyFive(p.id))} className={`${BTN} border border-outline-variant text-on-surface`}>
                  Unschedule
                </button>
              )}
            </>
          )}
        </footer>
      )}
    </article>
  );
}

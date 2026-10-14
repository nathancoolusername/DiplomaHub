"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/shared/Dialog";

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const LENGTHS = [15, 30, 45, 60, 90, 120];

const field = "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md text-on-surface";

/**
 * Schedule (Pro): pick when to do this set. The parent saves the set and
 * puts a study session on the Hub that opens it.
 */
export function ScheduleDialog({
  defaultTitle,
  suggestedMinutes,
  busy,
  error,
  onClose,
  onSchedule,
}: {
  defaultTitle: string;
  /** From the set's marks (about a minute a mark), rounded to a listed length. */
  suggestedMinutes: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSchedule: (slot: { title: string; startAt: string; endAt: string }) => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [title, setTitle] = useState(defaultTitle);
  const [date, setDate] = useState(toDateInput(tomorrow));
  const [time, setTime] = useState("17:00");
  const [minutes, setMinutes] = useState(suggestedMinutes);
  const [local, setLocal] = useState<string | null>(null);

  const submit = () => {
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return setLocal("Pick a date and time.");
    if (start.getTime() < Date.now() - 60_000) return setLocal("Pick a time that hasn't passed.");
    setLocal(null);
    const end = new Date(start.getTime() + minutes * 60_000);
    onSchedule({ title: title.trim() || defaultTitle, startAt: start.toISOString(), endAt: end.toISOString() });
  };

  return (
    <Dialog
      title="Schedule this set"
      onClose={() => !busy && onClose()}
      width="max-w-110"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Schedule
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        <p className="text-body-md text-on-surface-variant">
          It goes on your Hub as a study session with a Start button, and the set is saved to My sets.
        </p>
        <label className="flex flex-col gap-xs text-label-md font-semibold text-on-surface">
          Title
          <input type="text" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-sm">
          <label className="flex flex-col gap-xs text-label-md font-semibold text-on-surface">
            Date
            <input type="date" value={date} min={toDateInput(new Date())} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className="flex flex-col gap-xs text-label-md font-semibold text-on-surface">
            Start
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          </label>
        </div>
        <label className="flex flex-col gap-xs text-label-md font-semibold text-on-surface">
          Length
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={field}>
            {LENGTHS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} minutes` : m === 60 ? "1 hour" : `${m / 60} hours`}
                {m === suggestedMinutes ? " (about right for this set)" : ""}
              </option>
            ))}
          </select>
        </label>
        {(local || error) && <p className="text-label-md text-error">{local ?? error}</p>}
      </div>
    </Dialog>
  );
}

/** About a minute a mark (IB pace), rounded up to a listed length. */
export function suggestMinutes(marks: number | undefined): number {
  if (!marks) return 45;
  return LENGTHS.find((m) => m >= marks * 1.1) ?? LENGTHS[LENGTHS.length - 1];
}

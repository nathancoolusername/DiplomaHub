"use client";

import { useId, useState } from "react";
import { CalendarRange } from "lucide-react";
import type { HubSetChoice as Choice, HubSetPreview } from "@/lib/codes";
import { Spinner } from "@/components/spinner";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** YYYY-MM-DD for today in the student's own timezone. */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * A Hub set code before anything is added: what's in it, and whether to keep
 * the sharer's dates or move the whole plan so it starts on a chosen day.
 */
export function HubSetChoice({
  preview,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  preview: HubSetPreview;
  busy: boolean;
  error: string | null;
  onConfirm: (choice: Choice) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"keep" | "move">("keep");
  const [startOn, setStartOn] = useState(localToday);
  const name = useId();
  const firstDay = shortDate(preview.firstStart);
  const lastDay = shortDate(preview.lastEnd);

  const option = (value: "keep" | "move", title: string, body: React.ReactNode) => (
    <label
      className={`flex items-start gap-sm rounded-xl border px-md py-sm cursor-pointer ${
        mode === value ? "border-primary bg-primary-fixed/30" : "border-outline-variant hover:border-primary/60"
      }`}
    >
      <input type="radio" name={name} checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-[var(--color-primary)]" />
      <span className="flex flex-col gap-xs min-w-0">
        <span className="text-body-md font-semibold text-on-surface">{title}</span>
        <span className="text-label-md text-on-surface-variant">{body}</span>
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-md rounded-xl border border-outline-variant bg-surface px-md py-md" role="group" aria-label={`Add “${preview.name}” to your Hub`}>
      <div className="flex items-start gap-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <CalendarRange size={18} aria-hidden="true" />
        </span>
        <div className="flex flex-col min-w-0">
          <p className="text-body-md font-semibold text-on-surface">“{preview.name}”</p>
          <p className="text-label-md text-on-surface-variant tabular-nums">
            Hub set · {preview.count} item{preview.count === 1 ? "" : "s"} · {firstDay === lastDay ? firstDay : `${firstDay} – ${lastDay}`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        {option("keep", "Keep the dates", <>Everything lands on the same days as in the shared plan (useful for exams with fixed dates).</>)}
        {option(
          "move",
          "Start it on a day I choose",
          <span className="flex flex-col gap-xs">
            <span>The whole plan moves so its first item falls on this day; the gaps between items stay the same.</span>
            {mode === "move" && (
              <input
                type="date"
                value={startOn}
                onChange={(e) => setStartOn(e.target.value)}
                aria-label="Start date"
                className="self-start rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface"
              />
            )}
          </span>,
        )}
      </div>

      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-sm">
        <button type="button" onClick={onCancel} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || (mode === "move" && !startOn)}
          onClick={() =>
            onConfirm({
              startOn: mode === "move" ? startOn : null,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            })
          }
          className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {busy && <Spinner size={14} />}
          {busy ? "Adding…" : `Add ${preview.count} item${preview.count === 1 ? "" : "s"} to my Hub`}
        </button>
      </div>
    </div>
  );
}

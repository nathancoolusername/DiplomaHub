"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { saveBoundaries } from "@/app/lib/actions/results";
import { boundariesFor, type Bounds } from "@/lib/grade-boundaries";
import type { SubjectOption } from "./ResultForm";

const GRADES = [2, 3, 4, 5, 6, 7];
const th = "px-sm py-xs text-label-sm font-semibold text-on-surface-variant text-center";
const td = "px-sm py-xs text-body-md text-on-surface tabular-nums text-center";

/**
 * "Grade boundaries": closed until clicked. The lowest % for each grade in
 * every subject the student takes (IB May 2025 by default), and Change /
 * Reset so they can match their school's. Estimates everywhere use these.
 */
export function BoundariesPanel({
  subjects,
  overrides,
  onChange,
}: {
  subjects: SubjectOption[];
  overrides: Record<string, Bounds>;
  onChange: (subjectId: string, bounds: Bounds | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-md px-lg py-md text-left cursor-pointer"
      >
        <span>
          <span className="block font-serif font-bold text-headline-sm text-on-surface">Grade boundaries</span>
          <span className="block text-label-md text-on-surface-variant">
            The % you need for each grade in your subjects. Used to estimate grades from percentages and marks.
          </span>
        </span>
        <ChevronDown size={20} className={`shrink-0 text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-lg pb-lg flex flex-col gap-sm">
          <p className="text-label-md text-on-surface-variant">
            Default: the IB&apos;s overall boundaries from May 2025, averaged across time zones. They change every session, and many schools use
            their own for tests and mocks: if yours are different, change them.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={`${th} text-left`}>Subject</th>
                  {GRADES.map((g) => (
                    <th key={g} className={th}>
                      {g}
                    </th>
                  ))}
                  <th className={`${th} text-left`}>From</th>
                  <th className={th}>
                    <span className="sr-only">Change</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) =>
                  editing === s.id ? (
                    <EditRow
                      key={s.id}
                      subject={s}
                      start={boundariesFor(s.id, s.level, overrides[s.id]).bounds}
                      isCustom={!!overrides[s.id]}
                      onDone={(b) => {
                        if (b !== undefined) onChange(s.id, b);
                        setEditing(null);
                      }}
                    />
                  ) : (
                    <tr key={s.id} className="border-b border-outline-variant last:border-b-0">
                      <td className="px-sm py-xs text-body-md text-on-surface whitespace-nowrap">
                        {s.name}
                        {s.level && <span className="text-label-sm text-on-surface-variant"> {s.level}</span>}
                      </td>
                      {boundariesFor(s.id, s.level, overrides[s.id]).bounds.map((v, i) => (
                        <td key={i} className={td}>
                          {v}%
                        </td>
                      ))}
                      <td className="px-sm py-xs text-label-sm text-on-surface-variant whitespace-nowrap">{boundariesFor(s.id, s.level, overrides[s.id]).source}</td>
                      <td className="px-sm py-xs text-right">
                        <button type="button" onClick={() => setEditing(s.id)} className="text-label-md font-semibold text-primary hover:underline cursor-pointer">
                          Change
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="text-label-sm text-on-surface-variant">Each number is the lowest percentage for that grade. Below the grade 2 number is a 1.</p>
        </div>
      )}
    </section>
  );
}

function EditRow({
  subject,
  start,
  isCustom,
  onDone,
}: {
  subject: SubjectOption;
  start: Bounds;
  isCustom: boolean;
  /** The new bounds, null after Reset, undefined when cancelled. */
  onDone: (b: Bounds | null | undefined) => void;
}) {
  const [values, setValues] = useState<string[]>(start.map(String));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (bounds: string[] | null) => {
    setBusy(true);
    setError(null);
    const res = await saveBoundaries(subject.id, bounds);
    setBusy(false);
    if (!res.success) return setError(res.error);
    onDone(res.data);
  };

  return (
    <>
      <tr className="border-b-0 bg-surface-container-low">
        <td className="px-sm py-xs text-body-md text-on-surface whitespace-nowrap">{subject.name}</td>
        {values.map((v, i) => (
          <td key={i} className="px-xs py-xs">
            <input
              inputMode="numeric"
              value={v}
              onChange={(e) => setValues((all) => all.map((x, j) => (j === i ? e.target.value.replace(/[^\d]/g, "").slice(0, 3) : x)))}
              aria-label={`${subject.name}: lowest % for a ${GRADES[i]}`}
              className="w-14 rounded-lg border border-outline-variant bg-surface-container-lowest px-xs py-1 text-center text-body-md text-on-surface outline-none focus:border-primary"
            />
          </td>
        ))}
        <td colSpan={2} />
      </tr>
      <tr className="border-b border-outline-variant bg-surface-container-low">
        <td colSpan={9} className="px-sm pb-sm">
          <div className="flex flex-wrap items-center justify-end gap-sm">
            {error && (
              <span role="alert" className="mr-auto text-label-md text-error">
                {error}
              </span>
            )}
            {isCustom && (
              <button type="button" disabled={busy} onClick={() => void save(null)} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer">
                Reset to the IB&apos;s
              </button>
            )}
            <button type="button" onClick={() => onDone(undefined)} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer px-sm">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(values)}
              className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}

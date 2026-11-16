"use client";

import { useState } from "react";
import { RESULT_KINDS, RESULT_KIND_LABEL, type ResultInput, type ResultKind, type StudentResult } from "@/lib/results";

export type SubjectOption = { id: string; name: string; level: "HL" | "SL" | null };

type Mode = "grade" | "marks" | "percent";

const field =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface outline-none focus:border-primary min-w-0";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Add or edit one result: subject, name, what it was, date, and a grade, marks or a percentage. */
export function ResultForm({
  subjects,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  subjects: SubjectOption[];
  initial?: Partial<StudentResult> & { hubItemId?: string | null };
  submitLabel: string;
  onSubmit: (input: Partial<Record<keyof ResultInput, unknown>>) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? subjects[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<ResultKind>(initial?.kind ?? "test");
  const [takenOn, setTakenOn] = useState(initial?.takenOn ?? today());
  const [mode, setMode] = useState<Mode>(
    initial?.grade != null ? "grade" : initial?.marks != null ? "marks" : initial?.percent != null ? "percent" : "grade",
  );
  const [grade, setGrade] = useState(initial?.grade != null ? String(initial.grade) : "");
  const [marks, setMarks] = useState(initial?.marks != null ? String(initial.marks) : "");
  const [maxMarks, setMaxMarks] = useState(initial?.maxMarks != null ? String(initial.maxMarks) : "");
  const [percent, setPercent] = useState(initial?.percent != null ? String(initial.percent) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const err = await onSubmit({
      subjectId,
      title,
      kind,
      takenOn,
      grade: mode === "grade" ? grade : null,
      marks: mode === "marks" ? marks : null,
      maxMarks: mode === "marks" ? maxMarks : null,
      percent: mode === "percent" ? percent : null,
      note,
      hubItemId: initial?.hubItemId ?? null,
    });
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <form
      className="flex flex-col gap-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="grid sm:grid-cols-2 gap-sm">
        <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
          Subject
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
          Name
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Unit 3 test" className={field} />
        </label>
        <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
          What was it?
          <select value={kind} onChange={(e) => setKind(e.target.value as ResultKind)} className={field}>
            {RESULT_KINDS.map((k) => (
              <option key={k} value={k}>
                {RESULT_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
          Date
          <input type="date" value={takenOn} onChange={(e) => setTakenOn(e.target.value)} className={field} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-xs">
        <legend className="text-label-md text-on-surface-variant mb-xs">Result</legend>
        <div className="inline-flex self-start rounded-full border border-outline-variant p-0.5" role="radiogroup">
          {(["grade", "marks", "percent"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-md py-1 text-label-md font-semibold cursor-pointer ${mode === m ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
            >
              {m === "grade" ? "IB grade" : m === "marks" ? "Marks" : "Percentage"}
            </button>
          ))}
        </div>
        {mode === "grade" && (
          <div className="flex flex-wrap gap-xs" role="radiogroup" aria-label="IB grade">
            {[1, 2, 3, 4, 5, 6, 7].map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={grade === String(g)}
                onClick={() => setGrade(String(g))}
                className={`w-10 h-10 rounded-lg border text-body-lg font-semibold cursor-pointer ${
                  grade === String(g) ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface hover:border-primary"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        {mode === "marks" && (
          <div className="flex items-center gap-sm">
            <input inputMode="decimal" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="61" aria-label="Your marks" className={`${field} w-24`} />
            <span className="text-on-surface-variant">out of</span>
            <input inputMode="decimal" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder="80" aria-label="Total marks" className={`${field} w-24`} />
          </div>
        )}
        {mode === "percent" && (
          <div className="flex items-center gap-xs">
            <input inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="72" aria-label="Percentage" className={`${field} w-24`} />
            <span className="text-on-surface-variant">%</span>
          </div>
        )}
      </fieldset>

      <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
        Note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. ran out of time on the last question" className={field} />
      </label>

      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}
      <div className="flex gap-sm justify-end">
        <button type="button" onClick={onCancel} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer px-sm">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="rounded-full bg-primary text-on-primary px-lg py-xs text-label-lg font-semibold disabled:opacity-50 cursor-pointer">
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

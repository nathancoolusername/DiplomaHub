"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { getSubjectColor } from "@/components/hub/subject-colors";
import { Segmented } from "@/components/shared/Segmented";
import { Spinner } from "@/components/spinner";
import { createProjectAction } from "@/app/review/actions";
import { QUESTION_LABEL, type ReviewKind, type ReviewLevel } from "@/lib/review/labels";

type SubjectOption = {
  id: string;
  name: string;
  shortName: string;
  ibGroup: number;
  mine: boolean;
  ia: boolean;
  iaLabel: string | null;
  level: ReviewLevel | null;
};

const IB_GROUPS: { group: number; label: string }[] = [
  { group: 1, label: "Language A" },
  { group: 2, label: "Language B" },
  { group: 3, label: "Individuals and societies" },
  { group: 4, label: "Sciences" },
  { group: 5, label: "Mathematics" },
  { group: 6, label: "The arts" },
];

const KIND_WORD: Record<ReviewKind, string> = { ia: "IA", ee: "EE", tok_essay: "TOK essay", tok_exhibition: "TOK exhibition" };

const KIND_OPTIONS: { value: ReviewKind; label: string }[] = [
  { value: "ia", label: "IA" },
  { value: "ee", label: "Extended essay" },
  { value: "tok_essay", label: "TOK essay" },
  { value: "tok_exhibition", label: "TOK exhibition" },
];

const TITLE_HINT: Record<ReviewKind, string> = {
  ia: "e.g. Maths IA: modelling the spread of a rumour",
  ee: "e.g. History EE",
  tok_essay: "e.g. TOK essay, title 3",
  tok_exhibition: "e.g. TOK exhibition",
};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary";

export function NewProjectForm({ subjects }: { subjects: SubjectOption[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<ReviewKind>("ia");
  const [subjectId, setSubjectId] = useState("");
  const [level, setLevel] = useState<ReviewLevel>("SL");
  const [title, setTitle] = useState("");
  // The name follows the choices ("Biology IA") until the student types their own.
  const [titleTouched, setTitleTouched] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const needsSubject = kind === "ia" || kind === "ee";
  const mine = subjects.filter((s) => s.mine);
  // IA: only subjects we can review. EE: any subject (an EE can be in a subject you don't take).
  const others = subjects.filter((s) => !s.mine && (kind === "ee" || s.ia));
  const picked = subjects.find((s) => s.id === subjectId) ?? null;
  const pickedIsOther = !!picked && !picked.mine;

  function autoTitle(k: ReviewKind, subject: SubjectOption | null) {
    if (titleTouched) return;
    setTitle(k === "ia" || k === "ee" ? (subject ? `${subject.shortName} ${KIND_WORD[k]}` : "") : KIND_WORD[k]);
  }
  function pick(s: SubjectOption) {
    setSubjectId(s.id);
    setLevel(s.level ?? "SL");
    autoTitle(kind, s);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createProjectAction({ kind, subjectId: needsSubject ? subjectId || null : null, level: kind === "ia" && subjectId ? level : null, title, question });
      if (r.ok) router.push(`/review/${r.data}`);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
      <div className="flex flex-col gap-xs">
        <span className="text-label-md font-semibold text-on-surface">What is it?</span>
        <Segmented
          label="Kind of work"
          value={kind}
          options={KIND_OPTIONS}
          onChange={(k) => {
            setKind(k);
            const keep = picked && (k === "ee" || (k === "ia" && picked.ia)) ? picked : null;
            setSubjectId(keep?.id ?? "");
            autoTitle(k, keep);
          }}
        />
      </div>

      {needsSubject && (
        <fieldset className="flex flex-col gap-sm">
          <legend className="text-label-md font-semibold text-on-surface mb-xs">Subject</legend>
          {mine.length > 0 ? (
            <div className="flex flex-col gap-xs">
              <span className="text-label-sm text-on-surface-variant">Your subjects</span>
              <div className="flex flex-wrap gap-sm">
                {mine.map((s) => {
                  const unavailable = kind === "ia" && !s.ia;
                  return (
                    <SubjectPill
                      key={s.id}
                      subject={s}
                      active={s.id === subjectId}
                      disabled={unavailable}
                      note={unavailable ? "soon" : s.level}
                      onPick={() => pick(s)}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-label-sm text-on-surface-variant">Pick from the list below, or add your subjects in Practice so they show here first.</p>
          )}

          {others.length > 0 && (
            <div className="flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers || pickedIsOther}
                className="self-start inline-flex items-center gap-xs text-label-md text-primary hover:underline"
              >
                <ChevronDown size={14} className={`transition-transform ${showOthers || pickedIsOther ? "rotate-180" : ""}`} aria-hidden="true" />
                {kind === "ee" ? "Another subject" : "Other subjects"}
              </button>
              {(showOthers || pickedIsOther || mine.length === 0) &&
                IB_GROUPS.map(({ group, label }) => {
                  const list = others.filter((s) => s.ibGroup === group);
                  if (!list.length) return null;
                  return (
                    <div key={group} className="flex flex-col gap-xs">
                      <span className="text-label-sm text-on-surface-variant">{label}</span>
                      <div className="flex flex-wrap gap-sm">
                        {list.map((s) => (
                          <SubjectPill key={s.id} subject={s} active={s.id === subjectId} disabled={false} note={null} onPick={() => pick(s)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {kind === "ia" && picked && (
            <div className="flex flex-wrap items-center gap-sm pt-xs">
              <span className="text-label-md font-semibold text-on-surface">Level</span>
              <Segmented
                label="Level"
                size="sm"
                value={level}
                onChange={setLevel}
                options={[
                  { value: "SL", label: "SL" },
                  { value: "HL", label: "HL" },
                ]}
              />
              <span className="text-label-sm text-on-surface-variant">
                {picked.level ? (level === picked.level ? "From your subjects. Change it if that's wrong." : `Your subjects say ${picked.level}.`) : "Not set in your subjects yet, so check it."}
              </span>
            </div>
          )}
          {kind === "ia" && picked?.iaLabel && <span className="text-label-sm text-on-surface-variant">Reviewed as: {picked.iaLabel}</span>}
          {kind === "ia" && mine.some((s) => !s.ia) && (
            <span className="text-label-sm text-on-surface-variant">Subjects marked &ldquo;soon&rdquo; can&apos;t have their IA reviewed yet.</span>
          )}
        </fieldset>
      )}

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-semibold text-on-surface">Name</span>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(e.target.value !== "");
          }}
          placeholder={TITLE_HINT[kind]}
          maxLength={120}
          required
        />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="text-label-md font-semibold text-on-surface">
          {QUESTION_LABEL[kind]} <span className="font-normal text-on-surface-variant">(optional, you can add it later)</span>
        </span>
        <textarea className={`${inputClass} min-h-[80px]`} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={400} />
      </label>

      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {pending && <Spinner size={14} />} Create project
      </button>
    </form>
  );
}

function SubjectPill({
  subject,
  active,
  disabled,
  note,
  onPick,
}: {
  subject: SubjectOption;
  active: boolean;
  disabled: boolean;
  /** Small text after the name: the level, or "soon" when it can't be reviewed. */
  note: string | null;
  onPick: () => void;
}) {
  const color = getSubjectColor(subject.id);
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={active}
      title={disabled ? `${subject.name}: IA reviews are coming soon` : subject.name}
      className={`inline-flex items-center gap-1.5 px-md py-2 rounded-full border text-label-md font-semibold transition-colors ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-primary"
      }`}
      style={
        active
          ? { backgroundColor: color.base, borderColor: color.base, color: color.onBase }
          : { borderColor: "var(--color-outline-variant)", color: "var(--color-on-surface-variant)" }
      }
    >
      {active && <Check size={14} aria-hidden="true" />}
      {subject.shortName}
      {note && <span className="text-label-sm font-normal opacity-75">{note}</span>}
    </button>
  );
}

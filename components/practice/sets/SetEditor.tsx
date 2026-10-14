"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, Loader2, Lock, Play, X } from "lucide-react";
import type { PracticeSet, Question, SetSettings, Subject } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { updateSetAction } from "@/app/practice/actions";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { Segmented } from "@/components/shared/Segmented";
import { paperLabel } from "@/components/practice/player/question-format";
import { useBroOverride } from "@/components/shared/bro/bro-visibility";
import { DeleteSetButton } from "./DeleteSetButton";

type Editable = Pick<SetSettings, "timer" | "mcqFeedback" | "answerOn">;

/** A saved (or any of your own) set, edited before you start it. */
export function SetEditor({
  set,
  subject,
  questions,
  questionsLocked,
}: {
  set: PracticeSet;
  subject: Subject;
  questions: Question[];
  /** An unfinished attempt is tied to these questions: only name and settings can change. */
  questionsLocked: boolean;
}) {
  const router = useRouter();
  // Keep the Bro button above the fixed action bar.
  useBroOverride(false, 80);
  const [title, setTitle] = useState(set.title);
  const [settings, setSettings] = useState<Editable>({
    timer: set.settings.timer,
    mcqFeedback: set.settings.mcqFeedback,
    answerOn: set.settings.answerOn,
  });
  const [order, setOrder] = useState<string[]>(questions.map((q) => q.id));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [starting, startStart] = useTransition();

  const byId = new Map(questions.map((q) => [q.id, q]));
  const kept = order.map((id) => byId.get(id)!).filter(Boolean);
  const isMock = set.practiceType === "mock";
  const hasMcq = kept.some((q) => q.type === "mcq");
  const hasWritten = kept.some((q) => q.type !== "mcq");
  const marks = kept.reduce((s, q) => s + q.totalMarks, 0);

  const dirty =
    title.trim() !== set.title ||
    settings.timer !== set.settings.timer ||
    settings.mcqFeedback !== set.settings.mcqFeedback ||
    settings.answerOn !== set.settings.answerOn ||
    order.join() !== questions.map((q) => q.id).join();

  const change = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setSaved(false);
    setSettings((s) => ({ ...s, [key]: value }));
  };
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setSaved(false);
    setOrder(next);
  };
  const remove = (id: string) => {
    setSaved(false);
    setOrder((o) => o.filter((x) => x !== id));
  };

  const edit = () => ({ title: title.trim(), settings, questionIds: order });

  const save = () => {
    setError(null);
    start(async () => {
      try {
        await updateSetAction(set.id, edit());
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save the changes");
      }
    });
  };

  // Start saves any changes first, then opens the player.
  const begin = () => {
    setError(null);
    startStart(async () => {
      try {
        if (dirty) await updateSetAction(set.id, edit(), true);
        else router.push(links.play(set.id));
      } catch (e) {
        unstable_rethrow(e);
        setError(e instanceof Error ? e.message : "Couldn't start the set");
      }
    });
  };

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl pb-32 flex flex-col gap-xl">
      <header className="flex flex-col gap-sm">
        <Link href={links.editSet(set)} className="self-start inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
          <ChevronLeft size={14} aria-hidden="true" /> {subject.shortName} · change settings
        </Link>
        <label className="flex flex-col gap-xs">
          <span className="text-label-md font-semibold text-on-surface-variant">Name</span>
          <input
            type="text"
            value={title}
            maxLength={120}
            onChange={(e) => {
              setSaved(false);
              setTitle(e.target.value);
            }}
            className="font-serif font-bold text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs"
          />
        </label>
        <p className="text-label-md text-on-surface-variant tabular-nums">
          {kept.length} {kept.length === 1 ? "question" : "questions"} · {marks} marks
          {set.saved ? " · in My sets" : ""}
          {set.shareCode ? ` · code ${set.shareCode}` : ""}
        </p>
      </header>

      <section className="flex flex-col gap-md" aria-labelledby="set-settings">
        <h2 id="set-settings" className="font-serif font-bold text-headline-sm text-on-surface">
          Settings
        </h2>
        <div className="grid sm:grid-cols-2 gap-md">
          {!isMock && (
            <div className="flex flex-col gap-xs">
              <span className="text-label-md font-semibold text-on-surface">Timer</span>
              <Segmented
                label="Timer"
                value={settings.timer}
                onChange={(v) => change("timer", v)}
                options={[
                  { value: "off", label: "Off" },
                  { value: "exam_pace", label: "Exam pace" },
                ]}
              />
            </div>
          )}
          {hasMcq && (
            <div className="flex flex-col gap-xs">
              <span className="text-label-md font-semibold text-on-surface">Multiple-choice feedback</span>
              <Segmented
                label="Multiple-choice feedback"
                value={settings.mcqFeedback}
                onChange={(v) => change("mcqFeedback", v)}
                options={[
                  { value: "each", label: "After each" },
                  { value: "end", label: "At the end" },
                ]}
              />
            </div>
          )}
          {hasWritten && (
            <div className="flex flex-col gap-xs">
              <span className="text-label-md font-semibold text-on-surface">Answer on</span>
              <Segmented
                label="Answer on"
                value={settings.answerOn}
                onChange={(v) => change("answerOn", v)}
                options={[
                  { value: "screen", label: "Screen" },
                  { value: "paper", label: "Paper" },
                ]}
              />
            </div>
          )}
        </div>
        {isMock && <p className="text-label-md text-on-surface-variant">Mocks always run at exam pace.</p>}
      </section>

      <section className="flex flex-col gap-md" aria-labelledby="set-questions">
        <div className="flex items-end justify-between gap-md flex-wrap">
          <h2 id="set-questions" className="font-serif font-bold text-headline-sm text-on-surface">
            Questions
          </h2>
          {questionsLocked ? (
            <p className="inline-flex items-center gap-xs text-label-md text-on-surface-variant">
              <Lock size={14} aria-hidden="true" /> You&apos;ve started this set. Finish or delete that attempt to change its questions.
            </p>
          ) : (
            <p className="text-label-md text-on-surface-variant">Reorder or remove questions.</p>
          )}
        </div>
        <ol className="flex flex-col gap-sm">
          {kept.map((q, i) => (
            <li key={q.id} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-md flex gap-md items-start">
              <span className="shrink-0 w-7 text-label-lg font-bold text-on-surface-variant tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0 flex flex-col gap-xs">
                <p className="text-label-sm text-on-surface-variant">
                  {paperLabel(q)}
                  {q.type === "mcq" ? " · Multiple choice" : q.type === "extended" ? " · Essay" : ""} · {q.totalMarks} marks
                </p>
                <div className="text-body-md text-on-surface line-clamp-3">
                  <MathMarkdown>{q.stemMd || q.parts[0]?.textMd || ""}</MathMarkdown>
                </div>
              </div>
              {!questionsLocked && (
                <div className="shrink-0 flex items-center gap-xs">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move question ${i + 1} up`} className="p-xs rounded-lg text-on-surface-variant hover:text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === kept.length - 1} aria-label={`Move question ${i + 1} down`} className="p-xs rounded-lg text-on-surface-variant hover:text-primary disabled:opacity-30 cursor-pointer disabled:cursor-default">
                    <ArrowDown size={16} />
                  </button>
                  <button type="button" onClick={() => remove(q.id)} disabled={kept.length === 1} aria-label={`Remove question ${i + 1}`} title={kept.length === 1 ? "A set needs at least one question" : undefined} className="p-xs rounded-lg text-on-surface-variant hover:text-error disabled:opacity-30 cursor-pointer disabled:cursor-default">
                    <X size={16} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-surface glass border-t border-outline-variant">
        <div className="max-w-[900px] mx-auto px-md py-md flex items-center gap-sm flex-wrap">
          <DeleteSetButton setId={set.id} title={set.title} variant="button" afterHref={links.subject(set.subjectId)} />
          <p className={`flex-1 min-w-0 text-label-md ${error ? "text-error" : "text-on-surface-variant"}`} aria-live="polite">
            {error ?? (dirty ? "Unsaved changes" : saved ? "Saved" : "")}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending || starting || !title.trim()}
            className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Save changes
          </button>
          <button
            type="button"
            onClick={begin}
            disabled={pending || starting || !title.trim()}
            className="inline-flex items-center gap-sm rounded-xl bg-primary text-on-primary px-xl py-sm text-body-md font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {starting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {questionsLocked ? "Resume" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}

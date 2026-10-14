"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AttemptAnswer, AttemptResult } from "@/lib/data/types";
import { essayMarks, tickedMarks } from "@/lib/practice/marking";
import { confirmMarksAction } from "@/app/practice/actions";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { QuestionFigures } from "@/components/shared/QuestionFigures";
import { MarkPointList } from "../MarkPointList";
import { partHeading } from "../player/question-format";
import { EssayMarking } from "./EssayMarking";

/**
 * After finishing: every written answer that wasn't marked during the set
 * (all of them in timed mode) gets marked here, against the markscheme.
 */
export function MarkingStep({ result }: { result: AttemptResult }) {
  const router = useRouter();
  const toMark = result.items.filter((i) => i.answer.marksAwarded === null);
  const [ticks, setTicks] = useState<Record<string, AttemptAnswer["tickedPoints"]>>(() =>
    Object.fromEntries(toMark.map((i) => [i.question.id, i.answer.tickedPoints])),
  );
  const [essays, setEssays] = useState<Record<string, AttemptAnswer["criterionMarks"]>>(() =>
    Object.fromEntries(toMark.filter((i) => i.question.type === "extended").map((i) => [i.question.id, i.answer.criterionMarks])),
  );
  const [saving, start] = useTransition();
  const marksFor = (item: (typeof toMark)[number]) =>
    item.question.type === "extended"
      ? essayMarks(item.markscheme, essays[item.question.id] ?? {})
      : tickedMarks(item.markscheme, ticks[item.question.id] ?? {});

  const toggle = (qid: string, label: string, i: number) =>
    setTicks((t) => {
      const current = t[qid]?.[label] ?? [];
      const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i].sort((a, b) => a - b);
      return { ...t, [qid]: { ...t[qid], [label]: next } };
    });

  const done = result.items.filter((i) => i.answer.marksAwarded !== null);
  const mcqCount = done.filter((i) => i.question.type === "mcq").length;
  const selfMarked = done.length - mcqCount;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const running = toMark.reduce((s, i) => s + marksFor(i), 0);
  const possible = toMark.reduce((s, i) => s + i.question.totalMarks, 0);

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg pb-32">
      <header className="flex flex-col gap-xs">
        <p className="text-label-md text-on-surface-variant">{result.set.title}</p>
        <h1 className="font-serif font-bold text-headline-lg text-on-surface">Mark your answers</h1>
        <p className="text-body-md text-on-surface-variant">
          Tick each mark your working earns, and for essays pick the band and mark that fit best, like an examiner would.
          {mcqCount > 0 && ` ${plural(mcqCount, "multiple-choice question was", "multiple-choice questions were")} marked automatically.`}
          {selfMarked > 0 && ` You already marked ${plural(selfMarked, "question", "questions")} during the set.`}
        </p>
      </header>

      {toMark.map((item) => {
        const { question, answer, markscheme } = item;
        const n = result.items.findIndex((i) => i.question.id === question.id) + 1;
        return (
          <article key={question.id} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-on-surface">Question {n}</h2>
              <span className="text-label-md font-semibold tabular-nums text-on-surface">
                {marksFor(item)} / {question.totalMarks}
              </span>
            </div>
            {question.stemMd && (
              <div className="text-body-md text-on-surface">
                <MathMarkdown>{question.stemMd}</MathMarkdown>
              </div>
            )}
            <QuestionFigures figures={question.figures} />
            {question.type === "extended" && markscheme.criteria ? (
              <>
                <div className="text-body-md text-on-surface font-medium">
                  <MathMarkdown>{question.parts[0].textMd}</MathMarkdown>
                </div>
                <EssayMarking
                  criteria={markscheme.criteria}
                  answer={answer}
                  chosen={essays[question.id] ?? {}}
                  onChange={(criterion, mark) => setEssays((e) => ({ ...e, [question.id]: { ...e[question.id], [criterion]: mark } }))}
                />
              </>
            ) : question.parts.map((part) => {
              const ms = markscheme.parts.find((p) => p.label === part.label);
              const written = answer.partAnswers[part.label]?.trim();
              return (
                <div key={part.label} className="flex flex-col gap-sm border-t border-outline-variant pt-md">
                  <div className="flex items-start gap-md text-body-md text-on-surface">
                    {part.label !== "whole" && <span className="font-semibold">{partHeading(part.label)}</span>}
                    <div className="flex-1 min-w-0">
                      <MathMarkdown>{part.textMd}</MathMarkdown>
                    </div>
                    <span className="font-semibold tabular-nums">[{part.marks}]</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-low px-md py-sm text-body-md">
                    <p className="text-label-sm text-on-surface-variant mb-xs">Your answer</p>
                    {written ? (
                      <p className="whitespace-pre-wrap text-on-surface">{written}</p>
                    ) : (
                      <p className="text-on-surface-variant italic">{answer.onPaper ? "Answered on paper" : "No answer"}</p>
                    )}
                  </div>
                  {ms && (
                    <MarkPointList part={ms} ticked={ticks[question.id]?.[part.label] ?? []} onToggle={(i) => toggle(question.id, part.label, i)} />
                  )}
                </div>
              );
            })}
          </article>
        );
      })}

      <div className="fixed bottom-0 inset-x-0 z-30 bg-surface glass border-t border-outline-variant">
        <div className="max-w-[900px] mx-auto px-md h-18 flex items-center justify-between gap-md">
          <span className="text-body-md text-on-surface tabular-nums">
            To mark: <span className="font-semibold">{running} / {possible}</span>
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              start(async () => {
                await confirmMarksAction(result.attempt.id, ticks, essays);
                router.refresh();
              })
            }
            className="rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving…" : "Confirm marks"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { MarksDebrief } from "./MarksDebrief";
import { AskBroButton } from "@/components/shared/bro/AskBroButton";
import { McqReview } from "./McqReview";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bookmark, CalendarPlus, Check, FileDown, RotateCcw, Trophy, Users } from "lucide-react";
import { Spinner } from "@/components/spinner";
import type { AttemptResult, LeaderboardStanding, StrengthChange } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { formatMinutes } from "@/lib/practice/pace";
import { STRENGTH_LABELS } from "@/lib/practice/strength";
import { redoWrongAction, saveSetAction, scheduleRedoAction } from "@/app/practice/actions";
import { ScheduleDialog, suggestMinutes } from "@/components/practice/build/ScheduleDialog";
import { ShareButton } from "@/components/codes/ShareButton";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { QuestionFigures } from "@/components/shared/QuestionFigures";
import { StrengthTile } from "@/components/shared/strength/StrengthTile";

function ChangeTile({ change }: { change: StrengthChange }) {
  const { before, after, subtopic } = change;
  const delta = (after.score ?? 0) - (before.score ?? 0);
  const Arrow = delta > 0.005 ? ArrowUp : delta < -0.005 ? ArrowDown : ArrowRight;
  const tone = delta > 0.005 ? "text-secondary" : delta < -0.005 ? "text-tertiary" : "text-on-surface-variant";
  return (
    <li className="rounded-xl bg-surface-container-low border border-outline-variant p-sm flex flex-col gap-xs min-w-44">
      <p className="text-label-sm text-on-surface truncate" title={`${subtopic.code} ${subtopic.name}`}>
        <span className="font-bold">{subtopic.code}</span> {subtopic.shortName}
      </p>
      <div className="flex items-center gap-xs">
        <StrengthTile code={STRENGTH_LABELS[before.level]} name={subtopic.name} level={before.level} />
        <Arrow size={16} className={tone} aria-label={delta > 0.005 ? "up" : delta < -0.005 ? "down" : "no change"} />
        <StrengthTile code={STRENGTH_LABELS[after.level]} name={subtopic.name} level={after.level} />
      </div>
    </li>
  );
}

export function ResultsView({
  result,
  isPro,
  points = null,
  standing = null,
  squad = null,
}: {
  result: AttemptResult;
  isPro: boolean;
  /** Practice points this set earned (null if unknown). */
  points?: number | null;
  standing?: LeaderboardStanding | null;
  /** Their rank this week in their first squad with friends in it. */
  squad?: { id: string; name: string; rank: number; members: number } | null;
}) {
  const { marksEarned, marksPossible, items, set } = result;
  const pct = marksPossible ? Math.round((marksEarned / marksPossible) * 100) : 0;
  const wrongCount = items.filter((i) => (i.answer.marksAwarded ?? 0) < i.question.totalMarks).length;
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, start] = useTransition();
  const [doing, setDoing] = useState<"redo" | "save" | null>(null);
  // Which button is working; its spinner shows while `busy` (Redo keeps it until the redirect lands).
  const run = (what: "redo" | "save", fn: () => Promise<void>) => {
    setDoing(what);
    start(fn);
  };
  // Schedule a redo (Pro): the ones they lost marks on, or the whole set.
  const [scheduling, setScheduling] = useState(false);
  const [redoWhich, setRedoWhich] = useState<"wrong" | "all">(wrongCount > 0 ? "wrong" : "all");
  const [scheduleBusy, startSchedule] = useTransition();
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<string | null>(null);
  const wrongMarks = items.filter((i) => (i.answer.marksAwarded ?? 0) < i.question.totalMarks).reduce((n, i) => n + i.question.totalMarks, 0);
  const scheduleRedo = (slot: { title: string; startAt: string; endAt: string }) =>
    startSchedule(async () => {
      setScheduleError(null);
      try {
        const r = await scheduleRedoAction(result.attempt.id, redoWhich, slot);
        const when = new Date(slot.startAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        setScheduled(`“${r.title}” is on your Hub for ${when}.`);
        setScheduling(false);
      } catch (e) {
        setScheduleError(e instanceof Error ? e.message : "Couldn't schedule it");
      }
    });

  return (
    <div className="max-w-[1000px] mx-auto px-md py-xl flex flex-col gap-lg">
      {/* Score */}
      <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-wrap items-end justify-between gap-lg">
        <div className="flex flex-col gap-xs">
          <p className="text-label-md text-on-surface-variant">{set.title}</p>
          <p className="font-serif font-bold text-display-lg text-on-surface leading-none tabular-nums">
            {marksEarned} / {marksPossible} <span className="text-headline-md text-on-surface-variant">({pct}%)</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-body-lg text-on-surface tabular-nums">{formatMinutes(result.timeTakenS)}</p>
          <p className="text-label-md text-on-surface-variant">exam pace {formatMinutes(result.examPaceS)}</p>
        </div>
      </section>

      {points !== null && (
        <Link
          href="/leaderboard"
          className="-mt-sm self-start inline-flex flex-wrap items-center gap-sm rounded-full bg-secondary-container text-on-secondary-container px-md py-xs text-label-md font-semibold hover:opacity-90"
        >
          <Trophy size={14} aria-hidden="true" /> +{points} points
          {standing?.rank && !standing.hidden ? ` · #${standing.rank} this week` : ""}
        </Link>
      )}
      {points !== null && squad && (
        <Link
          href={`/squads/${squad.id}`}
          className="-mt-sm self-start inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary"
        >
          <Users size={14} aria-hidden="true" /> #{squad.rank} of {squad.members} in {squad.name}
        </Link>
      )}

      {/* What changed */}
      <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
        <h2 className="font-serif font-bold text-headline-md text-on-surface">What changed</h2>
        {result.isFirstResult && (
          <p className="text-body-md text-on-surface-variant">
            Each tile is a topic this set touched: its level before the set, then after. Five answered questions in a topic shows your level.
          </p>
        )}
        <ul className="flex flex-wrap gap-sm">
          {result.strengthChanges.map((c) => (
            <ChangeTile key={c.subtopic.id} change={c} />
          ))}
        </ul>
      </section>

      <MarksDebrief result={result} isPro={isPro} />

      {/* Questions */}
      <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden">
        <h2 className="font-serif font-bold text-headline-md text-on-surface p-lg pb-sm">Questions</h2>
        <ol>
          {items.map(({ question, subtopic, answer, markscheme }, i) => {
            const earned = answer.marksAwarded ?? 0;
            const full = earned >= question.totalMarks;
            const isOpen = open === question.id;
            return (
              <li key={question.id} className="border-t border-outline-variant">
                <div className="flex items-center gap-md px-lg py-sm">
                  <span className="w-7 text-label-md text-on-surface-variant tabular-nums">{i + 1}</span>
                  <span className="flex-1 min-w-0 text-body-md text-on-surface truncate" title={subtopic.name}>
                    <span className="font-semibold">{subtopic.code}</span> {subtopic.shortName}
                  </span>
                  <span
                    className={`rounded-full px-sm py-px text-label-sm font-semibold tabular-nums ${
                      full ? "bg-secondary-container text-on-secondary-container" : earned > 0 ? "bg-surface-container text-on-surface" : "bg-tertiary-container text-on-tertiary-container"
                    }`}
                  >
                    {earned} / {question.totalMarks}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : question.id)}
                    aria-expanded={isOpen}
                    className="text-label-md font-semibold text-primary hover:underline cursor-pointer w-14 text-right"
                  >
                    {isOpen ? "Hide" : "Explain"}
                  </button>
                </div>
                {isOpen && (
                  <div className="px-lg pb-lg pl-[4.25rem] flex flex-col gap-sm text-body-md text-on-surface">
                    <div className="self-start">
                      <AskBroButton attemptId={result.attempt.id} questionId={question.id} label={`Question ${i + 1}`} isPro={isPro} />
                    </div>
                    {question.stemMd && <MathMarkdown>{question.stemMd}</MathMarkdown>}
                    <QuestionFigures figures={question.figures} />
                    {question.type === "extended" ? (
                      <>
                        <MathMarkdown>{question.parts[0].textMd}</MathMarkdown>
                        {markscheme.criteria && (
                          <ul className="flex flex-col gap-xs">
                            {markscheme.criteria.map((c) => {
                              const m = answer.criterionMarks[c.name] ?? 0;
                              const band = c.bands.find((b) => m >= b.min && m <= b.max);
                              return (
                                <li key={c.name} className="rounded-lg bg-surface-container-low px-md py-sm flex flex-col gap-0.5">
                                  <span className="flex justify-between gap-sm text-label-md">
                                    <span className="font-semibold">{c.name}</span>
                                    <span className="tabular-nums font-semibold">
                                      {m} / {c.maxMarks}
                                    </span>
                                  </span>
                                  {band && <span className="text-label-sm text-on-surface-variant">{band.descriptor}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {markscheme.feedbackPoints && (
                          <div className="rounded-xl bg-surface-container-low border border-outline-variant p-md">
                            <p className="text-label-md font-semibold mb-xs">What a strong answer does</p>
                            <ul className="list-disc pl-lg flex flex-col gap-0.5 text-body-md">
                              {markscheme.feedbackPoints.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : question.type === "mcq" ? (
                      <>
                        <MathMarkdown>{question.parts[0].textMd}</MathMarkdown>
                        {question.options ? (
                          <McqReview options={question.options} selected={answer.selectedOption} correct={markscheme.correctOption} />
                        ) : (
                          <p className="text-label-md text-on-surface-variant">
                            Your answer: <span className="font-semibold text-on-surface">{answer.selectedOption ?? "none"}</span> · Correct:{" "}
                            <span className="font-semibold text-on-surface">{markscheme.correctOption}</span>
                          </p>
                        )}
                      </>
                    ) : (
                      markscheme.parts.map((p) => (
                        <p key={p.label} className="text-label-md text-on-surface-variant">
                          {p.label !== "whole" && <span className="font-semibold">({p.label}) </span>}
                          Answer: <MathMarkdown inline className="text-on-surface">{p.answerMd}</MathMarkdown>
                        </p>
                      ))
                    )}
                    {markscheme.workedSolutionMd && (
                      <div className="rounded-xl bg-surface-container-low border border-outline-variant p-md">
                        <MathMarkdown>{markscheme.workedSolutionMd}</MathMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Actions */}
      <section className="flex flex-wrap items-center gap-sm">
        {wrongCount > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run("redo", () => redoWrongAction(result.attempt.id))}
            className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {busy && doing === "redo" ? <Spinner size={14} /> : <RotateCcw size={14} aria-hidden="true" />} Redo the {wrongCount === 1 ? "one" : `${wrongCount}`} I got wrong
          </button>
        )}
        <button
          type="button"
          disabled={saved || (busy && doing === "save")}
          onClick={() => run("save", async () => { await saveSetAction(set.id); setSaved(true); })}
          className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-70 cursor-pointer"
        >
          {saved ? <Check size={14} aria-hidden="true" /> : busy && doing === "save" ? <Spinner size={14} /> : <Bookmark size={14} aria-hidden="true" />}{" "}
          {saved ? "Saved to My sets" : busy && doing === "save" ? "Saving…" : "Save"}
        </button>
        {isPro && (
          <button
            type="button"
            onClick={() => {
              setScheduled(null);
              setScheduleError(null);
              setScheduling(true);
            }}
            className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer"
          >
            <CalendarPlus size={14} aria-hidden="true" /> Schedule a redo
          </button>
        )}
        <ShareButton type="practice_set" targetId={set.id} title={set.title} />
        <a
          href={`${links.pdf(set.id)}?print=1`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary"
        >
          <FileDown size={14} aria-hidden="true" /> PDF
        </a>
        <Link href={links.subject(set.subjectId)} className="ml-auto text-label-md font-semibold text-primary hover:underline">
          Back to {result.subject.shortName}
        </Link>
        {scheduled && (
          <p className="basis-full rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm text-label-md" role="status">
            {scheduled}{" "}
            <Link href={links.hub()} className="font-semibold underline">
              Open the Hub
            </Link>
          </p>
        )}
        {/* Right after finishing is when a set is most worth passing on. */}
        <p className="basis-full text-label-md text-on-surface-variant">
          Revising this with friends? <span className="font-semibold text-on-surface">Share</span> gives them a code for their own copy of this set.
        </p>
      </section>

      {scheduling && (
        <ScheduleDialog
          heading="Schedule a redo"
          daysAhead={3}
          defaultTitle={`Redo: ${set.title}`.slice(0, 200)}
          suggestedMinutes={suggestMinutes(redoWhich === "wrong" ? wrongMarks : marksPossible)}
          busy={scheduleBusy}
          error={scheduleError}
          onClose={() => setScheduling(false)}
          onSchedule={scheduleRedo}
        >
          {wrongCount > 0 && (
            <fieldset className="flex flex-col gap-xs">
              <legend className="mb-xs text-label-md font-semibold text-on-surface">Redo</legend>
              {(
                [
                  ["wrong", `The ${wrongCount === 1 ? "one" : wrongCount} I lost marks on`],
                  ["all", `The whole set (${items.length} questions)`],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-sm text-body-md text-on-surface cursor-pointer">
                  <input type="radio" name="redo-which" checked={redoWhich === value} onChange={() => setRedoWhich(value)} className="accent-primary" />
                  {label}
                </label>
              ))}
              <p className="text-label-sm text-on-surface-variant">Three days on is a good gap: long enough to test what stuck.</p>
            </fieldset>
          )}
        </ScheduleDialog>
      )}
    </div>
  );
}

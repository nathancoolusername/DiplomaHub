"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Bookmark, Check, Copy, RotateCcw, Share2, Trophy } from "lucide-react";
import type { AttemptResult, LeaderboardStanding, StrengthChange } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { formatMinutes } from "@/lib/practice/pace";
import { STRENGTH_LABELS } from "@/lib/practice/strength";
import { redoWrongAction, saveSetAction, shareSetAction } from "@/app/practice/actions";
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
  points = null,
  standing = null,
}: {
  result: AttemptResult;
  isPro: boolean;
  /** Practice points this set earned (null if unknown). */
  points?: number | null;
  standing?: LeaderboardStanding | null;
}) {
  const { marksEarned, marksPossible, items, set } = result;
  const pct = marksPossible ? Math.round((marksEarned / marksPossible) * 100) : 0;
  const wrongCount = items.filter((i) => (i.answer.marksAwarded ?? 0) < i.question.totalMarks).length;
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [code, setCode] = useState<string | null>(set.shareCode);
  const [copied, setCopied] = useState(false);
  const [busy, start] = useTransition();

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

      {/* TODO(phase 7): Bro debrief for Pro (what to do next, with a Schedule button). */}

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
                        <p className="text-label-md text-on-surface-variant">
                          Your answer: <span className="font-semibold text-on-surface">{answer.selectedOption ?? "none"}</span> · Correct:{" "}
                          <span className="font-semibold text-on-surface">{markscheme.correctOption}</span>
                        </p>
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
            onClick={() => start(() => redoWrongAction(result.attempt.id))}
            className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw size={14} aria-hidden="true" /> Redo the {wrongCount === 1 ? "one" : `${wrongCount}`} I got wrong
          </button>
        )}
        <button
          type="button"
          disabled={saved}
          onClick={() => start(async () => { await saveSetAction(set.id); setSaved(true); })}
          className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-70 cursor-pointer"
        >
          {saved ? <Check size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />} {saved ? "Saved to My sets" : "Save"}
        </button>
        <span className="inline-flex items-center gap-xs">
          <button
            type="button"
            onClick={() => start(async () => setCode(await shareSetAction(set.id)))}
            className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer"
          >
            <Share2 size={14} aria-hidden="true" /> Share
          </button>
          {code && (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(code);
                setCopied(true);
              }}
              className="inline-flex items-center gap-xs rounded-lg bg-surface-container px-sm py-sm font-mono text-label-md font-bold tracking-widest text-on-surface cursor-pointer"
              title="Copy code"
            >
              {code} {copied ? <Check size={14} aria-label="Copied" /> : <Copy size={14} aria-label="Copy" />}
            </button>
          )}
        </span>
        <Link href={links.subject(set.subjectId)} className="ml-auto text-label-md font-semibold text-primary hover:underline">
          Back to {result.subject.shortName}
        </Link>
      </section>
    </div>
  );
}

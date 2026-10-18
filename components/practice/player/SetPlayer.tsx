"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Flag, LayoutGrid, Lightbulb, X } from "lucide-react";
import type { Attempt, AttemptAnswer, Level, Markscheme, PracticeSet, Question } from "@/lib/data/types";
import { topicOfSubtopic, type Booklet } from "@/lib/booklets";
import { isAnswered } from "@/lib/practice/marking";
import { links } from "@/lib/practice/links";
import { discardAttemptAction, finishAttemptAction, revealMarkschemeAction, saveAnswerAction } from "@/app/practice/actions";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { QuestionFigures } from "@/components/shared/QuestionFigures";
import { useBroOverride } from "@/components/shared/bro/bro-visibility";
import { McqAnswer } from "./McqAnswer";
import { Navigator, type DotState } from "./Navigator";
import { PlayerTimer } from "./PlayerTimer";
import { ShortAnswer } from "./ShortAnswer";
import { EssayAnswer } from "./EssayAnswer";
import { paperLabel } from "./question-format";
import { BookletPanel } from "./BookletPanel";
import { PeriodicTable } from "./PeriodicTable";
import { useHintTurn } from "@/components/shared/FirstTimeHint";
import { BOOKLET_TIP_ID } from "@/lib/booklets";

const SAVE_DELAY_MS = 600;
const BOTTOM_BAR_PX = 72;
// Whether the booklet was left open, so it stays open from set to set (this browser only).
const BOOKLET_OPEN_KEY = "dp-booklet-open";
const noSubscribe = () => () => {};
function readBookletOpen(): boolean {
  try {
    return localStorage.getItem(BOOKLET_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

type SaveState = "saved" | "saving" | "error";

export function SetPlayer({
  set,
  attempt,
  questions,
  initialAnswers,
  initialSchemes,
  mcqKeys = {},
  examPaceS,
  isPro,
  booklet = null,
  bookletTip = false,
  level,
  topicNames = {},
}: {
  set: PracticeSet;
  attempt: Attempt;
  questions: Question[];
  initialAnswers: AttemptAnswer[];
  /** Markschemes already revealed in this attempt (after a refresh or resume). */
  initialSchemes: Record<string, Markscheme>;
  /** Right options for MCQs when feedback is instant (empty otherwise, or before migration 23). */
  mcqKeys?: Record<string, string>;
  examPaceS: number;
  isPro: boolean;
  /** The subject's formula booklet at the set's level, or null if its exam has none. */
  booklet?: Booklet | null;
  /** Show the one-time "the booklet is here, press B" tip (not dismissed yet). */
  bookletTip?: boolean;
  level: Level;
  /** Syllabus topic names by code ("5" → "Calculus"), for the booklet. */
  topicNames?: Record<string, string>;
}) {
  const router = useRouter();
  const timed = attempt.timed;
  const instantMcq = !timed && set.settings.mcqFeedback === "each";

  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>(() =>
    Object.fromEntries(initialAnswers.map((a) => [a.questionId, a])),
  );
  const [index, setIndex] = useState(() => {
    const first = questions.findIndex((q) => !isAnswered(q, initialAnswers.find((a) => a.questionId === q.id)));
    return first === -1 ? 0 : first;
  });
  const [schemes, setSchemes] = useState<Record<string, Markscheme>>(initialSchemes);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [elapsed, setElapsed] = useState(() => initialAnswers.reduce((s, a) => s + a.timeSpentS, 0));
  const [sheetOpen, setSheetOpen] = useState(false);
  // Reopens if it was left open (closed on the server, which can't see localStorage).
  const leftOpen = useSyncExternalStore(noSubscribe, readBookletOpen, () => false);
  const [bookletChoice, setBookletChoice] = useState<boolean | null>(null);
  const bookletOpen = !!booklet && (bookletChoice ?? leftOpen);
  // With the booklet open, big screens give the page more room so the question keeps its width.
  const rowWidth = bookletOpen ? "max-w-[1200px] xl:max-w-[1440px] 2xl:max-w-[1680px]" : "max-w-[1200px]";
  const { show: showBookletTip, dismiss: dismissBookletTip } = useHintTurn(BOOKLET_TIP_ID, bookletTip);
  const bookletTipDone = useRef(!bookletTip);
  // Chemistry: the booklet's element data as a full-screen periodic table (button or P).
  const hasPeriodicTable = !!booklet?.sections.some((s) => s.periodicTable);
  const [tableOpen, setTableOpen] = useState(false);
  const toggleBooklet = useCallback((open: boolean) => {
    setBookletChoice(open);
    // Opening it (button or B) means they've found it: the tip goes, once.
    if (open && !bookletTipDone.current) {
      bookletTipDone.current = true;
      dismissBookletTip();
    }
    try {
      localStorage.setItem(BOOKLET_OPEN_KEY, open ? "1" : "0");
    } catch {
      // only remembered for this visit
    }
  }, [dismissBookletTip]);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [leaving, setLeaving] = useState<"save" | "delete" | null>(null);
  const [exitError, setExitError] = useState<string | null>(null);
  const [finishing, startFinish] = useTransition();

  // Refs mirror state for the save queue (read only in handlers/timers).
  const answersRef = useRef(answers);
  const timeRef = useRef<Record<string, number>>(Object.fromEntries(initialAnswers.map((a) => [a.questionId, a.timeSpentS])));
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(0);
  const indexRef = useRef(index);

  useBroOverride(timed, BOTTOM_BAR_PX);

  const question = questions[index];
  const answer = answers[question.id];
  const scheme = schemes[question.id] ?? null;

  // ── saving ──────────────────────────────────────────────────────────────
  const send = useCallback(
    async (qid: string): Promise<boolean> => {
      const a = answersRef.current[qid];
      inFlight.current += 1;
      setSaveState("saving");
      try {
        await saveAnswerAction(attempt.id, qid, {
          partAnswers: a.partAnswers,
          selectedOption: a.selectedOption,
          onPaper: a.onPaper,
          tickedPoints: a.tickedPoints,
          criterionMarks: a.criterionMarks,
          flagged: a.flagged,
          timeSpentS: timeRef.current[qid] ?? 0,
        });
        inFlight.current -= 1;
        if (inFlight.current === 0 && pending.current.size === 0) setSaveState("saved");
        return true;
      } catch {
        inFlight.current -= 1;
        setSaveState("error");
        return false;
      }
    },
    [attempt.id],
  );

  const scheduleSave = useCallback(
    (qid: string) => {
      const existing = pending.current.get(qid);
      if (existing) clearTimeout(existing);
      setSaveState("saving");
      pending.current.set(
        qid,
        setTimeout(() => {
          pending.current.delete(qid);
          void send(qid);
        }, SAVE_DELAY_MS),
      );
    },
    [send],
  );

  /** Saves one question right now (skipping the debounce); false if it didn't save. */
  const saveNow = useCallback(
    async (qid: string): Promise<boolean> => {
      const existing = pending.current.get(qid);
      if (existing) clearTimeout(existing);
      pending.current.delete(qid);
      return send(qid);
    },
    [send],
  );

  const flushAll = useCallback(async () => {
    const qids = new Set([...pending.current.keys(), questions[indexRef.current].id]);
    pending.current.forEach((t) => clearTimeout(t));
    pending.current.clear();
    await Promise.all([...qids].map((qid) => send(qid)));
  }, [questions, send]);

  const update = (qid: string, patch: Partial<AttemptAnswer>) => {
    answersRef.current = { ...answersRef.current, [qid]: { ...answersRef.current[qid], ...patch } };
    setAnswers(answersRef.current);
    scheduleSave(qid);
  };

  // Switching to (or from) paper becomes the default for the rest of the
  // set, so students don't have to flip it on every question. Questions
  // already typed into are left alone.
  const setPaperForRest = (onPaper: boolean) => {
    for (const q of questions.slice(index + 1)) {
      const a = answersRef.current[q.id];
      if (q.type === "mcq" || a.onPaper === onPaper) continue;
      if (Object.values(a.partAnswers).some((t) => t.trim() !== "")) continue;
      update(q.id, { onPaper });
    }
  };

  // ── time on the current question (only while the tab is visible) ───────
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const qid = questions[indexRef.current].id;
      timeRef.current[qid] = (timeRef.current[qid] ?? 0) + 1;
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [questions]);

  // Save time spent when leaving the page.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flushAll();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flushAll]);

  // ── markschemes ─────────────────────────────────────────────────────────
  const reveal = useCallback(
    async (qid: string) => {
      setRevealing(qid);
      try {
        const ms = await revealMarkschemeAction(attempt.id, qid);
        setSchemes((s) => ({ ...s, [qid]: ms }));
        answersRef.current = { ...answersRef.current, [qid]: { ...answersRef.current[qid], revealed: true } };
        setAnswers(answersRef.current);
      } finally {
        setRevealing(null);
      }
    },
    [attempt.id],
  );

  // ── navigation ──────────────────────────────────────────────────────────
  const goTo = (next: number) => {
    if (next < 0 || next >= questions.length || next === index) return;
    // Persist time spent on the question we're leaving (it also decides
    // whether an on-paper answer counts as answered).
    update(question.id, { timeSpentS: timeRef.current[question.id] ?? 0 });
    indexRef.current = next;
    setIndex(next);
    setSheetOpen(false);
    setShowSolution(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ← / → move between questions, except while typing an answer.
  const goToRef = useRef(goTo);
  const toggleBookletRef = useRef(() => {});
  const openTableRef = useRef(() => {});
  useEffect(() => {
    goToRef.current = goTo;
    toggleBookletRef.current = () => {
      if (booklet) toggleBooklet(!bookletOpen);
    };
    openTableRef.current = () => {
      if (hasPeriodicTable) setTableOpen(true);
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const booklet = e.key === "b" || e.key === "B";
      const table = e.key === "p" || e.key === "P";
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && !booklet && !table) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      // B opens or closes the formula booklet; P opens the periodic table (Chemistry; P or Esc closes it).
      if (booklet) toggleBookletRef.current();
      else if (table) openTableRef.current();
      else goToRef.current(indexRef.current + (e.key === "ArrowRight" ? 1 : -1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Exit: answers are saved as you go, so leaving keeps the set in "Pick up
  // where you left off"; Delete throws the attempt (and an unsaved set) away.
  const exit = async () => {
    setLeaving("save");
    await flushAll();
    router.push(links.practice());
  };

  const discard = async () => {
    setLeaving("delete");
    setExitError(null);
    pending.current.forEach((t) => clearTimeout(t));
    pending.current.clear();
    try {
      await discardAttemptAction(attempt.id);
      router.push(links.practice());
    } catch {
      setLeaving(null);
      setExitError("Couldn't delete it. Try again.");
    }
  };

  const dotStates: DotState[] = useMemo(
    () =>
      questions.map((q) => {
        const a = answers[q.id];
        if (a?.flagged) return "flagged";
        return isAnswered(q, a) ? "answered" : "unanswered";
      }),
    [questions, answers],
  );
  const unanswered = questions.filter((q) => !isAnswered(q, answers[q.id])).length;
  const marksTotal = questions.reduce((s, q) => s + q.totalMarks, 0);
  const marksAttempted = questions.reduce((s, q) => s + (isAnswered(q, answers[q.id]) ? q.totalMarks : 0), 0);

  const finish = () => {
    setConfirmFinish(false);
    startFinish(async () => {
      await flushAll();
      await finishAttemptAction(attempt.id);
    });
  };

  return (
    // On smaller screens the open booklet covers the lower part, so the question can scroll above it.
    <div className={bookletOpen ? "pb-[calc(60vh+7rem)] lg:pb-28" : "pb-28"}>
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-surface glass border-b border-outline-variant">
        <div className={`${rowWidth} mx-auto px-md h-14 flex items-center gap-md`}>
          <div className="min-w-0 flex-1">
            <p className="font-serif font-bold text-on-surface truncate">{set.title}</p>
          </div>
          <span className="hidden sm:inline text-label-md text-on-surface-variant tabular-nums">
            Question {index + 1} of {questions.length}
          </span>
          <PlayerTimer timed={timed} elapsedS={elapsed} examPaceS={examPaceS} marksAttempted={marksAttempted} marksTotal={marksTotal} />
          <span className="hidden md:inline text-label-sm text-on-surface-variant w-16 text-right" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : "Saved"}
          </span>
          {booklet && (
            <span className="relative">
              <button
                type="button"
                onClick={() => toggleBooklet(!bookletOpen)}
                aria-pressed={bookletOpen}
                aria-keyshortcuts="B"
                title="Formula booklet (B)"
                className={`inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-md font-semibold cursor-pointer ${
                  bookletOpen ? "bg-primary-fixed text-on-primary-fixed" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <BookOpen size={16} aria-hidden="true" /> <span className="hidden sm:inline">Booklet</span>
              </button>
              {showBookletTip && (
                <span
                  role="note"
                  className="absolute right-0 top-full mt-sm z-50 w-72 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl p-md flex flex-col gap-sm"
                >
                  <span aria-hidden="true" className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-inverse-surface" />
                  <span className="font-semibold flex items-center gap-xs">
                    <BookOpen size={16} aria-hidden="true" /> New: your {booklet.title.includes("data") ? "data booklet" : "formula booklet"}
                  </span>
                  <span className="text-label-md opacity-90">
                    Everything the exam booklet gives you, beside the question. Open it here or press <kbd className="rounded bg-inverse-on-surface/15 px-1 font-mono font-semibold">B</kbd> any time.
                  {hasPeriodicTable && (
                    <>
                      {" "}
                      The periodic table opens with <kbd className="rounded bg-inverse-on-surface/15 px-1 font-mono font-semibold">P</kbd>.
                    </>
                  )}
                  </span>
                  <span className="flex justify-end gap-xs">
                    <button
                      type="button"
                      onClick={() => {
                        bookletTipDone.current = true;
                        dismissBookletTip();
                      }}
                      className="rounded-lg px-md py-xs text-label-md font-semibold opacity-90 hover:opacity-100 cursor-pointer">
                      Got it
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBooklet(true)}
                      className="rounded-lg bg-inverse-on-surface/15 px-md py-xs text-label-md font-semibold hover:bg-inverse-on-surface/25 cursor-pointer"
                    >
                      Open it
                    </button>
                  </span>
                </span>
              )}
            </span>
          )}
          {hasPeriodicTable && (
            <button
              type="button"
              onClick={() => setTableOpen(true)}
              aria-keyshortcuts="P"
              title="Periodic table (P)"
              className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <LayoutGrid size={16} aria-hidden="true" /> <span className="hidden sm:inline">Periodic table</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
          >
            <X size={16} aria-hidden="true" /> Exit
          </button>
        </div>
      </div>

      <div className={`${rowWidth} mx-auto px-md pt-lg flex gap-lg`}>
        {/* Navigator rail (desktop) */}
        <aside className="hidden md:block sticky top-36 self-start pt-xs">
          <Navigator states={dotStates} current={index} onJump={goTo} layout="rail" />
        </aside>

        {/* Question */}
        <article className="flex-1 min-w-0 rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
          <header className="flex items-start justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <p className="text-label-md text-on-surface-variant sm:hidden tabular-nums">
                Question {index + 1} of {questions.length}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {paperLabel(question)}
                {question.type === "mcq" ? " · Multiple choice" : question.type === "extended" ? " · Essay" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => update(question.id, { flagged: !answer.flagged })}
              aria-pressed={answer.flagged}
              className={`inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-md font-semibold cursor-pointer ${
                answer.flagged ? "bg-tertiary-container text-on-tertiary-container" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Flag size={14} className={answer.flagged ? "fill-current" : ""} aria-hidden="true" />
              {answer.flagged ? "Flagged" : "Flag"}
            </button>
          </header>

          {question.stemMd && (
            <div className="text-body-lg text-on-surface">
              <MathMarkdown>{question.stemMd}</MathMarkdown>
            </div>
          )}
          <QuestionFigures figures={question.figures} />

          {question.type === "mcq" && question.options ? (
            <div className="flex flex-col gap-md">
              <div className="flex items-start gap-md">
                <div className="flex-1 text-body-lg text-on-surface">
                  <MathMarkdown>{question.parts[0].textMd}</MathMarkdown>
                </div>
                <span className="shrink-0 font-semibold text-on-surface tabular-nums">[{question.totalMarks}]</span>
              </div>
              <McqAnswer
                options={question.options}
                selected={answer.selectedOption}
                correctOption={
                  instantMcq ? (scheme?.correctOption ?? (answer.revealed ? (mcqKeys[question.id] ?? null) : null)) : null
                }
                onSelect={(key) => {
                  const qid = question.id;
                  const known = instantMcq ? mcqKeys[qid] : undefined;
                  // Known answer: right/wrong shows now (the pick locks), and the rest happens in the background.
                  update(qid, known ? { selectedOption: key, revealed: true } : { selectedOption: key });
                  // The server locks an MCQ once its markscheme is opened, so the answer is saved first:
                  // opening it before the save landed would leave the MCQ unanswered.
                  if (instantMcq) {
                    void saveNow(qid).then((saved) => {
                      if (saved) void reveal(qid).catch(() => {});
                    });
                  }
                }}
              />
              {instantMcq && scheme && (
                <div className="flex flex-col gap-sm">
                  <button
                    type="button"
                    onClick={() => setShowSolution((s) => (s === question.id ? null : question.id))}
                    className="self-start inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Lightbulb size={14} aria-hidden="true" /> {showSolution === question.id ? "Hide explanation" : "Explain this"}
                  </button>
                  {showSolution === question.id && (
                    <div className="rounded-xl bg-surface-container-low border border-outline-variant p-md text-body-md text-on-surface">
                      <MathMarkdown>{scheme.workedSolutionMd}</MathMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : question.type === "extended" ? (
            <EssayAnswer key={question.id} question={question} answer={answer} isPro={isPro} onChange={(patch) => update(question.id, patch)} />
          ) : (
            <ShortAnswer
              key={question.id}
              question={question}
              answer={answer}
              markscheme={timed ? null : scheme}
              timed={timed}
              isPro={isPro}
              revealing={revealing === question.id}
              onChange={(patch) => {
                update(question.id, patch);
                if (patch.onPaper !== undefined) setPaperForRest(patch.onPaper);
              }}
              onReveal={() => void reveal(question.id)}
            />
          )}
        </article>

        {booklet && bookletOpen && (
          <BookletPanel booklet={booklet} level={level} topic={topicOfSubtopic(question.subtopicId, Object.keys(topicNames)) ?? ""} topicNames={topicNames} onClose={() => toggleBooklet(false)} />
        )}
      </div>

      {tableOpen && <PeriodicTable onClose={() => setTableOpen(false)} />}

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-surface glass border-t border-outline-variant" style={{ height: BOTTOM_BAR_PX }}>
        <div className={`${rowWidth} mx-auto h-full px-md flex items-center gap-sm`}>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft size={16} aria-hidden="true" /> Previous
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="md:hidden inline-flex items-center gap-xs rounded-lg px-sm py-sm text-label-md font-semibold text-on-surface-variant cursor-pointer"
            aria-label="All questions"
          >
            <LayoutGrid size={16} aria-hidden="true" /> {index + 1}/{questions.length}
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === questions.length - 1}
            className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => (unanswered > 0 ? setConfirmFinish(true) : finish())}
            disabled={finishing}
            className="ml-auto rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {finishing ? "Finishing…" : "Finish set"}
          </button>
        </div>
      </div>

      {/* Navigator sheet (mobile) */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-scrim/40" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-label="All questions" className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-surface-raised glass border-t border-outline-variant p-lg pb-xl">
            <div className="flex items-center justify-between mb-md">
              <p className="font-serif font-bold text-on-surface">Questions</p>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close" className="text-on-surface-variant cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <Navigator states={dotStates} current={index} onJump={goTo} layout="grid" />
          </div>
        </div>
      )}

      {/* Finish with unanswered questions */}
      {confirmFinish && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-scrim/40" onClick={() => setConfirmFinish(false)} aria-hidden="true" />
          <div role="alertdialog" aria-label="Finish set?" className="relative w-full max-w-100 rounded-2xl bg-surface-raised glass border border-outline-variant shadow-xl p-lg flex flex-col gap-md">
            <p className="font-serif font-bold text-headline-md text-on-surface">Finish the set?</p>
            <p className="text-body-md text-on-surface-variant">
              {unanswered === 1 ? "1 question is" : `${unanswered} questions are`} still unanswered. They&apos;ll count as no marks.
            </p>
            <div className="flex justify-end gap-sm">
              <button type="button" onClick={() => setConfirmFinish(false)} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
                Keep going
              </button>
              <button type="button" onClick={finish} className="rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer">
                Finish anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit mid-set: save for later or delete */}
      {confirmExit && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-scrim/40" onClick={() => !leaving && setConfirmExit(false)} aria-hidden="true" />
          <div role="alertdialog" aria-label="Leave the set?" className="relative w-full max-w-110 rounded-2xl bg-surface-raised glass border border-outline-variant shadow-xl p-lg flex flex-col gap-md">
            <p className="font-serif font-bold text-headline-md text-on-surface">Leave the set?</p>
            <p className="text-body-md text-on-surface-variant">
              Your answers are saved. Carry on later from &ldquo;Pick up where you left off&rdquo; on Practice or the Hub, or delete this set.
            </p>
            {exitError && <p className="text-label-sm text-error">{exitError}</p>}
            <div className="flex flex-wrap items-center gap-sm">
              <button
                type="button"
                onClick={discard}
                disabled={!!leaving}
                className="mr-auto rounded-lg px-md py-sm text-label-md font-semibold text-error hover:bg-error-container disabled:opacity-60 cursor-pointer"
              >
                {leaving === "delete" ? "Deleting…" : "Delete set"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                disabled={!!leaving}
                className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={exit}
                disabled={!!leaving}
                className="rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
              >
                {leaving === "save" ? "Saving…" : "Save and exit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <noscript>
        <p className="text-center text-on-surface-variant">
          The player needs JavaScript. <Link href={links.practice()}>Back to practice</Link>
        </p>
      </noscript>
    </div>
  );
}

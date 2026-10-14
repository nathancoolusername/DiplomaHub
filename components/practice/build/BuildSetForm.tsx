"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, CalendarPlus, FolderOpen, KeyRound, Loader2, Play, Share2, Sparkles, WandSparkles } from "lucide-react";
import type { BuildSettings, PaperCode, PracticeSet, PracticeType, SetPreview, StrengthMap, Subject, Suggestion } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { goAction, previewSetAction, rebuildSetAction, renameSetAction, saveBuiltSetAction, scheduleSetAction, shareSetAction, unsaveSetAction } from "@/app/practice/actions";
import { BroAvatar } from "@/components/shared/BroAvatar";
import { Dialog } from "@/components/shared/Dialog";
import { ProGate } from "@/components/shared/ProUpsell";
import { Segmented } from "@/components/shared/Segmented";
import { Switch } from "@/components/shared/Switch";
import { EnterCodeDialog, MySetsDialog, ShareDialog } from "./SetDialogs";
import { TopicPicker } from "./TopicPicker";
import { ScheduleDialog, suggestMinutes } from "./ScheduleDialog";
import { DeleteSetButton } from "@/components/practice/sets/DeleteSetButton";

type DialogKind = "mysets" | "code" | "share" | "limit" | "schedule" | null;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-label-md font-semibold text-on-surface">{label}</span>
      {children}
      {hint && <span className="text-label-sm text-on-surface-variant">{hint}</span>}
    </div>
  );
}

// Science Paper 1 is sat as two sections; say what each one is.
const PAPER_SECTION: Partial<Record<PaperCode, string>> = { P1A: "Multiple choice", P1B: "Data-based questions" };

const outlineBtn =
  "inline-flex items-center gap-xs rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-50 cursor-pointer";

export function BuildSetForm({
  subject,
  practiceType,
  map,
  initialTopics,
  weakIds,
  isPro,
  writtenRemaining,
  suggestion,
  savedSets,
  editing = null,
}: {
  /** One of your sets opened here to change it (?set=<id>). */
  editing?: { setId: string; title: string; locked: boolean; settings: BuildSettings } | null;
  subject: Subject;
  practiceType: PracticeType;
  map: StrengthMap;
  initialTopics: string[];
  weakIds: string[];
  isPro: boolean;
  /** Free students' written questions left this week; null for Pro. */
  writtenRemaining: number | null;
  suggestion: Suggestion | null;
  savedSets: PracticeSet[];
}) {
  const level = map.level;
  const papers = subject.papers.filter((p) => p.duration[level] !== undefined);
  const isMock = practiceType === "mock";
  const isEssay = practiceType === "essay";
  const isMcqShort = practiceType === "mcq_short";
  const calculatorMatters = subject.ibGroup === 4 || subject.ibGroup === 5;

  const [s, setS] = useState<BuildSettings>(() => editing?.settings ?? ({
    subtopicIds: initialTopics,
    questionType: "mix",
    count: isEssay ? 1 : 10,
    difficulty: "exam",
    paper: isMock ? (papers[0]?.code ?? "P1") : null,
    calculator: true,
    includeHl: level === "HL",
    timer: isMock ? "exam_pace" : "off",
    mcqFeedback: "each",
    answerOn: "screen",
  }));
  // Editing: what's saved now, to tell whether there are changes.
  const [baseline, setBaseline] = useState(() => (editing ? { key: JSON.stringify(editing.settings), title: editing.title } : null));
  const set = (patch: Partial<BuildSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const [customCount, setCustomCount] = useState(false);

  // ── live preview (debounced) ────────────────────────────────────────────
  // The last result stays on screen while a new one loads; it only fades if
  // the refresh is slow, so toggling options doesn't make anything flash.
  const [preview, setPreview] = useState<SetPreview | null>(null);
  const [stale, setStale] = useState(false);
  const requestId = useRef(0);
  useEffect(() => {
    const id = ++requestId.current;
    const fade = setTimeout(() => setStale(true), 500);
    const t = setTimeout(async () => {
      const p = await previewSetAction(subject.id, practiceType, s);
      if (id === requestId.current) {
        clearTimeout(fade);
        setPreview(p);
        setStale(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      clearTimeout(fade);
    };
  }, [s, subject.id, practiceType]);

  // ── actions ─────────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  // The set last saved from these exact settings, so Save then Share doesn't make two copies.
  const [savedFor, setSavedFor] = useState<{ key: string; setId: string; title: string } | null>(null);
  const settingsKey = JSON.stringify(s);
  const [share, setShare] = useState<{ code: string; title: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // Optional name; blank keeps the built-in title ("Maths AA · Calculus", etc.).
  const [name, setName] = useState(editing?.title ?? "");
  const dirty = !!baseline && (settingsKey !== baseline.key || (name.trim() || baseline.title) !== baseline.title);
  const [scheduling, startSchedule] = useTransition();
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition(); // save / share
  const [going, startGo] = useTransition(); // Go only, so other actions never flash it
  const router = useRouter();

  /** Editing: save new settings and name into the set (keeps questions that still fit). */
  const saveChanges = async () => {
    if (!editing || !dirty) return;
    await rebuildSetAction(editing.setId, s, name.trim() || null);
    setBaseline({ key: settingsKey, title: name.trim() || editing.title });
  };

  const go = (cut = false) => {
    setError(null);
    if (editing) {
      startGo(async () => {
        try {
          if (dirty && !editing.locked) await rebuildSetAction(editing.setId, s, name.trim() || null, true);
          else router.push(links.play(editing.setId));
        } catch (e) {
          unstable_rethrow(e);
          setError(e instanceof Error ? e.message : "Couldn't start the set");
        }
      });
      return;
    }
    if (!cut && writtenRemaining !== null && preview && preview.writtenInSet > writtenRemaining) {
      setDialog("limit");
      return;
    }
    startGo(async () => {
      try {
        await goAction(subject.id, practiceType, s, cut, name.trim() || null);
      } catch (e) {
        // goAction opens the player with redirect(), which throws; let Next handle it.
        unstable_rethrow(e);
        setError(e instanceof Error ? e.message : "Couldn't build the set");
      }
    });
  };

  const isSaved = savedFor?.key === settingsKey;

  /** Save, or (when already saved) take it back out of My sets. */
  const toggleSave = () =>
    start(async () => {
      try {
        if (isSaved && savedFor) {
          await unsaveSetAction(savedFor.setId);
          setSavedFor(null);
          setSavedTitle(null);
        } else {
          const r = await saveBuiltSetAction(subject.id, practiceType, s, name.trim() || null);
          setSavedFor({ key: settingsKey, ...r });
          setSavedTitle(r.title);
        }
        router.refresh(); // keep My sets in step
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save the set");
      }
    });

  const doShare = () =>
    start(async () => {
      try {
        if (editing) {
          await saveChanges();
          setShare({ code: await shareSetAction(editing.setId), title: name.trim() || editing.title });
          router.refresh();
          setDialog("share");
          return;
        }
        const r = savedFor?.key === settingsKey ? savedFor : await saveBuiltSetAction(subject.id, practiceType, s, name.trim() || null);
        setSavedFor({ key: settingsKey, setId: r.setId, title: r.title });
        setShare({ code: await shareSetAction(r.setId), title: r.title });
        router.refresh();
        setDialog("share");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't share the set");
      }
    });

  const saveEdits = () =>
    start(async () => {
      setError(null);
      try {
        await saveChanges();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save the changes");
      }
    });

  /** Renaming after saving renames the saved set too (editing saves the name with Save changes). */
  const renameSaved = () => {
    if (editing) return;
    const clean = name.trim();
    if (!isSaved || !savedFor || !clean || clean === savedFor.title) return;
    start(async () => {
      try {
        await renameSetAction(savedFor.setId, clean);
        setSavedFor({ ...savedFor, title: clean });
        setSavedTitle(clean);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't rename the set");
      }
    });
  };

  const schedule = (slot: { title: string; startAt: string; endAt: string }) => {
    setScheduleError(null);
    startSchedule(async () => {
      try {
        if (editing) await saveChanges();
        const reuse = editing ? editing.setId : savedFor?.key === settingsKey ? savedFor.setId : null;
        const r = await scheduleSetAction(subject.id, practiceType, s, slot, reuse, name.trim() || null);
        if (!reuse && !editing) setSavedFor({ key: settingsKey, setId: r.setId, title: name.trim() || r.title });
        const when = new Date(slot.startAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        setScheduled(`Scheduled “${r.title}” for ${when}. It's on your Hub with a Start button.`);
        setDialog(null);
        router.refresh();
      } catch (e) {
        setScheduleError(e instanceof Error ? e.message : "Couldn't schedule the set");
      }
    });
  };

  const auto = () => {
    if (suggestion?.action?.type !== "practice") return;
    set({ subtopicIds: suggestion.action.subtopicIds, count: 10, difficulty: "exam" });
    setNote("Bro picked the topics. Change anything before you hit Go.");
  };

  const choosePaper = (paper: PaperCode | null) => {
    const spec = papers.find((p) => p.code === paper);
    set({ paper, ...(spec ? { calculator: spec.calculator } : {}) });
  };

  // ── bank status messages ───────────────────────────────────────────────
  const wanted = isMock ? null : s.count;
  const empty = preview !== null && preview.matching === 0;
  const allDone = preview !== null && preview.matching > 0 && preview.unseen === 0;
  const short = preview !== null && wanted !== null && preview.matching > 0 && preview.setSize < wanted;
  const showGenerate = (empty || allDone || short) && !isMock;
  const mockMarks = isMock ? papers.find((p) => p.code === s.paper)?.totalMarks[level] : undefined;

  return (
    <div className="flex flex-col gap-lg pb-xl">
      {editing && (
        <div className="rounded-2xl bg-surface-container-low px-lg py-md flex flex-wrap items-center gap-md">
          <p className="flex-1 min-w-0 text-body-md text-on-surface">
            {editing.locked
              ? "You've started this set. Finish or delete that attempt before changing its settings."
              : "Change anything below, then Save changes. Questions that still fit are kept; the rest are swapped or topped up."}
          </p>
          <Link href={links.setQuestions(editing.setId)} className="text-label-md font-semibold text-primary hover:underline">
            Reorder or remove questions
          </Link>
          <Link href={links.build(subject.id, practiceType)} className="text-label-md font-semibold text-on-surface-variant hover:text-primary">
            Build a new set instead
          </Link>
        </div>
      )}
      {/* Bro row (Pro) */}
      {isPro && suggestion && (
        <div className="rounded-2xl bg-surface-container-lowest px-lg py-md flex flex-wrap md:flex-nowrap items-center gap-md">
          <BroAvatar size={32} />
          <p className="flex-1 min-w-0 text-body-md text-on-surface">{suggestion.text}</p>
          <button type="button" onClick={auto} className="shrink-0 inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer">
            <WandSparkles size={14} aria-hidden="true" /> Auto
          </button>
        </div>
      )}
      {note && <p className="-mt-sm text-label-md text-on-surface-variant">{note}</p>}

      {/* Form */}
      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-xl">
        {!isMock ? (
          <Field label="Topics">
            <TopicPicker map={map} selected={s.subtopicIds} onChange={(subtopicIds) => set({ subtopicIds })} includeHl={s.includeHl} weakIds={weakIds} />
          </Field>
        ) : (
          <Field
            label="Paper"
            hint={
              papers.some((p) => p.code === "P1A")
                ? "A full paper at exam pace. In the exam, 1A and 1B are one sitting. Markschemes unlock when you finish."
                : "A full paper at exam pace. Markschemes unlock when you finish."
            }
          >
            <div className="flex flex-col gap-sm">
              {papers.map((p) => (
                <label
                  key={p.code}
                  className={`flex items-center gap-md rounded-xl border-2 px-md py-sm cursor-pointer ${
                    s.paper === p.code ? "border-primary bg-primary-fixed" : "border-outline-variant hover:border-primary"
                  }`}
                >
                  <input type="radio" name="paper" checked={s.paper === p.code} onChange={() => choosePaper(p.code)} className="accent-[var(--color-primary)]" />
                  <span className="flex-1 font-semibold text-on-surface">
                    Paper {p.code.slice(1)}
                    {PAPER_SECTION[p.code] && <span className="ml-sm font-normal text-label-md text-on-surface-variant">{PAPER_SECTION[p.code]}</span>}
                  </span>
                  <span className="text-label-md text-on-surface-variant tabular-nums">
                    {p.duration[level]} min · {p.totalMarks[level]} marks · {p.calculator ? "calculator" : "no calculator"}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        )}

        <div className="flex flex-col gap-lg">
          {isMcqShort && (
            <Field label="Question type">
              <Segmented
                label="Question type"
                value={s.questionType}
                onChange={(questionType) => set({ questionType })}
                options={[
                  { value: "mcq", label: "MCQ" },
                  { value: "short", label: "Short answer" },
                  { value: "mix", label: "Mix" },
                ]}
              />
            </Field>
          )}

          {!isMock && (
            <Field label={isEssay ? "Number of prompts" : "Number of questions"}>
              <div className="flex flex-wrap items-center gap-sm">
                <Segmented
                  label="Number of questions"
                  value={customCount ? "custom" : String(s.count)}
                  onChange={(v) => {
                    if (v === "custom") setCustomCount(true);
                    else {
                      setCustomCount(false);
                      set({ count: Number(v) });
                    }
                  }}
                  options={
                    isEssay
                      ? [1, 2, 3].map((n) => ({ value: String(n), label: String(n) }))
                      : [
                          ...[5, 10, 20].map((n) => ({ value: String(n), label: String(n) })),
                          { value: "custom", label: "Custom" },
                        ]
                  }
                />
                {customCount && (
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={s.count}
                    onChange={(e) => set({ count: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                    aria-label="Custom number of questions"
                    className="w-20 rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface tabular-nums"
                  />
                )}
              </div>
            </Field>
          )}

          {!isMock && (
            <Field label="Difficulty">
              <Segmented
                label="Difficulty"
                value={s.difficulty}
                onChange={(difficulty) => set({ difficulty })}
                options={[
                  { value: "easier", label: "Easier" },
                  { value: "exam", label: "Exam level" },
                  { value: "harder", label: "Harder" },
                  { value: "mixed", label: "Mixed" },
                ]}
              />
            </Field>
          )}

          {isMcqShort && s.questionType !== "mcq" && papers.length > 1 && (
            <Field label="Paper">
              <Segmented
                label="Paper"
                value={s.paper ?? "any"}
                onChange={(v) => choosePaper(v === "any" ? null : (v as PaperCode))}
                options={[{ value: "any", label: "Any" }, ...papers.map((p) => ({ value: p.code, label: `Paper ${p.code.slice(1)}` }))]}
              />
            </Field>
          )}

          <div className="flex flex-col gap-sm">
            {calculatorMatters && !isMock && (
              <Switch
                checked={s.calculator}
                onChange={(calculator) => set({ calculator })}
                label={s.calculator ? "Calculator allowed" : "No calculator"}
              />
            )}
            {level === "HL" && !isMock && <Switch checked={s.includeHl} onChange={(includeHl) => set({ includeHl })} label="Include HL-only content" />}
            {!isMock && (
              <Switch
                checked={s.timer === "exam_pace"}
                onChange={(on) => set({ timer: on ? "exam_pace" : "off" })}
                label="Timer at exam pace"
              />
            )}
          </div>

          {isMcqShort && s.questionType !== "short" && (
            <Field label="MCQ feedback" hint={s.timer === "exam_pace" ? "Timed sets show feedback at the end, like the exam." : undefined}>
              <Segmented
                label="MCQ feedback"
                value={s.timer === "exam_pace" ? "end" : s.mcqFeedback}
                onChange={(mcqFeedback) => set({ mcqFeedback })}
                options={[
                  { value: "each", label: "After each question", disabled: s.timer === "exam_pace" },
                  { value: "end", label: "At the end" },
                ]}
              />
            </Field>
          )}

          <Field label="Answer on" hint={s.answerOn === "paper" ? "The player starts in “answering on paper”. Printable PDFs come in phase 5." : undefined}>
            <Segmented
              label="Answer on"
              value={s.answerOn}
              onChange={(answerOn) => set({ answerOn })}
              options={[
                { value: "screen", label: "Screen" },
                { value: "paper", label: "Paper" },
              ]}
            />
          </Field>
        </div>
      </div>

      {/* Preview + bank status */}
      <div className="flex flex-col gap-sm" aria-live="polite">
        <p className={`text-body-md text-on-surface min-h-6 transition-opacity duration-300 ${stale ? "opacity-50" : "opacity-100"}`}>
          {preview &&
            (empty ? (
              <span className="text-on-surface-variant">No questions match these settings yet.</span>
            ) : (
              <span>
                <span className="font-semibold">
                  This set: {preview.setSize} {preview.setSize === 1 ? "question" : "questions"} · {preview.marksInSet} {preview.marksInSet === 1 ? "mark" : "marks"}
                </span>
                <span className="text-on-surface-variant">
                  {" "}
                  · {preview.matching} match, {preview.unseen} new to you
                </span>
              </span>
            ))}
        </p>
        {preview && isMock && mockMarks !== undefined && preview.marksInSet < mockMarks && !empty && (
          <p className="text-label-md text-on-surface-variant">
            A full Paper {s.paper?.slice(1)} is {mockMarks} marks; the bank has {preview.marksInSet} so far, so this mock is shorter than the real thing.
          </p>
        )}
        {preview && allDone && !isPro && (
          <p className="text-label-md text-on-surface-variant">You&apos;ve done every question for these topics. Go will start with the ones you got wrong.</p>
        )}
        {preview && short && !allDone && (
          <p className="text-label-md text-on-surface-variant">
            Only {preview.matching} {preview.matching === 1 ? "question matches" : "questions match"}, so the set will be shorter than {wanted}.
          </p>
        )}
        {showGenerate && isPro && (
          <button
            type="button"
            disabled
            title="Generating new questions arrives with DiplomaBro"
            className="self-start inline-flex items-center gap-xs rounded-lg border border-outline-variant text-on-surface-variant px-md py-xs text-label-md font-semibold opacity-60 cursor-not-allowed"
          >
            <Sparkles size={14} aria-hidden="true" /> Generate more (coming soon)
          </button>
        )}
      </div>

      {/* Action row */}
      <div className="sticky bottom-0 z-20 -mx-md px-md py-md bg-surface glass border-t border-outline-variant flex flex-wrap items-center gap-sm">
        <input
          type="text"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          onBlur={renameSaved}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="Name this set (optional)"
          aria-label="Set name"
          className="w-full sm:w-56 rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface"
        />
        <button type="button" onClick={() => setDialog("mysets")} className={outlineBtn}>
          <FolderOpen size={14} aria-hidden="true" /> My sets
        </button>
        {editing ? (
          <button type="button" onClick={saveEdits} disabled={busy || !dirty || editing.locked} className={outlineBtn}>
            <BookmarkCheck size={14} aria-hidden="true" /> {dirty ? "Save changes" : "Saved"}
          </button>
        ) : (
        <button
          type="button"
          onClick={toggleSave}
          disabled={busy || (empty && !isSaved)}
          aria-pressed={isSaved}
          title={isSaved ? "Remove from My sets" : undefined}
          className={isSaved ? `${outlineBtn} !border-primary text-primary` : outlineBtn}
        >
          {isSaved ? <BookmarkCheck size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />} {isSaved ? "Saved" : "Save"}
        </button>
        )}
        <button type="button" onClick={doShare} disabled={busy || (empty && !editing) || (dirty && !!editing?.locked)} className={outlineBtn}>
          <Share2 size={14} aria-hidden="true" /> Share
        </button>
        <button type="button" onClick={() => setDialog("code")} className={outlineBtn}>
          <KeyRound size={14} aria-hidden="true" /> Enter a code
        </button>
        <ProGate
          isPro={isPro}
          feature="Scheduling"
          onClick={() => {
            setScheduleError(null);
            setDialog("schedule");
          }}
          className={outlineBtn}
        >
          <CalendarPlus size={14} aria-hidden="true" /> Schedule
        </ProGate>
        {editing && <DeleteSetButton setId={editing.setId} title={baseline?.title ?? editing.title} variant="button" afterHref={links.build(subject.id, practiceType)} />}
        <button
          type="button"
          onClick={() => go()}
          disabled={going || (empty && !editing)}
          className="ml-auto inline-flex items-center gap-sm rounded-xl bg-primary text-on-primary px-xl py-sm text-body-md font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {going ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{" "}
          {editing?.locked ? "Resume" : "Go"}
        </button>
        {(error || scheduled || (editing && dirty) || (isSaved && savedTitle)) && (
          <p className={`w-full text-label-md ${error ? "text-error" : "text-on-surface-variant"}`}>
            {error ??
              scheduled ??
              (editing && dirty
                ? editing.locked
                  ? "These changes can't be saved until you finish or delete your attempt."
                  : "Unsaved changes. Go saves them first."
                : `Saved “${savedTitle}” to My sets. Click Saved again to remove it.`)}
          </p>
        )}
      </div>

      {dialog === "mysets" && <MySetsDialog sets={savedSets} onClose={() => setDialog(null)} onEnterCode={() => setDialog("code")} />}
      {dialog === "code" && <EnterCodeDialog onClose={() => setDialog(null)} />}
      {dialog === "share" && share && <ShareDialog code={share.code} title={share.title} onClose={() => setDialog(null)} />}
      {dialog === "schedule" && (
        <ScheduleDialog
          defaultTitle={name.trim() || (isSaved && savedFor ? savedFor.title : `${subject.shortName} practice`)}
          suggestedMinutes={suggestMinutes(preview?.marksInSet)}
          busy={scheduling}
          error={scheduleError}
          onClose={() => setDialog(null)}
          onSchedule={schedule}
        />
      )}
      {dialog === "limit" && preview && writtenRemaining !== null && (
        <Dialog
          title="Weekly limit"
          onClose={() => setDialog(null)}
          width="max-w-110"
          footer={
            <>
              <Link href={links.plans()} className="rounded-lg px-md py-sm text-label-md font-semibold text-primary hover:underline">
                Get DiplomaPro
              </Link>
              <button
                type="button"
                disabled={writtenRemaining === 0 || going}
                onClick={() => {
                  setDialog(null);
                  go(true);
                }}
                className="rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                Cut to {writtenRemaining}
              </button>
            </>
          }
        >
          <p className="text-body-md text-on-surface">
            {writtenRemaining === 0
              ? `You've used this week's free written questions; this set has ${preview.writtenInSet}. MCQs are always unlimited.`
              : `You have ${writtenRemaining} written ${writtenRemaining === 1 ? "question" : "questions"} left this week; this set has ${preview.writtenInSet}.`}
          </p>
          <p className="mt-sm text-label-md text-on-surface-variant">Saving and sharing still work.</p>
        </Dialog>
      )}
    </div>
  );
}

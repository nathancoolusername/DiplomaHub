"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Gauge, ListChecks, Sparkles } from "lucide-react";
import type { CalendarItemKind, ExamSession, Subject } from "@/lib/data/types";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { Segmented } from "@/components/shared/Segmented";
import { Switch } from "@/components/shared/Switch";
import { SubjectPicker, type SubjectPick } from "@/components/practice/SubjectPicker";
import { links } from "@/lib/practice/links";
import { HUB_SESSION_OVERRIDE_KEY_PREFIX, sessionIdFromLabel } from "@/lib/exam-sessions";
import { useMarkOnboardingOpen } from "@/components/shared/onboarding-open";

type Row = SubjectPick;

const STEPS = ["Welcome", "Exam session", "Subjects", "Next test", "Done"] as const;

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const primary =
  "inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer";
const ghost = "inline-flex items-center gap-xs rounded-lg px-md py-sm font-semibold text-on-surface-variant hover:text-primary cursor-pointer";
const field = "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md text-on-surface";

/**
 * Shown once to everyone new to this version of DiplomaHub: exam session,
 * six subjects with HL/SL, and the next test (optional, nudged), so the
 * countdown, subject boxes and strength maps are real from day one.
 */
export function OnboardingWizard({
  firstName,
  sessions,
  currentSessionId,
  userId = null,
  initialSubjects,
  catalog,
  practiceIds = null,
}: {
  firstName: string;
  sessions: ExamSession[];
  currentSessionId: string | null;
  /** Set when no session is saved yet: the session this student picked in the Hub on this device is used. */
  userId?: string | null;
  /** Six starting rows: current core subjects, else the Hub's picks, topped up. */
  initialSubjects: Row[];
  catalog: Subject[];
  practiceIds?: string[] | null;
}) {
  useMarkOnboardingOpen();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(currentSessionId ?? sessions[0]?.id ?? "");
  // A session picked in the Hub on this device (before it was saved to the account) wins over the year's default.
  // Read after mount: localStorage doesn't exist on the server. Deferred like the Hub does it.
  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(() => {
      try {
        const id = sessionIdFromLabel(localStorage.getItem(HUB_SESSION_OVERRIDE_KEY_PREFIX + userId));
        if (id && sessions.some((s) => s.id === id)) setSessionId(id);
      } catch {
        // no local copy: keep the default
      }
    }, 0);
    return () => clearTimeout(t);
  }, [userId, sessions]);
  const [rows, setRows] = useState<Row[]>(initialSubjects);
  const [test, setTest] = useState({ title: "", subjectId: initialSubjects[0]?.subjectId ?? "", kind: "test" as CalendarItemKind, date: inDays(7), hasTimer: true });
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();

  const nameOf = (id: string) => rows.find((r) => r.subjectId === id)?.name ?? catalog.find((s) => s.id === id)?.shortName ?? id;

  // Saves, then stays on this page or opens Practice. Nothing is started for them.
  const finish = (then: "stay" | "practice") =>
    start(async () => {
      setError(null);
      try {
        await completeOnboardingAction({
          examSessionId: sessionId,
          subjects: rows,
          nextTest: test.title.trim() ? { ...test, subjectId: test.subjectId || null } : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        if (then === "practice") router.push(links.practice());
        else router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      }
    });

  const canNext = step !== 2 || rows.length === 6;

  return (
    <div className="fixed inset-0 z-[90] bg-background overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="min-h-full flex items-center justify-center px-md py-xl">
        <div className="w-full max-w-160 flex flex-col gap-lg">
          {/* Progress */}
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
              <span>
                Step {step + 1} of {STEPS.length} · {STEPS[step]}
              </span>
            </div>
            <div className="h-1 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
            {step === 0 && (
              <>
                <h1 id="onboarding-title" className="font-serif font-bold text-headline-lg text-on-surface">
                  Welcome to the new DiplomaHub, {firstName}
                </h1>
                <p className="text-body-lg text-on-surface-variant">Three quick questions and your Home is set up around you.</p>
                <ul className="grid sm:grid-cols-3 gap-md">
                  {[
                    { icon: <ListChecks size={18} />, title: "Practice", body: "IB-style questions, marked like the markscheme." },
                    { icon: <Gauge size={18} />, title: "Strength maps", body: "See every topic's level fill in as you practise." },
                    { icon: <CalendarDays size={18} />, title: "Countdowns", body: "Home counts down to your next test." },
                  ].map((f) => (
                    <li key={f.title} className="rounded-xl bg-surface-container-low p-md flex flex-col gap-xs">
                      <span className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
                        {f.icon}
                      </span>
                      <span className="font-semibold text-on-surface">{f.title}</span>
                      <span className="text-label-md text-on-surface-variant">{f.body}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {step === 1 && (
              <>
                <h1 id="onboarding-title" className="font-serif font-bold text-headline-md text-on-surface">
                  When are your final exams?
                </h1>
                <div className="flex flex-col gap-sm" role="radiogroup" aria-label="Exam session">
                  {sessions.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-md rounded-xl border-2 px-md py-sm cursor-pointer ${
                        sessionId === s.id ? "border-primary bg-primary-fixed" : "border-outline-variant hover:border-primary"
                      }`}
                    >
                      <input type="radio" name="session" checked={sessionId === s.id} onChange={() => setSessionId(s.id)} className="accent-[var(--color-primary)]" />
                      <span className="flex-1 font-semibold text-on-surface">{s.label}</span>
                      <span className="text-label-md text-on-surface-variant">
                        from {new Date(s.firstExamDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 id="onboarding-title" className="font-serif font-bold text-headline-md text-on-surface">
                  Your six subjects
                </h1>
                <p className="text-body-md text-on-surface-variant -mt-sm">
                  Pick the six you take, then HL or SL for each. You can add extra classes later on the Practice page.
                </p>
                <SubjectPicker catalog={catalog} value={rows} onChange={setRows} max={6} practiceIds={practiceIds} />
              </>
            )}

            {step === 3 && (
              <>
                <h1 id="onboarding-title" className="font-serif font-bold text-headline-md text-on-surface">
                  What&apos;s your next test?
                </h1>
                <p className="text-body-md text-on-surface-variant -mt-sm">Home will count down to it and suggest what to practise. You can skip this.</p>
                <div className="flex flex-col gap-md">
                  <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
                    Name
                    <input
                      value={test.title}
                      onChange={(e) => setTest({ ...test, title: e.target.value })}
                      placeholder="e.g. Maths test: Calculus"
                      maxLength={120}
                      className={field}
                    />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-md">
                    <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
                      Subject
                      <select value={test.subjectId} onChange={(e) => setTest({ ...test, subjectId: e.target.value })} className={field}>
                        {rows.map((r) => (
                          <option key={r.subjectId} value={r.subjectId}>
                            {nameOf(r.subjectId)}
                          </option>
                        ))}
                        <option value="">No subject</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
                      Date
                      <input type="date" value={test.date} min={inDays(0)} onChange={(e) => setTest({ ...test, date: e.target.value })} className={field} />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <Segmented
                      label="Kind"
                      value={test.kind}
                      onChange={(kind) => setTest({ ...test, kind })}
                      options={[
                        { value: "test", label: "Test" },
                        { value: "mock", label: "Mock" },
                        { value: "deadline", label: "Deadline" },
                      ]}
                    />
                    <Switch checked={test.hasTimer} onChange={(hasTimer) => setTest({ ...test, hasTimer })} label="Show a countdown on Home" />
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 id="onboarding-title" className="font-serif font-bold text-headline-md text-on-surface flex items-center gap-sm">
                  <Sparkles size={22} className="text-primary" aria-hidden="true" /> You&apos;re set up
                </h1>
                <p className="text-body-lg text-on-surface-variant">
                  Start wherever you like: in Practice, pick any subject and build a set on the topics you want. Your strength map fills in as you go.
                </p>
                {error && <p className="text-label-md text-error">{error}</p>}
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-sm">
            {step > 0 && step < 4 && (
              <button type="button" onClick={() => setStep(step - 1)} className={ghost}>
                <ArrowLeft size={16} aria-hidden="true" /> Back
              </button>
            )}
            <div className="ml-auto flex items-center gap-sm">
              {step === 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setTest({ ...test, title: "" });
                    setStep(4);
                  }}
                  className={ghost}
                >
                  Skip
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext} className={primary}>
                  {step === 2 && rows.length !== 6 ? `Pick ${6 - rows.length} more` : step === 0 ? "Get started" : "Next"} <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => finish("practice")} disabled={saving} className={ghost}>
                    Open Practice
                  </button>
                  <button type="button" onClick={() => finish("stay")} disabled={saving} className={primary}>
                    {saving ? "Saving…" : "Done"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

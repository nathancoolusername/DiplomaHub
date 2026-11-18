import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { WeeklyReset } from "@/lib/data";
import { ResetFlow } from "@/components/reset/ResetFlow";
import { ResetBanner } from "@/components/reset/ResetBanner";

export const metadata: Metadata = { title: "Sunday Reset (dev)", robots: { index: false } };

const DAY = 86_400_000;

// Dev-only: the Sunday Reset with a sample student's week, no sign-in or
// saving. Shows the banner as it looks on a Sunday, then the page.
export default function ResetPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  // eslint-disable-next-line react-hooks/purity -- dev demo, rendered once
  const now = Date.now();
  const at = (days: number, hour: number) => {
    const d = new Date(now + days * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const sunday = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const data: WeeklyReset = {
    lastWeek: {
      answered: 46,
      accuracy: 0.64,
      wonBack: 9,
      sets: [
        { title: "Waves and oscillations", scorePct: 58 },
        { title: "Elasticity mix", scorePct: 71 },
        { title: "Integration practice", scorePct: 66 },
      ],
      lost: [
        { subjectId: "physics", subjectName: "Physics", subtopicCode: "C.1", name: "Simple harmonic motion", lost: 7, possible: 15 },
        { subjectId: "economics", subjectName: "Economics", subtopicCode: "2.4", name: "Price elasticity of demand", lost: 5, possible: 14 },
        { subjectId: "math_aa", subjectName: "Maths AA", subtopicCode: "5.10", name: "Integration by substitution", lost: 3, possible: 12 },
      ],
      results: [
        { id: "r1", subjectId: "history", title: "History essay", kind: "test", takenOn: new Date(now - 3 * DAY).toISOString().slice(0, 10), grade: 6, marks: null, maxMarks: null, percent: null, hubItemId: null, note: null, source: "student" },
      ],
      toLog: [{ hubItemId: "itm-x", title: "Chemistry test", subjectId: "chemistry", kind: "test", date: new Date(now - 2 * DAY).toISOString().slice(0, 10) }],
    },
    thisWeek: [
      { id: "a", title: "Physics test: waves", kind: "test", subjectId: "physics", startsAt: at(4, 9), isDeadline: false, hasTimer: true, setId: null },
      { id: "b", title: "Economics IA draft", kind: "deadline", subjectId: "economics", startsAt: at(5, 23), isDeadline: true, hasTimer: false, setId: null },
    ],
    plan: [
      { subjectId: "physics", subjectName: "Physics", subtopicIds: ["C.1"], title: "Simple harmonic motion", reason: "before your Physics test: waves", minutes: 25, before: at(4, 9) },
      { subjectId: "economics", subjectName: "Economics", subtopicIds: ["2.4"], title: "Price elasticity of demand", reason: "5 marks lost last week", minutes: 20, before: null },
      { subjectId: "math_aa", subjectName: "Maths AA", subtopicIds: ["5.10"], title: "Integration by substitution", reason: "3 marks lost last week", minutes: 30, before: null },
    ],
    doneWeeks: [],
  };

  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <p className="text-label-sm text-on-surface-variant">Dev preview · sample week · nothing is saved</p>
        <section className="flex flex-col gap-sm">
          <p className="text-label-md font-semibold text-on-surface">On Home and the Hub, on a Sunday:</p>
          <ResetBanner doneWeeks={[]} previewDate={sunday} />
        </section>
        <header className="flex flex-col gap-xs pt-lg border-t border-outline-variant">
          <p className="text-label-md font-bold uppercase tracking-[0.15em] text-primary">Sunday Reset</p>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Ten minutes. A calm week after it.</h1>
          <p className="text-body-lg text-on-surface-variant">Look back, look ahead, and put a few short sessions where they count.</p>
        </header>
        <ResetFlow data={data} preview />
      </div>
    </div>
  );
}

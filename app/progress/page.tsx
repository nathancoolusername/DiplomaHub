import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getBoundaryOverrides, getMarksWonBack, getPracticeProgress, getResults, getTestsToLog, getUserSubjects } from "@/lib/data";
import { MarksWonBackCard } from "@/components/progress/MarksWonBackCard";
import { subjectById } from "@/lib/catalog";
import { links } from "@/lib/practice/links";
import { ProgressBoard } from "@/components/progress/ProgressBoard";

export const metadata: Metadata = { title: "Progress", robots: { index: false } };

// Progress (free): students log their test, mock and predicted results and
// see each subject's grades over time. Past tests on their Hub ask "How did
// it go?". Bro (Pro) reads these and can log one when told in chat.
export default async function ProgressPage() {
  if (!(await getCurrentUserId())) redirect("/login?next=/progress");
  const [results, subjects, testsToLog, practiceRows, overrides, wonBack] = await Promise.all([
    getResults(),
    getUserSubjects(),
    getTestsToLog(),
    getPracticeProgress(),
    getBoundaryOverrides(),
    getMarksWonBack(),
  ]);
  // The student's subjects first (in their order), then any other subject they practised.
  const order = subjects.map((s) => s.subject.id as string);
  const practice = practiceRows
    .map((p) => {
      const subject = subjectById(p.subjectId as Parameters<typeof subjectById>[0]);
      return { ...p, name: subject?.shortName ?? p.subjectId, href: links.subject(p.subjectId as Parameters<typeof links.subject>[0]) };
    })
    .sort((a, b) => (order.indexOf(a.subjectId) + 1 || 99) - (order.indexOf(b.subjectId) + 1 || 99));

  return (
    <div className="max-w-[1100px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Progress</h1>
        <p className="text-body-lg text-on-surface-variant">Log your tests, mocks and predicted grades, see your practice scores, and watch each subject move.</p>
      </header>
      <MarksWonBackCard data={wonBack} />
      <ProgressBoard initial={results} subjects={subjects.map((s) => ({ id: s.subject.id, name: s.subject.shortName, level: s.levelSet ? s.level : null }))} testsToLog={testsToLog} practice={practice} overrides={overrides} />
    </div>
  );
}

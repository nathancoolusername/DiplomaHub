import { notFound } from "next/navigation";
import { getSet, getSetQuestions, getSubject, getViewer, revealMarkscheme, startOrResumeAttempt } from "@/lib/data";
import { examPaceSeconds } from "@/lib/practice/pace";
import { SetPlayer } from "@/components/practice/player/SetPlayer";

export default async function PlayPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const [viewer, set] = await Promise.all([getViewer(), getSet(setId)]);
  if (!set) notFound();

  const subject = getSubject(set.subjectId);
  if (!subject) notFound();

  // Resumes the unfinished attempt for this set if there is one.
  const [questions, { attempt, answers }] = await Promise.all([getSetQuestions(setId), startOrResumeAttempt(setId)]);
  if (questions.length === 0) notFound();

  // Untimed: bring back markschemes the student had already opened.
  const initialSchemes = attempt.timed
    ? {}
    : Object.fromEntries(
        await Promise.all(
          answers.filter((a) => a.revealed).map(async (a) => [a.questionId, await revealMarkscheme(attempt.id, a.questionId)] as const),
        ),
      );

  return (
    <SetPlayer
      // A fresh attempt (e.g. after finishing) must not reuse the old player state.
      key={attempt.id}
      set={set}
      attempt={attempt}
      questions={questions}
      initialAnswers={answers}
      initialSchemes={initialSchemes}
      examPaceS={examPaceSeconds(subject, set.settings.level, questions)}
      isPro={viewer.isPro}
    />
  );
}

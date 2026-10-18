import { notFound } from "next/navigation";
import { getInstantMcqKeys, getSet, getSetQuestions, getSubject, getViewer, revealMarkscheme, startOrResumeAttempt } from "@/lib/data";
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

  // Untimed: bring back markschemes the student had already opened. Feedback
  // after each question: the MCQ answers come with the page so right/wrong
  // shows at once ({} before migration 23: the player falls back to asking
  // the server). Both at once.
  const [initialSchemes, mcqKeys] = await Promise.all([
    attempt.timed
      ? {}
      : Promise.all(
          answers.filter((a) => a.revealed).map(async (a) => [a.questionId, await revealMarkscheme(attempt.id, a.questionId)] as const),
        ).then((pairs) => Object.fromEntries(pairs)),
    !attempt.timed && set.settings.mcqFeedback === "each" && questions.some((q) => q.type === "mcq")
      ? getInstantMcqKeys(attempt.id).catch(() => ({}))
      : {},
  ]);

  return (
    <SetPlayer
      // A fresh attempt (e.g. after finishing) must not reuse the old player state.
      key={attempt.id}
      set={set}
      attempt={attempt}
      questions={questions}
      initialAnswers={answers}
      initialSchemes={initialSchemes}
      mcqKeys={mcqKeys}
      examPaceS={examPaceSeconds(subject, set.settings.level, questions)}
      isPro={viewer.isPro}
    />
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSet, getSetQuestions, getSubject, hasOpenAttempt } from "@/lib/data";
import { SetEditor } from "@/components/practice/sets/SetEditor";

type Props = { params: Promise<{ setId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setId } = await params;
  const set = await getSet(setId);
  return { title: set?.title ?? "Set" };
}

// Edit a set before starting it: name, settings, which questions and their order.
export default async function EditSetPage({ params }: Props) {
  const { setId } = await params;
  // All at once; a set that isn't theirs comes back empty and is a 404 below.
  const [set, questions, locked] = await Promise.all([getSet(setId), getSetQuestions(setId).catch(() => []), hasOpenAttempt(setId)]);
  if (!set) notFound();
  const subject = getSubject(set.subjectId);
  if (!subject) notFound();
  if (questions.length === 0) notFound();

  return <SetEditor set={set} subject={subject} questions={questions} questionsLocked={locked} />;
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSet, getSetQuestions } from "@/lib/data";
import { PaperMarking } from "@/components/practice/results/PaperMarking";

export const metadata: Metadata = { title: "Mark your paper · DiplomaHub" };

/**
 * A printed paper back on screen (its code, or Mark paper): the letters circled
 * for multiple choice, then straight to the markscheme. Nothing is written
 * until the student presses the button, so a prefetch never starts an attempt.
 */
export default async function MarkPaperPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const [set, questions] = await Promise.all([getSet(setId).catch(() => null), getSetQuestions(setId).catch(() => [])]);
  if (!set || questions.length === 0) notFound();

  const mcqs = questions.flatMap((q, i) => (q.type === "mcq" && q.options?.length ? [{ id: q.id, n: i + 1, stemMd: q.stemMd ?? q.parts[0]?.textMd ?? "", keys: q.options.map((o) => o.key) }] : []));
  return <PaperMarking setId={set.id} title={set.title} mcqs={mcqs} written={questions.length - mcqs.length} />;
}

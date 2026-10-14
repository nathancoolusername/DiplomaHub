import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Camera, ChevronLeft } from "lucide-react";
import type { BuildSettings, PracticeType } from "@/lib/data/types";
import { getSavedSets, getSet, getSetQuestions, getStrengthMap, getSubjectsWithQuestions, getSuggestions, getUsage, getUserSubject, getViewer, hasOpenAttempt } from "@/lib/data";
import { links } from "@/lib/practice/links";
import { PRACTICE_TYPES } from "@/lib/practice/practice-types";
import { BuildSetForm } from "@/components/practice/build/BuildSetForm";
import { ProBadge } from "@/components/shared/ProUpsell";

type Props = {
  params: Promise<{ subjectId: string; type: string }>;
  searchParams: Promise<{ topics?: string; set?: string }>;
};

function isPracticeType(t: string): t is PracticeType {
  return t in PRACTICE_TYPES;
}

export const metadata: Metadata = { title: "Build your set" };

// One page per practice type: "Build your set", Bro's suggestion + Auto
// (Pro), the form, then the set actions and Go.
export default async function BuildPage({ params, searchParams }: Props) {
  const [{ subjectId, type }, { topics, set: setId }] = await Promise.all([params, searchParams]);
  if (!isPracticeType(type)) notFound();

  const [viewer, us] = await Promise.all([getViewer(), getUserSubject(subjectId)]);
  if (!us || !us.subject.supportedTypes.includes(type)) notFound();
  // No questions for this subject yet: the subject page explains it.
  const practiceIds = await getSubjectsWithQuestions().catch(() => null);
  if (practiceIds && !practiceIds.includes(subjectId)) redirect(links.subject(subjectId));

  const [map, suggestions, usage, savedSets] = await Promise.all([
    getStrengthMap(subjectId),
    viewer.isPro ? getSuggestions("build", subjectId) : [],
    getUsage(),
    getSavedSets(subjectId),
  ]);
  if (!map) notFound();

  // Only topics that exist in this syllabus (and the student's level) can be preselected.
  const known = new Set(map.topics.flatMap((t) => t.subtopics.map((s) => s.id)));
  const initialTopics = (topics ?? "").split(",").filter((id) => known.has(id));
  const weakIds = map.topics
    .flatMap((t) => t.subtopics)
    .filter((s) => s.level === "weak" || s.level === "developing")
    .map((s) => s.id);

  // ?set=<id>: change one of your sets with the same form.
  let editing: { setId: string; title: string; locked: boolean; settings: BuildSettings } | null = null;
  if (setId) {
    const set = await getSet(setId);
    if (!set) notFound();
    if (set.subjectId !== subjectId || set.practiceType !== type) redirect(links.editSet(set));
    const [questions, locked] = await Promise.all([set.build ? Promise.resolve([]) : getSetQuestions(set.id), hasOpenAttempt(set.id)]);
    // Sets from before settings were stored: work them out from the questions.
    const types = new Set(questions.map((q) => q.type));
    const b = set.build ?? {
      subtopicIds: [...new Set(questions.map((q) => q.subtopicId))].filter((id) => known.has(id)),
      questionType: types.size === 1 && types.has("mcq") ? "mcq" : types.size === 1 && types.has("short") ? "short" : "mix",
      count: set.questionIds.length,
      difficulty: "mixed",
    };
    editing = {
      setId: set.id,
      title: set.title,
      locked,
      settings: {
        subtopicIds: (b.subtopicIds ?? []).filter((id) => known.has(id)),
        questionType: b.questionType ?? "mix",
        count: b.count ?? set.questionIds.length,
        difficulty: b.difficulty ?? "mixed",
        paper: b.paper ?? null,
        calculator: b.calculator ?? true,
        includeHl: b.includeHl ?? us.level === "HL",
        timer: set.settings.timer,
        mcqFeedback: set.settings.mcqFeedback,
        answerOn: set.settings.answerOn,
      },
    };
  }

  const written = usage.find((u) => u.feature === "written_questions");
  const writtenRemaining = !viewer.isPro && written && written.limit !== null ? Math.max(0, written.limit - written.used) : null;

  return (
    <div className="max-w-[1200px] mx-auto px-md pt-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link href={links.subject(subjectId)} className="self-start inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
          <ChevronLeft size={14} aria-hidden="true" /> {us.subject.shortName}
        </Link>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">{editing ? "Change your set" : "Build your set"}</h1>
        <p className="text-body-lg text-on-surface-variant">
          {us.subject.shortName} {us.level} · {PRACTICE_TYPES[type].title}
        </p>
      </header>

      {type === "grade_own" ? (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-xl flex flex-col items-start gap-md mb-xl">
          <span className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
            <Camera size={24} />
          </span>
          <p className="font-serif font-bold text-headline-md text-on-surface flex items-center gap-sm">
            Grade your own work {!viewer.isPro && <ProBadge />}
          </p>
          <p className="text-body-md text-on-surface-variant max-w-160">
            Upload a photo of a paper you did, or write your own questions, and Bro proposes marks for you to confirm. This is coming with DiplomaPro.
          </p>
        </div>
      ) : (
        <BuildSetForm
          // A different set (or none) is a fresh form.
          key={editing?.setId ?? "new"}
          editing={editing}
          subject={us.subject}
          practiceType={type}
          map={map}
          initialTopics={initialTopics}
          weakIds={weakIds}
          isPro={viewer.isPro}
          writtenRemaining={writtenRemaining}
          suggestion={suggestions[0] ?? null}
          savedSets={savedSets}
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getCalendarItems, getPastSets, getMySubjectRequests, getStrengthMap, getSubject, getSubjectsWithQuestions, subjectRequestKey, getSuggestions, getTopicTree, getUserSubject, getViewer } from "@/lib/data";
import { links } from "@/lib/practice/links";
import { SuggestionBar } from "@/components/shared/SuggestionBar";
import { StrengthLegend } from "@/components/shared/strength/StrengthLegend";
import { StrengthMapView } from "@/components/shared/strength/StrengthMapView";
import { GeneralInfo } from "@/components/practice/subject/GeneralInfo";
import { CustomSubjectInfo } from "@/components/practice/subject/CustomSubjectInfo";
import { SetLevel } from "@/components/practice/SetLevel";
import { PracticeBoxes } from "@/components/practice/subject/PracticeBoxes";
import { PastSets } from "@/components/shared/PastSets";

type Props = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: getSubject(subjectId)?.shortName ?? "Practice" };
}

// Subject: heading with general info beside it, a full-width suggestion
// bar, the practice boxes, this subject's strength map, then past sets.
export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params;
  const [viewer, us, map, suggestions, pastSets, practiceIds, myRequests, calendar] = await Promise.all([
    getViewer(),
    getUserSubject(subjectId),
    getStrengthMap(subjectId),
    getSuggestions("subject", subjectId),
    getPastSets({ subjectId, limit: 20 }),
    getSubjectsWithQuestions().catch(() => null),
    getMySubjectRequests().catch(() => [] as string[]), // empty until migration 18 runs
    getCalendarItems().catch(() => []),
  ]);
  // Only subjects the student takes (core or extra) have a page.
  if (!us) notFound();
  const hasPractice = !practiceIds || practiceIds.includes(subjectId);
  const { subject, level } = us;
  const custom = subject.id.startsWith("custom:");

  return (
    <div className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
      <div className="grid lg:grid-cols-[1fr_380px] gap-lg items-start">
        <header className="flex flex-col gap-sm">
          <Link href={links.practice()} className="self-start inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
            <ChevronLeft size={14} aria-hidden="true" /> Practice
          </Link>
          <div className="flex items-center gap-sm flex-wrap">
            <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">{subject.name}</h1>
            {us.levelSet ? (
              <span className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-bold">{level}</span>
            ) : (
              <SetLevel subjectId={subject.id} />
            )}
          </div>
          {(custom || !us.isCore) && (
            <p className="text-label-md text-on-surface-variant">{[custom && "Your subject", !us.isCore && "Extra class"].filter(Boolean).join(" · ")}</p>
          )}
        </header>

        {/* Typed in by the student, so no syllabus: what it's for, and their own Hub items for it. */}
        {custom ? (
          <CustomSubjectInfo subject={subject} custom={custom} items={calendar.filter((i) => i.subjectId === subject.id).slice(0, 5)} />
        ) : (
          <GeneralInfo subject={subject} level={level} topics={getTopicTree(subject.id)} />
        )}
      </div>

      {/* Full width, straight under the heading row. */}
      {hasPractice && suggestions[0] && (
        <div className="-mt-md">
          <SuggestionBar suggestion={suggestions[0]} />
        </div>
      )}

      <section className="flex flex-col gap-md" aria-labelledby="practise">
        <h2 id="practise" className="font-serif font-bold text-headline-md text-on-surface">
          Practise
        </h2>
        <PracticeBoxes
          subject={subject}
          level={level}
          isPro={viewer.isPro}
          hasPractice={hasPractice}
          requested={myRequests.includes(subjectRequestKey(subject.id, subject.name))}
        />
      </section>

      {map && hasPractice && (
        <section className="flex flex-col gap-md" aria-labelledby="strength-map">
          <div className="flex flex-col gap-xs">
            <h2 id="strength-map" className="font-serif font-bold text-headline-md text-on-surface">
              {subject.shortName} strength map
            </h2>
            <StrengthLegend />
          </div>
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl">
            <StrengthMapView map={map} size="full" />
          </div>
        </section>
      )}

      {pastSets.length > 0 && <PastSets sets={pastSets} note={pastSets.length === 20 ? "Latest 20" : undefined} />}
    </div>
  );
}

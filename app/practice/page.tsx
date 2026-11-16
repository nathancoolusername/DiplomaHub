import Link from "next/link";
import { Library } from "lucide-react";
import { getAllSubjects, getMyStanding, getMySubjectRequests, getPastSets, getSavedSets, subjectRequestKey, getPendingHints, getRecentSessions, getStrengthMaps, getSubjectsWithQuestions, getUsage, getUserSubjects, getViewer } from "@/lib/data";
import { Greeting } from "@/components/shared/Greeting";
import { UsageBanner } from "@/components/shared/UsageBanner";
import { StrengthCarousel } from "@/components/shared/strength/StrengthCarousel";
import { SubjectCard } from "@/components/practice/overview/SubjectCard";
import { ChangeSubjects } from "@/components/practice/overview/ChangeSubjects";
import { ExtraClasses } from "@/components/practice/overview/ExtraClasses";
import { PickUpCard } from "@/components/shared/PickUpCard";
import { links } from "@/lib/practice/links";
import { PastSets } from "@/components/shared/PastSets";
import { RankCard } from "@/components/leaderboard/RankCard";
import { CodeFromLink } from "@/components/practice/overview/CodeFromLink";
import { CodesLink } from "@/components/codes/CodesLink";

// Practice: usage at the top, unfinished sets, the six subjects, strength maps, extra classes, past sets.
export default async function PracticePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  // From a share link (/join/CODE): open Enter a code, filled in.
  const { code } = await searchParams;
  const linkCode = typeof code === "string" && /^[A-HJ-NP-Z2-9]{5,6}$/i.test(code) ? code.toUpperCase() : null;
  const [viewer, subjects, maps, usage, catalog, hints, sessions, pastSets, standing, practiceIds, requests, savedSets] = await Promise.all([
    getViewer(),
    getUserSubjects(),
    getStrengthMaps(),
    getUsage(),
    getAllSubjects(),
    getPendingHints(),
    getRecentSessions(3),
    getPastSets({ limit: 5 }),
    getMyStanding("week").catch(() => null), // null until the leaderboard migration runs
    getSubjectsWithQuestions().catch(() => null), // subjects with practice questions
    getMySubjectRequests().catch(() => [] as string[]), // empty until migration 18 runs
    getSavedSets().catch(() => []),
  ]);

  const core = subjects.filter((s) => s.isCore);
  const extras = subjects.filter((s) => !s.isCore);
  const taken = new Set(subjects.map((s) => s.subject.id));
  const mapFor = (id: string) => maps.find((m) => m.subject.id === id) ?? null;

  return (
    <div className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
      <Greeting firstName={viewer.firstName} variant="practice" />

      <UsageBanner usage={usage} isPro={viewer.isPro} />

      {standing && <RankCard standing={standing} />}

      {/* Same list as the Hub's; hidden until there's something to pick up. */}
      {sessions.length > 0 && <PickUpCard sessions={sessions} />}

      <section className="flex flex-col gap-md" aria-labelledby="your-subjects">
        <div className="flex items-end justify-between gap-md">
          <h2 id="your-subjects" className="font-serif font-bold text-headline-md text-on-surface">
            Your subjects
          </h2>
          <div className="flex items-center gap-sm">
            <Link
              href={links.sets()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface px-md py-2 text-label-md font-semibold transition-colors"
            >
              <Library size={16} aria-hidden="true" />
              Your sets
              {savedSets.length > 0 && <span className="rounded-full bg-primary/10 text-primary px-1.5 text-label-sm tabular-nums">{savedSets.length}</span>}
            </Link>
            <CodesLink />
            <ChangeSubjects core={core} catalog={catalog} practiceIds={practiceIds} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {core.map((us) => (
            <SubjectCard
              key={us.subject.id}
              us={us}
              map={mapFor(us.subject.id)}
              hasPractice={!practiceIds || practiceIds.includes(us.subject.id)}
              requested={requests.includes(subjectRequestKey(us.subject.id, us.subject.name))}
            />
          ))}
        </div>
      </section>

      <StrengthCarousel maps={maps.filter((m) => core.some((c) => c.subject.id === m.subject.id) && (!practiceIds || practiceIds.includes(m.subject.id)))} title="Strength maps" hintPending={hints.includes("strength-map")} />

      <ExtraClasses extras={extras} maps={maps} catalog={catalog} taken={[...taken]} practiceIds={practiceIds} requests={requests} />

      {linkCode && <CodeFromLink code={linkCode} />}

      {pastSets.length > 0 && <PastSets
          sets={pastSets}
          showSubject
          note={
            <Link href={links.sets()} className="font-semibold text-primary hover:underline">
              All your sets
            </Link>
          }
        />}
    </div>
  );
}

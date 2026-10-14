import { getAllSubjects, getMyStanding, getMySubjectRequests, getPastSets, subjectRequestKey, getPendingHints, getRecentSessions, getStrengthMaps, getSubjectsWithQuestions, getUsage, getUserSubjects, getViewer } from "@/lib/data";
import { Greeting } from "@/components/shared/Greeting";
import { UsageBanner } from "@/components/shared/UsageBanner";
import { StrengthCarousel } from "@/components/shared/strength/StrengthCarousel";
import { SubjectCard } from "@/components/practice/overview/SubjectCard";
import { ChangeSubjects } from "@/components/practice/overview/ChangeSubjects";
import { ExtraClasses } from "@/components/practice/overview/ExtraClasses";
import { PickUpCard } from "@/components/shared/PickUpCard";
import { PastSets } from "@/components/shared/PastSets";
import { RankCard } from "@/components/leaderboard/RankCard";
import { CodeFromLink } from "@/components/practice/overview/CodeFromLink";

// Practice: usage at the top, unfinished sets, the six subjects, strength maps, extra classes, past sets.
export default async function PracticePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  // From a share link (/join/CODE): open Enter a code, filled in.
  const { code } = await searchParams;
  const linkCode = typeof code === "string" && /^[A-HJ-NP-Z2-9]{6}$/i.test(code) ? code.toUpperCase() : null;
  const [viewer, subjects, maps, usage, catalog, hints, sessions, pastSets, standing, practiceIds, requests] = await Promise.all([
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
          <ChangeSubjects core={core} catalog={catalog} practiceIds={practiceIds} />
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

      {pastSets.length > 0 && <PastSets sets={pastSets} showSubject note="Latest 5 · each subject page lists more" />}
    </div>
  );
}

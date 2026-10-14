import type { Metadata } from "next";
import Hub from "@/components/hub/hub";
import { getCurrentUserId, getCurrentUserProfile } from "@/app/lib/get-current-user";
import { getHubItems, getHubStudyLog, getHubRecommendedResources } from "@/app/lib/actions/hub";
import { getWeekDates, toDateInputValue } from "@/components/hub/calendar/calendar-utils";
import type { SubjectId } from "@/components/hub/mock-data";
import type { TaskPracticeSuggestion } from "@/components/hub/calendar/week-calendar";
import { getBroBrief, getPendingHints, getPracticeStats, getRecentSessions, getSuggestions, getUserSubjects, getViewer } from "@/lib/data";
import { suggestionHref } from "@/lib/practice/links";
import { NextStepsRow } from "@/components/hub/pro/NextStepsRow";
import { PickUpCard } from "@/components/shared/PickUpCard";
import { BroBriefCard } from "@/components/hub/pro/BroBriefCard";
import { PracticeStatsCard } from "@/components/hub/pro/PracticeStatsCard";
import { BroButton } from "@/components/shared/bro/BroButton";

export const metadata: Metadata = {
  title: "Hub",
  description: "Your personal IB planner — deadlines, study blocks, and focus sessions in one place.",
  alternates: { canonical: "/hub" },
};

export default async function HubPage({ searchParams }: { searchParams: Promise<{ add?: string; plan?: string }> }) {
  const { add, plan } = await searchParams;
  const openAddOnLoad = add === "1";
  const userId = await getCurrentUserId();
  const weekDates = getWeekDates(new Date());
  const weekStart = toDateInputValue(weekDates[0]);
  const weekEnd = toDateInputValue(weekDates[6]);

  const [profile, itemsResult, studyLogResult, resourcesBySubject] = await Promise.all([
    userId ? getCurrentUserProfile() : Promise.resolve(null),
    userId ? getHubItems() : Promise.resolve(null),
    userId ? getHubStudyLog(weekStart, weekEnd) : Promise.resolve(null),
    getHubRecommendedResources(),
  ]);

  const firstName = profile?.display_name?.split(" ")[0] ?? null;

  // DiplomaPro additions: signed-in students only (guests keep the plain Hub).
  const pro = userId ? await loadPro() : null;

  return (
    <>
      <Hub
        firstName={firstName}
        userId={userId}
        ibYear={profile?.ib_year ?? null}
        savedSessionId={profile?.exam_session_id ?? null}
        initialItems={itemsResult?.success ? itemsResult.data : []}
        initialStudyLog={studyLogResult?.success ? studyLogResult.data : []}
        hasOnboarded={profile?.hub_onboarded_at != null}
        hubSubjects={(profile?.hub_subjects as SubjectId[] | null) ?? null}
        initialCustomSubjects={profile?.custom_hub_subjects ?? []}
        resourcesBySubject={resourcesBySubject}
        proRows={
          pro && (
            <>
              <NextStepsRow suggestions={pro.nextSteps} />
              <div className="grid md:grid-cols-2 gap-lg items-stretch">
                <PickUpCard sessions={pro.sessions} />
                <BroBriefCard brief={pro.brief} isPro={pro.viewer.isPro} />
              </div>
            </>
          )
        }
        practiceCard={pro && <PracticeStatsCard stats={pro.stats} />}
        practiceBySubject={pro?.practiceBySubject ?? {}}
        openAddOnLoad={openAddOnLoad}
        planItemId={typeof plan === "string" ? plan : null}
      />
      {pro && <BroButton isPro={pro.viewer.isPro} hintPending={pro.hints.includes("bro-button")} />}
    </>
  );
}

async function loadPro() {
  const [viewer, nextSteps, sessions, brief, stats, userSubjects, hints] = await Promise.all([
    getViewer(),
    getSuggestions("hub"),
    getRecentSessions(3),
    getBroBrief(),
    getPracticeStats(14),
    getUserSubjects(),
    getPendingHints(),
  ]);
  // "Suggested for this task": the same per-subject suggestion as the subject page.
  const practiceBySubject: Record<SubjectId, TaskPracticeSuggestion> = Object.fromEntries(
    (
      await Promise.all(
        userSubjects.map(async (us) => {
          const s = (await getSuggestions("subject", us.subject.id))[0];
          return s?.action && s.actionLabel ? ([us.subject.id, { text: s.text, href: suggestionHref(s.action), label: s.actionLabel, fromBro: s.source === "bro" }] as const) : null;
        }),
      )
    ).filter((e) => e !== null),
  );
  return { viewer, nextSteps, sessions, brief, stats, hints, practiceBySubject };
}

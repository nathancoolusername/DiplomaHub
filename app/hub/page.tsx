import type { Metadata } from "next";
import Hub from "@/components/hub/hub";
import { getCurrentUserId, getCurrentUserProfile } from "@/app/lib/get-current-user";
import { getHubItems, getHubStudyLog, getHubRecommendedResources } from "@/app/lib/actions/hub";
import { getWeekDates, toDateInputValue } from "@/components/hub/calendar/calendar-utils";
import type { SubjectId } from "@/components/hub/mock-data";

export const metadata: Metadata = {
  title: "Hub",
  description: "Your personal IB planner — deadlines, study blocks, and focus sessions in one place.",
  alternates: { canonical: "/hub" },
};

export default async function HubPage() {
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

  return (
    <Hub
      firstName={firstName}
      userId={userId}
      ibYear={profile?.ib_year ?? null}
      initialItems={itemsResult?.success ? itemsResult.data : []}
      initialStudyLog={studyLogResult?.success ? studyLogResult.data : []}
      hasOnboarded={profile?.hub_onboarded_at != null}
      hubSubjects={(profile?.hub_subjects as SubjectId[] | null) ?? null}
      resourcesBySubject={resourcesBySubject}
    />
  );
}

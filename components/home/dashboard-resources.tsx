import ResourceHome from "./article-section/article-home";
import { getResourcesPage } from "@/app/lib/actions/resources";
import { getSubject, type SubjectId } from "@/components/hub/mock-data";
import type { Resource } from "@/app/lib/types";

const DISPLAY_COUNT = 6;

// "New resources in your subjects" — deliberately keyed off the profile's
// *raw* hub_subjects picks, not the core-padded computeMySubjectIds() set.
// TOK/EE/CAS/General are default-included for every account (see
// components/hub/onboarding/subject-cap.ts), so using the padded set here
// would show the same generic resources to everyone regardless of what
// they actually picked — the whole point of this section is personalization.
export default async function DashboardResources({
  hubSubjects,
  compact = false,
  washed = false,
}: {
  hubSubjects: string[] | null;
  compact?: boolean;
  washed?: boolean;
}) {
  let resources: Resource[] = [];
  const isPersonalized = !!hubSubjects && hubSubjects.length > 0;

  if (hubSubjects && hubSubjects.length > 0) {
    // hub_subjects stores Hub's own SubjectId values (e.g. "math_aa") — the
    // resources table's subject_tag is the real display name ("Math AA").
    // getSubject() (components/hub/mock-data.ts) is the existing bridge
    // between the two, same one getHubRecommendedResources already relies on.
    const subjectNames = hubSubjects
      .map((id) => getSubject(id as SubjectId)?.name)
      .filter((name): name is string => !!name);
    const perSubject = await Promise.all(
      subjectNames.map(async (subject) => {
        const result = await getResourcesPage({ subject, sort: "newest", pageSize: 3 });
        return result.success ? result.data.items : [];
      }),
    );
    resources = perSubject
      .flat()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, DISPLAY_COUNT);
  } else {
    const result = await getResourcesPage({ sort: "newest", pageSize: DISPLAY_COUNT });
    resources = result.success ? result.data.items : [];
  }

  return (
    <ResourceHome
      data={resources}
      title={isPersonalized ? "New in your subjects" : "Recently added"}
      subtitle={
        isPersonalized
          ? "The newest resources in the subjects you picked for the Hub."
          : "Pick your subjects in the Hub to personalize this list — for now, here's what's new."
      }
      compact={compact}
      washed={washed}
    />
  );
}

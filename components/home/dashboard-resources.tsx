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
    // Custom and later-added subjects have no matching resource_tag, so
    // they're skipped rather than sent as filter values that match nothing.
    const subjectNames = hubSubjects
      .map((id) => getSubject(id as SubjectId))
      .filter((s) => !!s && s.hasResources !== false)
      .map((s) => s!.name);
    // One query across every picked subject rather than one per subject.
    if (subjectNames.length > 0) {
      const result = await getResourcesPage({
        subjects: subjectNames,
        sort: "newest",
        pageSize: DISPLAY_COUNT,
      });
      resources = result.success ? result.data.items : [];
    }
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

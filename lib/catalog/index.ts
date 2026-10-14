import type { Subject, SubjectId, Topic } from "@/lib/data/types";
import catalog from "./subjects.json";

// The subject catalog: subjects, papers and syllabus trees. Source of truth
// is lib/catalog/subjects.json; supabase/seed/diplomapro_catalog.sql is
// generated from it, so the app and the database `subjects`/`topics`
// tables always agree, and pages can read it synchronously with no query.
// Maths AA's tree is the real syllabus list from the pipeline; the others
// are trimmed versions of the current guides. Paper durations/marks drive
// exam pace: check them against each subject guide.

type CatalogSubject = (typeof catalog.subjects)[number];

export function shortSubtopicName(name: string): string {
  return name.split(";")[0].trim();
}

export const SUBJECTS: Record<SubjectId, Subject> = Object.fromEntries(
  catalog.subjects.map((s: CatalogSubject): [string, Subject] => [
    s.id,
    {
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      ibGroup: s.ibGroup,
      resourceTag: s.resourceTag,
      supportedTypes: s.supportedTypes as Subject["supportedTypes"],
      papers: s.papers as Subject["papers"],
    },
  ]),
);

const TOPICS: Record<SubjectId, Topic[]> = Object.fromEntries(
  catalog.subjects.map((s: CatalogSubject): [string, Topic[]] => [
    s.id,
    s.topics.map((t) => ({
      code: t.code,
      name: t.name,
      subtopics: t.subtopics.map((x) => ({ id: x.code, code: x.code, name: x.name, shortName: shortSubtopicName(x.name), hlOnly: x.hlOnly })),
    })),
  ]),
);

export function subjectById(id: SubjectId): Subject | null {
  return SUBJECTS[id] ?? null;
}

export function topicTree(id: SubjectId): Topic[] {
  return TOPICS[id] ?? [];
}

export function findSubtopic(subjectId: SubjectId, subtopicId: string) {
  for (const topic of topicTree(subjectId)) {
    const sub = topic.subtopics.find((s) => s.id === subtopicId);
    if (sub) return sub;
  }
  return null;
}

/** Every subject in the catalog, for the subject pickers. */
export function allSubjects(): Subject[] {
  return Object.values(SUBJECTS);
}

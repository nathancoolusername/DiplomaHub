// The 16 subjects below stay in exact 1:1 correspondence with the real
// site's resource subject tags (components/pills.tsx's SubjectTags) —
// `Subject.name` is spelled identically to the real subject_tag string so
// resource lookups (see app/lib/actions/hub.ts) never need a separate
// mapping table. Subjects added after that (Philosophy, Psychology, etc.)
// and any user-typed custom subject deliberately do NOT have a matching
// resource_tag — there's no resource content for them yet, so `hasResources:
// false` (or being absent from this fixed list at all, for custom ones)
// skips the recommended-resources fetch entirely instead of always running
// a query that can only ever come back empty.
//
// SubjectId used to be a closed union of just the 16 ids below. It's a
// plain string now so a user's own custom subject ("Latin", "Robotics",
// whatever they type) can be used as a subject id anywhere a built-in one
// could — colors/grouping/resource-matching all fall back gracefully for
// an id that isn't in SUBJECTS.
export type SubjectId = string;

export type SubjectGroup = "math" | "language" | "social_sciences" | "science" | "arts";

export type Subject = {
  id: SubjectId;
  name: string;
  shortName: string;
  // Absent for the TOK/EE/CAS/General core (they aren't a "subject group")
  // and for custom subjects (rendered in their own "Your subjects" section).
  group?: SubjectGroup;
  // Defaults to true when omitted — only set false for a subject with no
  // matching resource_tag in the real resources table.
  hasResources?: boolean;
};

export const SUBJECTS: Subject[] = [
  { id: "math_aa", name: "Math AA", shortName: "Math AA", group: "math" },
  { id: "math_ai", name: "Math AI", shortName: "Math AI", group: "math" },
  { id: "physics", name: "Physics", shortName: "Physics", group: "science" },
  { id: "chemistry", name: "Chemistry", shortName: "Chem", group: "science" },
  { id: "biology", name: "Biology", shortName: "Bio", group: "science" },
  { id: "english", name: "English", shortName: "English", group: "language" },
  { id: "french", name: "French", shortName: "French", group: "language" },
  { id: "history", name: "History", shortName: "History", group: "social_sciences" },
  { id: "economics", name: "Economics", shortName: "Econ", group: "social_sciences" },
  { id: "geography", name: "Geography", shortName: "Geo", group: "social_sciences" },
  { id: "business", name: "Business", shortName: "Business", group: "social_sciences" },
  { id: "theatre", name: "Theatre", shortName: "Theatre", group: "arts" },
  { id: "tok", name: "TOK", shortName: "TOK" },
  { id: "ee", name: "EE", shortName: "EE" },
  { id: "general", name: "General", shortName: "General" },
  { id: "cas", name: "CAS", shortName: "CAS" },
  // Added later — real Hub subjects, but no matching resource_tag exists
  // yet, so hasResources is explicitly false for all seven.
  { id: "philosophy", name: "Philosophy", shortName: "Philosophy", group: "social_sciences", hasResources: false },
  { id: "psychology", name: "Psychology", shortName: "Psych", group: "social_sciences", hasResources: false },
  { id: "ess", name: "ESS", shortName: "ESS", group: "science", hasResources: false },
  { id: "cs", name: "Computer Science", shortName: "CS", group: "science", hasResources: false },
  { id: "sport_science", name: "Sport Science", shortName: "Sport Sci", group: "science", hasResources: false },
  { id: "german", name: "German", shortName: "German", group: "language", hasResources: false },
  { id: "spanish", name: "Spanish", shortName: "Spanish", group: "language", hasResources: false },
];

export const SUBJECT_GROUP_LABELS: Record<SubjectGroup, string> = {
  math: "Math",
  language: "Language",
  social_sciences: "Social sciences",
  science: "Science",
  arts: "Arts",
};

// A subject a user typed in themselves — no group, no resource matching,
// just an id (generated once, stable even if the user later can't recall
// exactly what they typed) and the label they gave it.
export type CustomSubject = { id: string; name: string };

export function isCustomSubjectId(id: string): boolean {
  return id.startsWith("custom:");
}

export function makeCustomSubjectId(): string {
  return `custom:${crypto.randomUUID().slice(0, 8)}`;
}

// Looks up a built-in subject first, then falls back to the caller's own
// custom subjects (a per-user list that this static file can't know about
// on its own) — pass the current custom list wherever a subject might be
// one the user typed in themselves.
export function getSubject(id: SubjectId | null, customSubjects: CustomSubject[] = []): Subject | null {
  if (!id) return null;
  const builtIn = SUBJECTS.find((s) => s.id === id);
  if (builtIn) return builtIn;
  const custom = customSubjects.find((s) => s.id === id);
  return custom ? { id: custom.id, name: custom.name, shortName: custom.name, hasResources: false } : null;
}

export type HubItemType = "ib_component" | "task" | "study_block" | "university";
export type HubItemStatus = "todo" | "done";
export type Stage = { label: string; done: boolean };

export type HubItem = {
  id: string;
  title: string;
  type: HubItemType;
  // University deadlines etc. aren't tied to one of the 8 IB subjects above,
  // so this is nullable rather than forcing a fake subject onto them.
  subjectId: SubjectId | null;
  start: Date;
  end: Date;
  allDay: boolean;
  status: HubItemStatus;
  stages: Stage[];
  notes: string;
  resourceIds: string[];
  weightLabel?: string;
};

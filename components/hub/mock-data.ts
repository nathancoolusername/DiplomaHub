// Kept in exact 1:1 correspondence with the real site's resource subject
// tags (components/pills.tsx's SubjectTags) — every subject you can tag a
// resource with is pickable here too, and `Subject.name` below is spelled
// identically to the real subject_tag string so resource lookups (see
// app/lib/actions/hub.ts) never need a separate mapping table.
export type SubjectId =
  | "math_aa"
  | "math_ai"
  | "physics"
  | "chemistry"
  | "biology"
  | "english"
  | "french"
  | "history"
  | "economics"
  | "geography"
  | "business"
  | "theatre"
  | "tok"
  | "ee"
  | "general"
  | "cas";

export type Subject = { id: SubjectId; name: string; shortName: string };

export const SUBJECTS: Subject[] = [
  { id: "math_aa", name: "Math AA", shortName: "Math AA" },
  { id: "math_ai", name: "Math AI", shortName: "Math AI" },
  { id: "physics", name: "Physics", shortName: "Physics" },
  { id: "chemistry", name: "Chemistry", shortName: "Chem" },
  { id: "biology", name: "Biology", shortName: "Bio" },
  { id: "english", name: "English", shortName: "English" },
  { id: "french", name: "French", shortName: "French" },
  { id: "history", name: "History", shortName: "History" },
  { id: "economics", name: "Economics", shortName: "Econ" },
  { id: "geography", name: "Geography", shortName: "Geo" },
  { id: "business", name: "Business", shortName: "Business" },
  { id: "theatre", name: "Theatre", shortName: "Theatre" },
  { id: "tok", name: "TOK", shortName: "TOK" },
  { id: "ee", name: "EE", shortName: "EE" },
  { id: "general", name: "General", shortName: "General" },
  { id: "cas", name: "CAS", shortName: "CAS" },
];

export function getSubject(id: SubjectId | null): Subject | null {
  if (!id) return null;
  return SUBJECTS.find((s) => s.id === id) ?? null;
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

// Forty-Five puzzle source format (content/forty-five/**/*.json).
// Each file holds an array of puzzles (one batch). Imported as 'draft'.

export const SUBJECTS = [
  "Biology", "Chemistry", "Physics", "Maths AA", "Maths AI", "Economics", "Business",
  "Psychology", "Geography", "History", "Computer Science", "ESS", "English", "TOK",
] as const;
export type Subject = (typeof SUBJECTS)[number];
/** A group may also mix subjects (e.g. "___ cycle": Krebs, Business, Carbon…). */
export const GROUP_SUBJECTS = [...SUBJECTS, "Mixed"] as const;
export type GroupSubject = (typeof GROUP_SUBJECTS)[number];

export type SourceGroup = {
  label: string; // shown on reveal, e.g. "SI base units"
  difficulty: 1 | 2 | 3 | 4;
  subject: GroupSubject; // which IB subject the group comes from
  words: [string, string, string, string];
  explanation: string; // one line on why; shown after the game
};

export type SourceTrap = {
  word: string; // a word in this puzzle…
  decoy: string; // …that looks like it belongs to this other group's label (or another subject)
  why: string;
};

export type SourcePuzzle = {
  slug: string; // stable id, e.g. "d-001"
  mode: "daily" | "subject";
  subject: Subject | null; // null for daily
  groups: [SourceGroup, SourceGroup, SourceGroup, SourceGroup];
  traps: SourceTrap[]; // at least one cross-subject trap
};

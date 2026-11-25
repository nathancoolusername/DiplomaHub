// Deadline: game constants shared by the game UI and Admin.
// The rules themselves live in migration 56; these only describe them.

export const TURN_MS = 10_000;
export const GRACE_MS = 250;
export const MAX_PLAYERS = 8;
export const START_EXTENSIONS = 2;
export const MAX_EXTENSIONS = 4;
export const BONUS_EVERY = 45;

/** Rarity → points and colour: +1 grey, +2 blue, +3/+4 orange, +5/+6 purple, +7 gold. */
export const TIERS: Record<number, { label: string; color: string }> = {
  1: { label: "Common", color: "#9ca3af" },
  2: { label: "Familiar", color: "#3b82f6" },
  3: { label: "Solid", color: "#f97316" },
  4: { label: "Solid", color: "#f97316" },
  5: { label: "Deep cut", color: "#8b5cf6" },
  6: { label: "Deep cut", color: "#8b5cf6" },
  7: { label: "A perfect 7", color: "#d4a017" }, // the top IB grade: the rarest answers
};

export const REACTIONS = ["😂", "💀", "🔥", "👏", "😭", "😮", "🫡", "🧠"] as const;

/** How subjects show in the picker (bank keys → names). "mixed" in the bank is cross-subject IB prompts. */
export const SUBJECT_LABELS: Record<string, string> = {
  mixed: "IB general", biology: "Biology", chemistry: "Chemistry", physics: "Physics", math: "Maths", geography: "Geography",
  history: "History", economics: "Economics", psychology: "Psychology", "computer science": "Computer Science", business: "Business",
  tok: "TOK", ess: "ESS", english: "English", flags: "Flags",
};
/** Flags mode: each prompt is one flag ("flag:<code>"); a mode of its own, never in Mixed. */
export const FLAGS_SUBJECT = "flags";
/** The flag code when a prompt is a flag, else null. */
export const flagCodeOf = (subject: string, prompt: string): string | null =>
  subject === FLAGS_SUBJECT && /^flag:[a-z]{2}(-[a-z]{2,3})?$/.test(prompt) ? prompt.slice(5) : null;
export const subjectLabel = (s: string) => SUBJECT_LABELS[s] ?? s.replace(/\b\w/g, (c) => c.toUpperCase());
/** Below this many prompts, the picker suggests ticking more (the game starts repeating sooner). */
export const FEW_PROMPTS = 12;

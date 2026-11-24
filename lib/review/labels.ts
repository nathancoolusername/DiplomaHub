// Client-safe names and constants for coursework reviews. The criteria
// themselves (lib/review/criteria.ts, markschemes.ts) are server-only.

export type ReviewKind = "ia" | "ee" | "tok_essay" | "tok_exhibition";
export type ReviewLevel = "SL" | "HL";

export const KIND_LABELS: Record<ReviewKind, string> = {
  ia: "Internal assessment",
  ee: "Extended essay",
  tok_essay: "TOK essay",
  tok_exhibition: "TOK exhibition",
};

/** What the "question" field is called for each kind of work. */
export const QUESTION_LABEL: Record<ReviewKind, string> = {
  ia: "Research question or aim",
  ee: "Research question",
  tok_essay: "Prescribed title (word for word)",
  tok_exhibition: "IA prompt (word for word)",
};

export const REVIEWS_PER_MONTH = 6;

/** Subjects whose IA can be reviewed, with what the IA is called. */
export const IA_SUBJECTS: Record<string, string> = {
  math_aa: "Mathematical exploration",
  math_ai: "Mathematical exploration",
  biology: "Scientific investigation",
  chemistry: "Scientific investigation",
  physics: "Scientific investigation",
  economics: "Commentary (one of the three)",
  business: "Business research project",
  history: "Historical investigation",
  cs: "Computational solution (documentation)",
  geography: "Fieldwork written report",
  ess: "ESS investigation",
};

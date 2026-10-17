// Domain types for DiplomaPro: what pages and components receive.
//
// These are deliberately independent of where the data comes from. Today
// lib/mock produces them; later the Supabase queries in lib/data will map
// their rows into exactly these shapes, so no component changes. See
// docs/DATA_LAYER.md for how each type maps to a table or RPC.

export type SubjectId = string; // same ids as the Hub, e.g. "math_aa", "physics"
export type Level = "HL" | "SL";
/** P1A / P1B: the two sections of a science Paper 1 (multiple choice, then data-based). */
export type PaperCode = "P1" | "P1A" | "P1B" | "P2" | "P3";

/** The four boxes on a subject page. */
export type PracticeType = "mcq_short" | "essay" | "mock" | "grade_own";

export type PaperSpec = {
  code: PaperCode;
  /** Minutes and total marks per level; a level is absent if it doesn't sit the paper. */
  duration: Partial<Record<Level, number>>;
  totalMarks: Partial<Record<Level, number>>;
  calculator: boolean;
};

export type Subject = {
  id: SubjectId;
  name: string; // "Mathematics: Analysis & Approaches"
  shortName: string; // "Maths AA"
  ibGroup: number;
  supportedTypes: PracticeType[];
  papers: PaperSpec[];
  /** The matching resources.subject_tag, or null if there are no resources for it yet. */
  resourceTag: string | null;
};

export type UserSubject = {
  subject: Subject;
  level: Level;
  isCore: boolean;
};

// ── Syllabus ─────────────────────────────────────────────────────────────

export type Subtopic = {
  /** Stable id; for now the syllabus code ("5.14"), which is what questions reference. */
  id: string;
  code: string;
  /** Full syllabus wording. */
  name: string;
  /** For tight spaces (tiles, suggestions): the name up to its first ";". */
  shortName: string;
  hlOnly: boolean;
};

export type Topic = {
  code: string;
  name: string;
  subtopics: Subtopic[];
};

// ── Strength map ─────────────────────────────────────────────────────────

export type StrengthLevel = "none" | "weak" | "developing" | "solid" | "strong" | "mastered";

export type SubtopicStrength = Subtopic & {
  score: number | null; // 0–1, null until the first answer
  answeredCount: number;
  level: StrengthLevel;
};

export type StrengthMap = {
  subject: Subject;
  level: Level;
  topics: (Omit<Topic, "subtopics"> & { subtopics: SubtopicStrength[] })[];
  /** Average of subtopics with enough data; null if none have enough yet. */
  overall: number | null;
  /** Up to a few weakest subtopics that have enough data. */
  weakest: SubtopicStrength[];
};

// ── Questions ────────────────────────────────────────────────────────────

export type QuestionType = "mcq" | "short" | "extended";

export type QuestionPart = {
  label: string; // "a", "b(i)", or "whole"
  marks: number;
  textMd: string;
};

export type McqOption = { key: string; textMd: string };

/**
 * A question as the player sees it: never includes answers, markschemes
 * or verification data. Those come separately via revealMarkscheme().
 */
export type Question = {
  id: string;
  subjectId: SubjectId;
  subtopicId: string;
  type: QuestionType;
  paper: PaperCode;
  calculator: boolean;
  hlOnly: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  totalMarks: number;
  stemMd: string;
  parts: QuestionPart[];
  options: McqOption[] | null; // MCQ only
  /** Diagrams shown after the stem, before the parts. Sanitized SVG, drawn with currentColor. */
  figures?: QuestionFigure[];
};

/** An inline SVG diagram. `svg` is already sanitized on the server (lib/data/figures.ts); `alt` describes it for screen readers. */
export type QuestionFigure = { svg: string; alt: string };

export type MarkPoint = {
  code: string; // "M1", "A1", "R1", "A2" …
  marks: number;
  /** Shown in brackets, e.g. (M1): awarded if later correct work implies it. */
  implied: boolean;
  text: string; // Markdown + LaTeX
  note?: string;
};

export type PartMarkscheme = {
  label: string;
  answerMd: string;
  markschemeMd: string;
  markPoints: MarkPoint[];
};

/** One marking criterion for an essay (e.g. "Knowledge and understanding", 10 marks) and its markbands. */
export type EssayCriterion = {
  name: string;
  maxMarks: number;
  bands: { min: number; max: number; descriptor: string }[];
};

export type Markscheme = {
  questionId: string;
  parts: PartMarkscheme[];
  correctOption: string | null; // MCQ only
  workedSolutionMd: string;
  /** Essays (type "extended"): criteria with markbands; the student picks a mark per criterion. */
  criteria: EssayCriterion[] | null;
  /** Essays: what a strong answer would include (shown after marking). */
  feedbackPoints: string[] | null;
};

// ── Sets and attempts ────────────────────────────────────────────────────

export type SetSettings = {
  level: Level;
  timer: "off" | "exam_pace";
  mcqFeedback: "each" | "end";
  answerOn: "screen" | "paper";
};

export type PracticeSet = {
  id: string;
  title: string;
  subjectId: SubjectId;
  practiceType: PracticeType;
  settings: SetSettings;
  questionIds: string[];
  shareCode: string | null;
  /** In "My sets". */
  saved: boolean;
  /** The "Build your set" settings it was made with (sets from before migration 13 have none). */
  build: Partial<BuildSettings> | null;
};

/** The "Build your set" form. Fields that don't apply to a practice type are ignored. */
export type BuildSettings = {
  subtopicIds: string[];
  questionType: "mcq" | "short" | "mix";
  count: number;
  difficulty: "easier" | "exam" | "harder" | "mixed";
  paper: PaperCode | null; // null = any paper
  /** false = calculator not allowed (non-calculator questions only); true = either. */
  calculator: boolean;
  includeHl: boolean;
  timer: SetSettings["timer"];
  mcqFeedback: SetSettings["mcqFeedback"];
  answerOn: SetSettings["answerOn"];
};

/** Live count shown while building: how many bank questions fit, and how fresh they are. */
export type SetPreview = {
  matching: number;
  unseen: number;
  answeredWrong: number;
  /** What Go would build right now. */
  setSize: number;
  writtenInSet: number;
  marksInSet: number;
};

export type AttemptStatus = "in_progress" | "marking" | "marked";

export type Attempt = {
  id: string;
  setId: string;
  startedAt: string; // ISO
  finishedAt: string | null;
  markedAt: string | null;
  status: AttemptStatus;
  timed: boolean;
};

export type MarkedBy = "auto" | "self" | "bro";

export type AttemptAnswer = {
  questionId: string;
  /** Short/extended: one text per part label. */
  partAnswers: Record<string, string>;
  selectedOption: string | null;
  onPaper: boolean;
  /** Indexes of ticked mark points, per part label. */
  tickedPoints: Record<string, number[]>;
  /** Essays: the mark chosen for each criterion, by criterion name. */
  criterionMarks: Record<string, number>;
  marksAwarded: number | null;
  markedBy: MarkedBy | null;
  flagged: boolean;
  timeSpentS: number;
  /** True once the student has seen the markscheme for this question. */
  revealed: boolean;
};

/** What the client sends when an answer changes. Marks are always computed on the server. */
export type AnswerDraft = Pick<
  AttemptAnswer,
  "partAnswers" | "selectedOption" | "onPaper" | "tickedPoints" | "criterionMarks" | "flagged" | "timeSpentS"
>;

export type StrengthChange = {
  subtopic: Subtopic;
  before: { score: number | null; level: StrengthLevel };
  after: { score: number | null; level: StrengthLevel };
};

export type AttemptResult = {
  attempt: Attempt;
  set: PracticeSet;
  subject: Subject;
  items: {
    question: Question;
    subtopic: Subtopic;
    answer: AttemptAnswer;
    markscheme: Markscheme;
  }[];
  marksEarned: number;
  marksPossible: number;
  timeTakenS: number;
  examPaceS: number;
  strengthChanges: StrengthChange[];
  isFirstResult: boolean;
};

// ── Home / Hub ───────────────────────────────────────────────────────────

export type Viewer = {
  id: string;
  displayName: string;
  firstName: string;
  isPro: boolean;
  examSessionId: string | null;
};

export type ExamSession = {
  id: string;
  label: string; // "May 2027"
  firstExamDate: string; // ISO date
};

export type CalendarItemKind = "deadline" | "test" | "mock" | "study";

export type CalendarItem = {
  id: string;
  title: string;
  kind: CalendarItemKind;
  subjectId: SubjectId | null;
  startsAt: string; // ISO
  /**
   * Something due that needs work beforehand: "What is it?" set to Deadline,
   * or (items from before DiplomaPro) an IB component or task. University
   * events and the like are only mentioned, never "planned for".
   */
  isDeadline: boolean;
  hasTimer: boolean;
  setId: string | null;
};

/** A finished set in "Past sets" (subject page and Practice). */
export type PastSet = {
  attempt: Attempt;
  set: PracticeSet;
  /** Marked sets only; null while marking is unfinished. */
  scorePct: number | null;
};

/** An unfinished set in "Pick up where you left off" (Hub and Practice). */
export type RecentSession = {
  attempt: Attempt;
  set: PracticeSet;
  answered: number;
  total: number;
};

/** Hub's "Your practice" card: one bar per day, oldest first. */
export type PracticeStats = {
  days: { date: string; answered: number }[];
  answered: number;
  /** Marks earned / marks possible; null until something has been marked. */
  accuracy: number | null;
  practisedS: number;
};

// ── Leaderboard (practice points) ────────────────────────────────────────

/** "week" resets every Monday 00:00 UTC. */
export type LeaderboardPeriod = "week" | "all";

export type LeaderboardRow = {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  isMe: boolean;
  /** Set on the Contribution board, where each row links to the profile. */
  userId?: string;
};
export type LeaderboardPage = { total: number; rows: LeaderboardRow[] };
export type LeaderboardStanding = { period: LeaderboardPeriod; points: number; rank: number | null; total: number; hidden: boolean };

/** Bro's two-or-three sentence take on the week (Pro). */
export type BroBrief = { text: string; generatedAt: string };

/** Home's "Getting started" card: shown until every step is done. */
export type GettingStarted = {
  pickSubjects: boolean;
  addCountdownTest: boolean;
  finishFirstSet: boolean;
  saveOrEnterCode: boolean;
};

// ── Suggestions ──────────────────────────────────────────────────────────

export type SuggestionSurface = "home" | "hub" | "subject" | "build";

/**
 * Suggestions carry ids, never URLs: links are built in code
 * (lib/practice/links.ts), so neither rules nor Bro can produce a broken one.
 */
export type SuggestionAction =
  | { type: "practice"; subjectId: SubjectId; practiceType: PracticeType; subtopicIds: string[] }
  | { type: "subject"; subjectId: SubjectId }
  | { type: "add_item" }
  /** Opens Hub's Add item as a study session for this deadline (hub_items.id). */
  | { type: "plan_time"; itemId: string };

export type Suggestion = {
  id: string;
  text: string;
  /** Absent for suggestions that only tell you something (no button). */
  actionLabel?: string;
  action?: SuggestionAction;
  source: "rule" | "bro";
  /** Short "why" chips shown with the suggestion, e.g. "Test in 2 days". */
  reasons?: string[];
};

// ── Usage ────────────────────────────────────────────────────────────────

export type UsageItem = {
  feature: string; // a FeatureKey from lib/plans.ts
  label: string;
  used: number;
  limit: number | null; // null = unlimited
  period: "week" | "month";
  resetsAt: string; // ISO
};

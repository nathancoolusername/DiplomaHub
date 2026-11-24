// The shapes stored in review_drafts.precheck and review_drafts.report, and
// the JSON schemas the model must follow (structured outputs). Safe to import
// on the client.

export type Precheck = {
  readable: boolean;
  /** Does it look like the kind of work the project says (an EE, a TOK essay…)? */
  matches_kind: boolean;
  matches_reason: string;
  page_count: number;
  /** Words in the main body (an estimate, excluding references, tables, appendices). */
  word_estimate: number;
  /** A name, candidate number or school name appears. */
  has_identifying_info: boolean;
  identifying_detail: string;
  /** The title or research question as written in the work. */
  title_found: string;
  issues: string[];
};

export type CommentKind = "strength" | "issue" | "suggestion";

export type ReportCriterion = {
  id: string;
  /** The file doesn't contain what this criterion needs (e.g. no RPF for EE reflection). */
  not_assessed: boolean;
  mark_low: number;
  mark_high: number;
  /** Why this band and not the one above. */
  why: string;
  strengths: string[];
  to_raise: string[];
};

export type ReportComment = {
  page: number;
  /** A short exact quote from the work that the comment is about. */
  quote: string;
  criterion_id: string;
  kind: CommentKind;
  comment: string;
};

export type ReportPriority = { title: string; detail: string; criterion_id: string };

export type Report = {
  summary: string;
  criteria: ReportCriterion[];
  comments: ReportComment[];
  priorities: ReportPriority[];
  /** Compared with the previous draft (empty on a first draft). */
  progress: { summary: string; addressed_priorities: number[] };
  notes: string[];
};

const str = { type: "string" } as const;
const int = { type: "integer" } as const;
const strs = { type: "array", items: str } as const;

export const PRECHECK_SCHEMA = {
  type: "object",
  properties: {
    readable: { type: "boolean" },
    matches_kind: { type: "boolean" },
    matches_reason: str,
    page_count: int,
    word_estimate: int,
    has_identifying_info: { type: "boolean" },
    identifying_detail: str,
    title_found: str,
    issues: strs,
  },
  required: ["readable", "matches_kind", "matches_reason", "page_count", "word_estimate", "has_identifying_info", "identifying_detail", "title_found", "issues"],
  additionalProperties: false,
} as const;

export const REPORT_SCHEMA = {
  type: "object",
  properties: {
    summary: str,
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: { id: str, not_assessed: { type: "boolean" }, mark_low: int, mark_high: int, why: str, strengths: strs, to_raise: strs },
        required: ["id", "not_assessed", "mark_low", "mark_high", "why", "strengths", "to_raise"],
        additionalProperties: false,
      },
    },
    comments: {
      type: "array",
      items: {
        type: "object",
        properties: { page: int, quote: str, criterion_id: str, kind: { type: "string", enum: ["strength", "issue", "suggestion"] }, comment: str },
        required: ["page", "quote", "criterion_id", "kind", "comment"],
        additionalProperties: false,
      },
    },
    priorities: {
      type: "array",
      items: {
        type: "object",
        properties: { title: str, detail: str, criterion_id: str },
        required: ["title", "detail", "criterion_id"],
        additionalProperties: false,
      },
    },
    progress: {
      type: "object",
      properties: { summary: str, addressed_priorities: { type: "array", items: int } },
      required: ["summary", "addressed_priorities"],
      additionalProperties: false,
    },
    notes: strs,
  },
  required: ["summary", "criteria", "comments", "priorities", "progress", "notes"],
  additionalProperties: false,
} as const;

/** Total mark range from the criteria that were assessed, and the maximum for those. */
export function reportTotal(r: Report, maxById?: Record<string, number>): { low: number; high: number; max: number | null } {
  const assessed = r.criteria.filter((c) => !c.not_assessed);
  return {
    low: assessed.reduce((n, c) => n + c.mark_low, 0),
    high: assessed.reduce((n, c) => n + c.mark_high, 0),
    max: maxById ? assessed.reduce((n, c) => n + (maxById[c.id] ?? 0), 0) : null,
  };
}

/** Clamp every mark into 0..max for its criterion and fix low > high, so a bad reply can't show nonsense. */
export function sanitizeReport(r: Report, maxById: Record<string, number>): Report {
  const criteria = r.criteria
    .filter((c) => c.id in maxById)
    .map((c) => {
      const max = maxById[c.id];
      const a = Math.max(0, Math.min(max, Math.round(c.mark_low)));
      const b = Math.max(0, Math.min(max, Math.round(c.mark_high)));
      return { ...c, not_assessed: !!c.not_assessed, mark_low: Math.min(a, b), mark_high: Math.max(a, b) };
    });
  return {
    ...r,
    criteria,
    comments: r.comments.filter((c) => c.criterion_id in maxById || c.criterion_id === "general").slice(0, 40),
    priorities: r.priorities.slice(0, 3),
  };
}

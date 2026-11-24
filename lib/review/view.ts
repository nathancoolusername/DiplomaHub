import "server-only";

// What the review pages need from a criteria set: names, maximums and our own
// summaries. The official criteria text stays on the server (markschemes.ts).
import { criteriaFor, criteriaTotal, type ReviewContext } from "./criteria";
import type { ReviewKind } from "./labels";
import type { CriteriaView } from "./view-types";

export type { CriteriaView } from "./view-types";

export function criteriaView(kind: ReviewKind, subjectId: string | null, ctx: ReviewContext): CriteriaView | null {
  const set = criteriaFor(kind, subjectId, ctx);
  if (!set) return null;
  return {
    label: set.label,
    level: set.criteria.some((c) => c.level) ? (ctx.level ?? "SL") : null,
    total: criteriaTotal(set),
    limits: set.limits,
    source: set.source,
    criteria: set.criteria.map(({ id, name, max, summary }) => ({ id, name, max, summary })),
  };
}

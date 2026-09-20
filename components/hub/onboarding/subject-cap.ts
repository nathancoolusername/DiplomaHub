import type { SubjectId } from "../mock-data";

// Every IB Diploma student takes exactly 6 subject courses on top of the
// TOK/EE/CAS core (plus "General" as a catch-all, treated the same way
// here) — these four are pre-checked and free, they never count against
// the cap, so the cap only applies to the other 12 subject choices. A
// user's own custom subject counts the same as a built-in one here — it
// represents a real 7th course only in the sense that it occupies one of
// the 6 slots, same as picking any other subject would.
export const MAX_SUBJECTS = 6;
export const CORE_SUBJECT_IDS: SubjectId[] = ["ee", "tok", "cas", "general"];

export function isCoreSubject(id: SubjectId): boolean {
  return CORE_SUBJECT_IDS.includes(id);
}

export function countNonCore(selected: Set<SubjectId>): number {
  let count = 0;
  for (const id of selected) if (!isCoreSubject(id)) count++;
  return count;
}

// Toggles `id` in `selected`, silently refusing to add a 7th non-core
// subject rather than bumping one out — the disabled pill styling in
// StepPickSubjects is what actually communicates the cap to the user.
export function toggleWithCap(selected: Set<SubjectId>, id: SubjectId): Set<SubjectId> {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
    return next;
  }
  if (!isCoreSubject(id) && countNonCore(next) >= MAX_SUBJECTS) return selected;
  next.add(id);
  return next;
}

// The subjects a user actually sees (chips, Add Item dropdown, import
// subject-matching) — their picks capped at MAX_SUBJECTS plus the
// always-on core, or just the core alone when they haven't picked
// anything yet (pre-onboarding, or explicitly skipped) — nothing is
// assumed about which of the 12 real subjects they take until they say
// so. Shared between the client (hub.tsx) and server actions
// (ics-import.ts) so "the user's subjects" means the same thing in both
// places.
export function computeMySubjectIds(chosen: SubjectId[] | null): Set<SubjectId> {
  if (!chosen || chosen.length === 0) return new Set(CORE_SUBJECT_IDS);
  const capped = chosen.filter((id) => !isCoreSubject(id)).slice(0, MAX_SUBJECTS);
  return new Set<SubjectId>([...capped, ...CORE_SUBJECT_IDS]);
}

import type { Level } from "@/lib/data/types";
import type { Booklet, BookletSection } from "./types";
import { MATH_AA_BOOKLET } from "./math_aa";
import { PHYSICS_BOOKLET } from "./physics";
import { CHEMISTRY_BOOKLET } from "./chemistry";

export type { Booklet, BookletEntry, BookletSection, BookletTable } from "./types";

/** The one-time "the booklet is here, press B" tip in the player (an announcement id, remembered per account). */
export const BOOKLET_TIP_ID = "news-booklet";

// Subjects whose exam comes with a formula or data booklet. More are added
// here as they're written (Maths AI next).
const BOOKLETS: Record<string, Booklet> = {
  math_aa: MATH_AA_BOOKLET,
  physics: PHYSICS_BOOKLET,
  chemistry: CHEMISTRY_BOOKLET,
};

/** The booklet as the student gets it in the exam: SL students don't see HL-only formulas. */
export function bookletFor(subjectId: string, level: Level): Booklet | null {
  const b = BOOKLETS[subjectId];
  if (!b) return null;
  if (level === "HL") return b;
  const sections: BookletSection[] = b.sections
    .map((s) => ({ ...s, entries: s.entries.filter((e) => !e.hl), tables: s.tables?.filter((t) => !t.hl) }))
    .filter((s) => s.entries.length > 0 || (s.tables?.length ?? 0) > 0);
  return { ...b, sections };
}

/**
 * The syllabus topic a question's subtopic belongs to: the longest topic code
 * it starts with ("5.14" → "5", "S1.4" → "S1", "TI" → "T"), or null.
 */
export function topicOfSubtopic(subtopicId: string, topicCodes: readonly string[]): string | null {
  return [...topicCodes].sort((a, b) => b.length - a.length).find((c) => subtopicId === c || subtopicId.startsWith(c)) ?? null;
}

/**
 * Formulas whose name or keywords match every word of the query; if none in
 * a section do but its title does ("trig identities"), the whole section.
 */
export function searchBooklet(b: Booklet, query: string): BookletSection[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return b.sections;
  const matches = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  return b.sections
    .map((s) => {
      const entries = s.entries.filter((e) => matches([e.name, ...(e.keywords ?? [])].join(" ")));
      // Tables: the whole table if its caption matches, else just the matching rows ("Cu", "C=O").
      const tables = (s.tables ?? []).flatMap((t) => {
        if (matches([t.caption, ...(t.keywords ?? [])].join(" "))) return [t];
        const rows = t.rows.filter((r) => matches(r.join(" ")));
        return rows.length > 0 ? [{ ...t, rows }] : [];
      });
      if (entries.length === 0 && tables.length === 0 && matches(s.title)) return s;
      return { ...s, entries, tables };
    })
    .filter((s) => s.entries.length > 0 || (s.tables?.length ?? 0) > 0);
}

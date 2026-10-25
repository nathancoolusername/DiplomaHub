import type { Level } from "@/lib/data/types";
import type { Booklet, BookletDiagram, BookletSection, BookletTable } from "./types";
import { MATH_AA_BOOKLET } from "./math_aa";
import { PHYSICS_BOOKLET } from "./physics";
import { CHEMISTRY_BOOKLET } from "./chemistry";
import { BIOLOGY_BOOKLET } from "./biology";

export type { Booklet, BookletDiagram, BookletEntry, BookletSection, BookletTable } from "./types";
import { ELEMENTS, type ElementData } from "./elements";

/** Elements whose symbol, name or atomic number matches a booklet search ("Cu", "copper", "29"). */
export function searchElements(query: string, limit = 6): ElementData[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = ELEMENTS.filter((e) => e.symbol.toLowerCase() === q || String(e.z) === q || e.name.toLowerCase() === q);
  const starts = ELEMENTS.filter((e) => !exact.includes(e) && q.length >= 2 && e.name.toLowerCase().startsWith(q));
  return [...exact, ...starts].slice(0, limit);
}

/** The one-time "the booklet is here, press B" tip in the player (an announcement id, remembered per account). */
export const BOOKLET_TIP_ID = "news-booklet";

// Subjects whose exam comes with a formula or data booklet. More are added
// here as they're written (Maths AI next).
const BOOKLETS: Record<string, Booklet> = {
  math_aa: MATH_AA_BOOKLET,
  physics: PHYSICS_BOOKLET,
  chemistry: CHEMISTRY_BOOKLET,
  biology: BIOLOGY_BOOKLET,
};

/** The booklet as the student gets it in the exam: SL students don't see HL-only formulas. */
export function bookletFor(subjectId: string, level: Level): Booklet | null {
  const b = BOOKLETS[subjectId];
  if (!b) return null;
  if (level === "HL") return b;
  const diagrams = b.diagrams?.filter((d) => !d.hl);
  const sl = new Set(diagrams?.map((d) => d.id));
  const sections: BookletSection[] = b.sections
    .map((s) => ({ ...s, entries: s.entries.filter((e) => !e.hl), tables: s.tables?.filter((t) => !t.hl), diagrams: s.diagrams?.filter((id) => sl.has(id)) }))
    .filter(hasContent);
  return { ...b, sections, diagrams };
}

/** A section with anything left in it to show. */
export function hasContent(s: BookletSection): boolean {
  return s.entries.length > 0 || (s.tables?.length ?? 0) > 0 || (s.diagrams?.length ?? 0) > 0 || !!s.periodicTable;
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
      const diagrams = (s.diagrams ?? []).filter((id) => {
        const d = b.diagrams?.find((x) => x.id === id);
        return !!d && matches([d.title, d.caption, ...(d.keywords ?? [])].join(" "));
      });
      if (entries.length === 0 && tables.length === 0 && diagrams.length === 0 && matches(s.title)) return s;
      return { ...s, entries, tables, diagrams, periodicTable: s.periodicTable && matches(`${s.title} periodic table elements`) };
    })
    .filter(hasContent);
}

/** Everything the reference viewer lists for a booklet, in booklet order. */
export type ReferenceItem =
  | { kind: "periodic"; id: "periodic"; title: string; topic: string }
  | { kind: "table"; id: string; title: string; topic: string; table: BookletTable }
  | { kind: "diagram"; id: string; title: string; topic: string; diagram: BookletDiagram };

export function referenceItems(b: Booklet): ReferenceItem[] {
  const items: ReferenceItem[] = [];
  for (const s of b.sections) {
    if (s.periodicTable) items.push({ kind: "periodic", id: "periodic", title: "Periodic table", topic: s.topic });
    for (const t of s.tables ?? []) items.push({ kind: "table", id: tableId(t.caption), title: t.caption, topic: s.topic, table: t });
    for (const id of s.diagrams ?? []) {
      const d = b.diagrams?.find((x) => x.id === id);
      if (d && !items.some((i) => i.id === `diagram:${id}`)) items.push({ kind: "diagram", id: `diagram:${id}`, title: d.title, topic: s.topic, diagram: d });
    }
  }
  return items;
}

/** A table's id in the viewer (from its caption). */
export function tableId(caption: string): string {
  return `table:${caption.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

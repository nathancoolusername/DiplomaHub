// A subject's formula / data booklet, shown beside questions in the player.
// DiplomaHub's own write-up: the formulas a student is given in the exam,
// grouped and named our way (formulas themselves are facts; the IB's
// booklet layout and wording are not copied). Check every entry against the
// current IB booklet before adding or changing it.

export type BookletEntry = {
  /** What it is, in plain words ("Sum of an arithmetic sequence"). */
  name: string;
  /** One or more LaTeX expressions; several are alternatives or a pair. */
  math: string[];
  /** When it holds ("r \\ne 1"), as LaTeX. */
  condition?: string;
  /** Only in the HL booklet. */
  hl?: boolean;
  /** Extra search words ("AP", "series"). */
  keywords?: string[];
};

/** Data given as a table (the periodic table, bond enthalpies …). Cells are plain text. */
export type BookletTable = {
  caption: string;
  /** Column headings, with units ("Bond enthalpy / kJ mol⁻¹"). */
  columns: string[];
  rows: string[][];
  /** Only in the HL booklet. */
  hl?: boolean;
  keywords?: string[];
};

/** One of our own drawings, shown in the reference viewer (components/practice/player/diagrams). */
export type BookletDiagram = {
  /** Key into the drawings registry ("water", "sarcomere"). */
  id: string;
  title: string;
  /** Syllabus topic it belongs to, like a section's. */
  topic: string;
  /** Only in the HL booklet. */
  hl?: boolean;
  /** What the drawing shows, in a sentence. */
  caption: string;
  /** Short facts beside the drawing. */
  facts?: string[];
  keywords?: string[];
};

export type BookletSection = {
  /** The syllabus topic it belongs to ("1", "A", "S1" …), so the player opens at the question's topic. */
  topic: string;
  title: string;
  entries: BookletEntry[];
  tables?: BookletTable[];
  /** Show the "Open the periodic table" card here (Chemistry: the element data lives in lib/booklets/elements.ts). */
  periodicTable?: boolean;
  /** Diagrams (ids from Booklet.diagrams) shown as cards in this section. */
  diagrams?: string[];
};

export type Booklet = {
  subjectId: string;
  title: string;
  /** The search box's placeholder ("Search formulas and data"). */
  searchHint?: string;
  sections: BookletSection[];
  /** Drawings, opened in the reference viewer. */
  diagrams?: BookletDiagram[];
  /**
   * Tables open in the full-screen reference viewer (with the periodic table
   * and the diagrams) instead of inline in the booklet panel.
   */
  referenceViewer?: boolean;
};

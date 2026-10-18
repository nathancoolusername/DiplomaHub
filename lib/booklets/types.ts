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

export type BookletSection = {
  /** The syllabus topic it belongs to ("1", "A", "S1" …), so the player opens at the question's topic. */
  topic: string;
  title: string;
  entries: BookletEntry[];
  tables?: BookletTable[];
};

export type Booklet = {
  subjectId: string;
  title: string;
  /** The search box's placeholder ("Search formulas and data"). */
  searchHint?: string;
  sections: BookletSection[];
};

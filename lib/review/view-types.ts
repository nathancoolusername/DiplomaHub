export type CriteriaView = {
  label: string;
  /** Shown when the level changes the marking (Maths). */
  level: "SL" | "HL" | null;
  total: number;
  limits: { words?: number; pagesMin?: number; pagesMax?: number; note?: string };
  /** Which IB guide the criteria come from. */
  source: string;
  criteria: { id: string; name: string; max: number; summary: string }[];
};

/**
 * Grid columns for a row of 1–3 suggestions: always one column per card,
 * so the row fills the width instead of wrapping into a half-empty line.
 */
export function suggestionGridCols(count: number): string {
  if (count >= 3) return "md:grid-cols-3";
  if (count === 2) return "md:grid-cols-2";
  return "grid-cols-1";
}

import type { Question } from "@/lib/data/types";

/** "a" → "(a)", "b(i)" → "(b)(i)", "whole" → "". */
export function partHeading(label: string): string {
  if (label === "whole") return "";
  const m = label.match(/^([a-z])(?:\((.+)\))?$/i);
  if (!m) return label;
  return m[2] ? `(${m[1]})(${m[2]})` : `(${m[1]})`;
}

export function paperLabel(q: Pick<Question, "paper" | "calculator" | "type">): string {
  // Calculators don't apply to essays.
  if (q.type === "extended") return `Paper ${q.paper.slice(1)}`;
  return `Paper ${q.paper.slice(1)} · ${q.calculator ? "Calculator" : "No calculator"}`;
}

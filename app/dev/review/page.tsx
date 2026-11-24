import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReviewDraft, ReviewProject } from "@/lib/data/supabase/reviews";
import type { Report } from "@/lib/review/report";
import { criteriaView } from "@/lib/review/view";
import { ProjectView } from "@/components/review/ProjectView";

export const metadata: Metadata = { title: "Coursework review (demo)", robots: { index: false } };

// Dev-only: the /review project page with sample data (no sign-in, migration
// 65 or API calls needed). ?s=done|checked|marking|failed. Not served in production.
const REPORT: Report = {
  summary:
    "A clear, well-organised exploration with a genuine personal angle. The modelling is correct, but the mathematics stays close to the syllabus and the reflection mostly describes what you did rather than questioning it, which caps D and E.",
  criteria: [
    { id: "A", not_assessed: false, mark_low: 3, mark_high: 3, why: "Coherent and well organised, but sections 3 and 4 repeat the same derivation, so it isn't yet concise.", strengths: ["The aim is stated early and the conclusion returns to it."], to_raise: ["Cut the repeated derivation in section 4 and refer back to section 3."] },
    { id: "B", not_assessed: false, mark_low: 3, mark_high: 4, why: "Notation is mostly right; a few graphs lack labelled axes and x is used for two different things.", strengths: ["Key terms are defined before use."], to_raise: ["Label every axis with units.", "Use a different letter for the time variable in section 5."] },
    { id: "C", not_assessed: false, mark_low: 2, mark_high: 2, why: "Significant engagement: you collected your own data and chose the context yourself, but the questions you ask stay predictable.", strengths: ["Your own survey data drives the model."], to_raise: ["Ask a question of your own that the textbook wouldn't: what happens if the rumour has a 'debunk' rate?"] },
    { id: "D", not_assessed: false, mark_low: 1, mark_high: 2, why: "Reflection is mostly descriptive (what you did) with little on what the results mean or how reliable they are.", strengths: [], to_raise: ["After each result, say what it means for the real situation and how far you trust it."] },
    { id: "E", not_assessed: false, mark_low: 4, mark_high: 4, why: "Relevant, correct mathematics at the level of the course and good understanding, but no extension beyond it.", strengths: ["The logistic fit is correct and well explained."], to_raise: ["Justify the model choice by comparing it with an alternative (e.g. exponential) using residuals."] },
  ],
  comments: [
    { page: 2, quote: "In this exploration I will investigate", criterion_id: "A", kind: "strength", comment: "A clear aim, early. Keep it." },
    { page: 4, quote: "Figure 2: spread over time", criterion_id: "B", kind: "issue", comment: "The axes have no labels or units, so the reader has to guess what is plotted." },
    { page: 7, quote: "this shows the model is accurate", criterion_id: "D", kind: "issue", comment: "Accurate by what measure? Say how close, and what the remaining gap could be caused by." },
    { page: 9, quote: "I collected responses from 42 students", criterion_id: "C", kind: "strength", comment: "Your own data is real personal engagement." },
    { page: 11, quote: "the carrying capacity is 600", criterion_id: "E", kind: "suggestion", comment: "Where does 600 come from? Show how you estimated it, and how sensitive the result is to it." },
  ],
  priorities: [
    { title: "Reflect on every result", detail: "After each finding, add what it means for the real rumour and how reliable it is.", criterion_id: "D" },
    { title: "Compare two models", detail: "Fit a second model and use residuals to argue which fits better.", criterion_id: "E" },
    { title: "Fix the graphs", detail: "Label axes with units and give every figure a caption that says what it shows.", criterion_id: "B" },
  ],
  progress: { summary: "The structure is much clearer than draft 1 and the data section is new. Reflection is still the weakest part.", addressed_priorities: [0] },
  notes: ["About 14 pages, within the 12–20 page range."],
};

export default async function ReviewDemoPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { s = "done" } = await searchParams;
  const status = (["done", "checked", "marking", "failed"].includes(s) ? s : "done") as ReviewDraft["status"];
  const iso = new Date().toISOString();
  const draft: ReviewDraft = {
    id: "demo-2",
    version: 2,
    fileName: "maths-ia-draft-2.pdf",
    status,
    precheck: { readable: true, matches_kind: true, matches_reason: "", page_count: 14, word_estimate: 3100, has_identifying_info: true, identifying_detail: "a name in the page header", title_found: "Modelling the spread of a rumour", issues: [] },
    report: status === "done" ? REPORT : null,
    error: status === "failed" ? "The review ran too long" : null,
    claimedAt: iso,
    finishedAt: iso,
    donePriorities: [],
    createdAt: iso,
  };
  const project: ReviewProject = {
    id: "demo",
    kind: "ia",
    subjectId: "math_aa",
    level: "HL",
    title: "Maths IA: modelling the spread of a rumour",
    question: "How well does a logistic model describe how a rumour spreads through a school?",
    createdAt: iso,
    updatedAt: iso,
    drafts: [draft, { ...draft, id: "demo-1", version: 1, fileName: "maths-ia-draft-1.pdf", status: "done", report: { ...REPORT, criteria: REPORT.criteria.map((c) => ({ ...c, mark_low: Math.max(0, c.mark_low - 1), mark_high: Math.max(0, c.mark_low - 1) })) } }],
  };
  return (
    <div className="max-w-[1320px] mx-auto px-md py-xl">
      <ProjectView project={project} criteria={criteriaView("ia", "math_aa", { level: "HL", examYear: 2027 })!} allowance={{ used: 2, cap: 6, remaining: 4, resetsAt: new Date(Date.UTC(2026, 11, 1)).toISOString() }} subjectName="Mathematics: analysis and approaches" selectedId="demo-2" fileUrl={status === "done" ? "/dev/review/sample.pdf" : null} level="HL" />
    </div>
  );
}

import "server-only";

import { getMarkscheme } from "./markschemes";
import type { ReviewKind, ReviewLevel } from "./labels";

// The criteria sets coursework reviews mark against. The official criteria
// text (markbands, strands, clarifications) is in markschemes.ts, taken from
// the IB guides and used only in the marking prompt. What's here is the
// structure (ids, maximums, limits) plus our own one-line summaries, which
// are the only criteria wording students see.

export type { ReviewKind, ReviewLevel } from "./labels";

export type Criterion = {
  id: string;
  name: string;
  max: number;
  /** Our own words, for students: what this criterion rewards. */
  summary: string;
  /** Only for this level (Maths criterion E differs between SL and HL). */
  level?: ReviewLevel;
  /** When this can't be judged from the uploaded file (e.g. EE reflection, CS video). */
  onlyIf?: string;
};

export type CriteriaSet = {
  id: string;
  label: string;
  kind: ReviewKind;
  subjects: string[];
  criteria: Criterion[];
  limits: { words?: number; pagesMin?: number; pagesMax?: number; note?: string };
  /** What the pre-check looks for. */
  rules: string[];
  /** Which guide the criteria come from. */
  source: string;
  /** Key into the criteria text (markschemes.ts). */
  markscheme: string;
  /** Extra marking notes for this kind of work, from how examiners apply the criteria (calibrated on IB's marked samples). */
  guidance?: string;
  /** For subjects whose guide changed: the exam years this set is for. */
  examYears?: { from?: number; to?: number };
};

/** What decides the criteria besides the kind and subject: the student's level and exam year. */
export type ReviewContext = { level: ReviewLevel | null; examYear: number | null };

const ANON = "No student name, candidate number or school name anywhere in the work.";

const SETS: CriteriaSet[] = [
  {
    id: "ee",
    label: "Extended essay",
    kind: "ee",
    subjects: [],
    criteria: [
      { id: "A", name: "Framework for the essay", max: 6, summary: "A focused research question, suitable methods that are explained, and a structure that carries the research." },
      { id: "B", name: "Knowledge and understanding", max: 6, summary: "Relevant sources, accurate terminology and well-used concepts from the subject." },
      { id: "C", name: "Analysis and line of argument", max: 6, summary: "Analysis rather than description, and one clear argument running from question to conclusion." },
      { id: "D", name: "Discussion and evaluation", max: 8, summary: "What the findings mean, backed by evidence, and an honest look at the essay's strengths and limits." },
      {
        id: "E",
        name: "Reflection",
        max: 4,
        summary: "Your reflection (RPF): evaluative, with specific examples of how you grew and what you'd carry forward.",
        onlyIf: "the student's reflection and progress form (RPF) is included in the file",
      },
    ],
    limits: { words: 4000, note: "4,000 words. Reflection (E) is marked from your RPF: add it at the end of the PDF to have it reviewed." },
    rules: [ANON, "Word limit 4,000 for the essay (the RPF reflection has its own 500-word limit)."],
    source: "Extended essay guide, first assessment 2027",
    markscheme: "ee",
    guidance:
      "Extended essays are marked positively against what an excellent 17 to 18-year-old can produce in about 40 hours, not against published research. C (analysis and line of argument): a clear argument that runs from the question to the conclusion, with most sections analysing rather than retelling, is 5–6 even if some passages are narrative or a finding is not fully reconciled with the thesis. D (discussion and evaluation): an essay that weighs the relative significance of its findings or factors, with evidence, reaches 7–8 even if historians' or sources' views are sometimes quoted rather than debated, or the evaluation of sources could go further. Reserve 1–4 in C and D for essays that are mostly descriptive or whose argument breaks down. Strong research (B) and a strong framework (A) usually go with strong analysis: if you've placed A and B in the top band, check whether C and D really fall two bands lower.",
  },
  {
    id: "tok_essay",
    label: "TOK essay",
    kind: "tok_essay",
    subjects: [],
    criteria: [
      { id: "essay", name: "Exploration of the title", max: 10, summary: "A clear, coherent and critical exploration of the prescribed title, linked to areas of knowledge, with specific examples and other points of view weighed." },
    ],
    limits: { words: 1600, note: "1,600 words, on one of this session's six prescribed titles, word for word." },
    rules: [ANON, "The title must be one of the prescribed titles for the session, exactly as given.", "Word limit 1,600."],
    source: "Theory of knowledge guide, first assessment 2022",
    markscheme: "tok_essay",
    guidance:
      "TOK essays are judged on the quality of the exploration of knowledge by a 16 to 18-year-old, not on philosophical rigour. Read the whole essay, then ask the driving question and choose the level whose overall impression fits, using the possible characteristics as anchors. An essay with a sustained focus on the title, links to areas of knowledge, specific examples, and different points of view that are weighed is Excellent (9–10) even if some claims are broad, some examples are simplified or one paragraph is weaker. Examiners don't mark down sweeping generalisations or imperfect arguments unless they derail the exploration. Basic (3–4) is for essays that are largely descriptive or only loosely tied to the title, not for good essays with flaws.",
  },
  {
    id: "tok_exhibition",
    label: "TOK exhibition",
    kind: "tok_exhibition",
    subjects: [],
    criteria: [
      { id: "exhibition", name: "TOK in the world around us", max: 10, summary: "Three specific real-world objects, each clearly linked to one IA prompt, with a justified reason for being there." },
    ],
    limits: { words: 950, note: "Three objects, one of the 35 IA prompts (word for word), up to 950 words." },
    rules: [ANON, "Exactly three objects, all on one IA prompt, written word for word.", "Objects should be specific things with a real-world context, not generic images.", "Up to 950 words."],
    source: "Theory of knowledge guide, first assessment 2022",
    markscheme: "tok_exhibition",
    guidance:
      "Mark the exhibition holistically, as one overall impression. Three specific objects with real-world contexts, each linked to the prompt with a justified reason for being included, is Excellent (9–10) even if one object's context or justification is a little thinner than the others: strengths across objects compensate. Don't mark down for writing style or for an introduction or conclusion (not required). Lower levels are for generic objects, links that are unclear or missing, or justifications that are mere description.",
  },
  {
    id: "maths",
    label: "Mathematical exploration",
    kind: "ia",
    subjects: ["math_aa", "math_ai"],
    criteria: [
      { id: "A", name: "Presentation", max: 4, summary: "Organised, coherent and concise: an aim, a clear structure and a conclusion." },
      { id: "B", name: "Mathematical communication", max: 4, summary: "Correct notation and terminology, key terms and variables defined, suitable forms of representation." },
      { id: "C", name: "Personal engagement", max: 3, summary: "Your own thinking: original questions, approaches and ideas, not just following a textbook path." },
      { id: "D", name: "Reflection", max: 3, summary: "Critical reflection on results, methods and limitations, and what they mean for your aim." },
      { id: "E", name: "Use of mathematics", max: 6, level: "SL", summary: "Relevant mathematics at the level of the course, correct, and clearly understood." },
      { id: "E", name: "Use of mathematics", max: 6, level: "HL", summary: "Relevant mathematics at HL level, correct and precise, with sophistication and rigour." },
    ],
    limits: { pagesMin: 12, pagesMax: 20, note: "About 12 to 20 pages, double-spaced." },
    rules: [ANON, "About 12 to 20 pages with double line spacing."],
    source: "Mathematics: analysis and approaches / applications and interpretation guides, first assessment 2021",
    markscheme: "maths",
  },
  {
    id: "science",
    label: "Scientific investigation",
    kind: "ia",
    subjects: ["biology", "chemistry", "physics"],
    criteria: [
      { id: "research_design", name: "Research design", max: 6, summary: "A research question set in a specific context, a justified method, described well enough to repeat." },
      { id: "data_analysis", name: "Data analysis", max: 6, summary: "Clear, precise and accurate processing of the data, with uncertainties handled properly." },
      { id: "conclusion", name: "Conclusion", max: 6, summary: "A conclusion justified by your analysis and compared with the accepted science." },
      { id: "evaluation", name: "Evaluation", max: 6, summary: "The impact of specific weaknesses and limitations explained, with realistic improvements tied to them." },
    ],
    limits: { words: 3000, note: "3,000 words." },
    rules: [ANON, "Word limit 3,000 (graphs, tables, equations and references don't count)."],
    source: "Biology, Chemistry and Physics guides, first assessment 2025",
    markscheme: "science",
  },
  {
    id: "economics",
    label: "Economics commentary",
    kind: "ia",
    subjects: ["economics"],
    criteria: [
      { id: "A", name: "Diagrams", max: 3, summary: "Relevant, accurate, correctly labelled diagrams, fully explained in the context of the article." },
      { id: "B", name: "Terminology", max: 2, summary: "Economic terms relevant to the article, used appropriately throughout." },
      { id: "C", name: "Application and analysis", max: 3, summary: "Economic theory applied to the article throughout, with effective analysis." },
      { id: "D", name: "Key concept", max: 3, summary: "One key concept, fully linked to the article (and not used in your other commentaries)." },
      { id: "E", name: "Evaluation", max: 3, summary: "Judgements backed by effective, balanced reasoning." },
    ],
    limits: { words: 800, note: "One commentary, up to 800 words. Rubric requirements (criterion F) apply to the whole portfolio and aren't reviewed here." },
    rules: [ANON, "Up to 800 words (diagrams, short labels, tables, equations and references don't count).", "The article must be no more than a year older than the commentary."],
    source: "Economics guide, internal assessment criteria (SL/HL)",
    markscheme: "economics",
  },
  {
    id: "business",
    label: "Business research project",
    kind: "ia",
    subjects: ["business"],
    criteria: [
      { id: "A", name: "Integration of a key concept", max: 5, summary: "One key concept (change, creativity, ethics or sustainability) analysed and woven through the whole project." },
      { id: "B", name: "Supporting documents", max: 4, summary: "Three to five relevant, in-depth supporting documents that give a range of ideas and views." },
      { id: "C", name: "Tools and theories", max: 4, summary: "Business tools and theories chosen well and applied with clear relevance to the question." },
      { id: "D", name: "Analysis and evaluation", max: 5, summary: "Data from your documents used for real analysis and evaluation of the question." },
      { id: "E", name: "Conclusions", max: 3, summary: "Conclusions that follow from the analysis and answer the question." },
      { id: "F", name: "Structure", max: 2, summary: "A logical, well-organised structure." },
      { id: "G", name: "Presentation", max: 2, summary: "Required elements present (title, contents, references…) and clearly presented." },
    ],
    limits: { words: 1800, note: "Up to 1,800 words, with three to five supporting documents." },
    rules: [ANON, "Up to 1,800 words.", "Three to five supporting documents, mostly from the last three years."],
    source: "Business management guide, first assessment 2024",
    markscheme: "business",
  },
  {
    id: "history2020",
    label: "Historical investigation",
    kind: "ia",
    subjects: ["history"],
    examYears: { to: 2027 },
    criteria: [
      { id: "A", name: "Identification and evaluation of sources", max: 6, summary: "Two well-chosen sources, clearly identified, with their value and limitations analysed for your question." },
      { id: "B", name: "Investigation", max: 15, summary: "A clear, well-organised investigation: critical analysis, a range of evidence and perspectives, and a reasoned conclusion." },
      { id: "C", name: "Reflection", max: 4, summary: "What the investigation showed you about historians' methods and their challenges, linked back to your work." },
    ],
    limits: { words: 2200, note: "Up to 2,200 words, plus a bibliography. For exams up to November 2027." },
    rules: [ANON, "Up to 2,200 words.", "A bibliography and clear referencing of all sources."],
    source: "History guide, first assessment 2020",
    markscheme: "history2020",
  },
  {
    id: "history2028",
    examYears: { from: 2028 },
    label: "Historical investigation (2028 guide)",
    kind: "ia",
    subjects: ["history"],
    criteria: [
      { id: "A", name: "Historical inquiry question", max: 6, summary: "A clearly stated inquiry question, why it suits historical inquiry, and a concept that shapes it." },
      { id: "B", name: "Sources and perspectives", max: 6, summary: "How your sources give diverse perspectives and how those will help answer the question." },
      { id: "C", name: "Synthesis and evaluation", max: 12, summary: "Sustained analysis, evidence from your sources synthesised, sources evaluated, and a reasoned judgement." },
    ],
    limits: { words: 2200, note: "Up to 2,200 words, with a bibliography of at most seven sources. This is the guide for exams from May 2028." },
    rules: [ANON, "Up to 2,200 words; the word count stated at the start.", "A bibliography of at most seven sources."],
    source: "History guide, first assessment 2028",
    markscheme: "history2028",
  },
  {
    id: "cs2027",
    label: "Computer science solution",
    kind: "ia",
    subjects: ["cs"],
    criteria: [
      { id: "A", name: "Problem specification", max: 4, summary: "The problem described with measurable requirements, good success criteria, and a justified computational context." },
      { id: "B", name: "Planning", max: 4, summary: "A sensible decomposition of the problem and a plan that covers the success criteria." },
      { id: "C", name: "System overview", max: 6, summary: "A system model and algorithms clear enough for someone else to rebuild it, plus a testing strategy." },
      { id: "D", name: "Development", max: 12, summary: "The product's techniques explained and justified, with evidence of testing.", onlyIf: "the documentation describes the development; the video can't be reviewed, so judge only what the document shows" },
      { id: "E", name: "Evaluation", max: 4, summary: "The product evaluated against your success criteria, with realistic improvements." },
    ],
    limits: { words: 2000, note: "Documentation up to 2,000 words (code excerpts and diagrams don't count). Your video and appendix can't be reviewed here." },
    rules: [ANON, "Documentation up to 2,000 words, with the word count on the first page."],
    source: "Computer science guide, first assessment 2027",
    markscheme: "cs2027",
  },
  {
    id: "geography",
    label: "Geography fieldwork report",
    kind: "ia",
    subjects: ["geography"],
    criteria: [
      { id: "A", name: "Fieldwork question and geographic context", max: 3, summary: "A focused fieldwork question set in its geographic context and linked to the syllabus." },
      { id: "B", name: "Method(s) of investigation", max: 3, summary: "Methods described and justified, with a sound sampling strategy." },
      { id: "C", name: "Quality and treatment of information", max: 6, summary: "Good-quality data, presented accurately with appropriate techniques." },
      { id: "D", name: "Written analysis", max: 8, summary: "Analysis of your data that answers the fieldwork question, with anomalies noted." },
      { id: "E", name: "Conclusion", max: 2, summary: "A clear conclusion that answers the question and follows from the analysis." },
      { id: "F", name: "Evaluation", max: 3, summary: "Strengths and weaknesses of your methods, and realistic improvements." },
    ],
    limits: { words: 2500, note: "Up to 2,500 words. This guide is for first assessment 2019; check it's still yours." },
    rules: [ANON, "Up to 2,500 words."],
    source: "Geography guide, first assessment 2019",
    markscheme: "geography",
  },
  {
    id: "ess2026",
    label: "ESS investigation",
    kind: "ia",
    subjects: ["ess"],
    criteria: [
      { id: "A", name: "Research question and inquiry", max: 4, summary: "An environmental issue explored and narrowed to a relevant, focused research question." },
      { id: "B", name: "Strategy", max: 4, summary: "A strategy suited to the question, including ethical, safety and environmental considerations." },
      { id: "C", name: "Method", max: 4, summary: "A method described clearly enough to repeat, collecting relevant and sufficient data." },
      { id: "D", name: "Treatment of data", max: 6, summary: "Data processed and presented clearly and accurately." },
      { id: "E", name: "Analysis and conclusion", max: 6, summary: "Analysis that leads to a conclusion answering the question, linked to the wider issue." },
      { id: "F", name: "Evaluation", max: 6, summary: "Strengths and limitations of the investigation, with realistic improvements and extensions." },
    ],
    limits: { words: 3000, note: "Up to 3,000 words." },
    rules: [ANON, "Up to 3,000 words."],
    source: "Environmental systems and societies guide, first assessment 2026",
    markscheme: "ess2026",
  },
];

const inYears = (s: CriteriaSet, year: number | null) => {
  if (!s.examYears) return true;
  // Unknown exam year: the guide for students sitting soonest (the older one).
  const y = year ?? new Date().getUTCFullYear() + 1;
  return (s.examYears.from === undefined || y >= s.examYears.from) && (s.examYears.to === undefined || y <= s.examYears.to);
};

/**
 * The criteria for a piece of work, or null when that subject's IA isn't
 * supported. The student's level picks Maths criterion E (SL when they haven't
 * set it), and their exam year picks between old and new guides (History).
 */
export function criteriaFor(kind: ReviewKind, subjectId: string | null, ctx: ReviewContext = { level: null, examYear: null }): CriteriaSet | null {
  const set =
    kind === "ia"
      ? SETS.find((s) => s.kind === "ia" && !!subjectId && s.subjects.includes(subjectId) && inYears(s, ctx.examYear))
      : SETS.find((s) => s.kind === kind);
  if (!set) return null;
  const lvl = ctx.level ?? "SL";
  return { ...set, criteria: set.criteria.filter((c) => !c.level || c.level === lvl) };
}

export function criteriaTotal(set: CriteriaSet): number {
  return set.criteria.reduce((n, c) => n + c.max, 0);
}

export async function markschemeText(set: CriteriaSet): Promise<string> {
  return getMarkscheme(set.markscheme);
}

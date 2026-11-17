import "server-only";

import type { Markscheme, Question } from "@/lib/data/types";
import { exportToRow, rowToMarkscheme, rowToQuestion, type ExportQuestion } from "@/lib/data/questions";
// One real verified bank question, public on the homepage on purpose.
import sampleMaths from "./sample-maths-question.json";

// Fixed demo content for the signed-out homepage. It must stay static
// (the page is ISR, served from the CDN), so nothing here reads cookies,
// headers or per-user data. Spread across subjects on purpose,
// so DiplomaPro doesn't read as maths-only.

export type SampleQuestion = { subjectLabel: string; question: Question; markscheme: Markscheme };

// Hand-written homepage samples (not bank questions), marked the way each
// subject's markschemes are: ✓ points in the sciences and economics,
// M1/A1 in maths (the Maths sample is a real verified bank question).
const CHEMISTRY: SampleQuestion = {
  subjectLabel: "Chemistry",
  question: {
    id: "sample-chemistry",
    subjectId: "chemistry",
    subtopicId: "R2.1",
    type: "short",
    paper: "P2",
    calculator: true,
    hlOnly: false,
    difficulty: 2,
    totalMarks: 4,
    stemMd: "Calcium carbonate decomposes when heated: $\\text{CaCO}_3\\text{(s)} \\rightarrow \\text{CaO(s)} + \\text{CO}_2\\text{(g)}$",
    parts: [
      { label: "a", marks: 3, textMd: "Calculate the mass of carbon dioxide produced when $5.00\\text{ g}$ of calcium carbonate decomposes completely." },
      { label: "b", marks: 1, textMd: "Suggest why the mass lost by the sample in an experiment is often less than the calculated value." },
    ],
    options: null,
  },
  markscheme: {
    questionId: "sample-chemistry",
    correctOption: null,
    parts: [
      {
        label: "a",
        answerMd: "$2.20\\text{ g}$",
        markschemeMd: "",
        markPoints: [
          { code: "✓", marks: 1, implied: false, text: "$n(\\text{CaCO}_3) = \\dfrac{5.00}{100.09} = 0.0500\\text{ mol}$" },
          { code: "✓", marks: 1, implied: false, text: "$n(\\text{CO}_2) = n(\\text{CaCO}_3)$, a $1:1$ ratio" },
          { code: "✓", marks: 1, implied: false, text: "$m(\\text{CO}_2) = 0.0500 \\times 44.01 = 2.20\\text{ g}$" },
        ],
      },
      {
        label: "b",
        answerMd: "Incomplete decomposition",
        markschemeMd: "",
        markPoints: [{ code: "✓", marks: 1, implied: false, text: "the calcium carbonate did not fully decompose (heating too short or not hot enough)" }],
      },
    ],
    workedSolutionMd: "",
    criteria: null,
    feedbackPoints: null,
  },
};

const ECONOMICS: SampleQuestion = {
  subjectLabel: "Economics",
  question: {
    id: "sample-economics",
    subjectId: "economics",
    subtopicId: "2.5",
    type: "short",
    paper: "P2",
    calculator: true,
    hlOnly: false,
    difficulty: 2,
    totalMarks: 4,
    stemMd: "",
    parts: [
      { label: "a", marks: 2, textMd: "Define *price elasticity of demand*." },
      {
        label: "b",
        marks: 2,
        textMd: "The price of a cinema ticket rises by $10\\%$ and the quantity demanded falls by $5\\%$. Calculate the price elasticity of demand and state whether demand is price elastic or price inelastic.",
      },
    ],
    options: null,
  },
  markscheme: {
    questionId: "sample-economics",
    correctOption: null,
    parts: [
      {
        label: "a",
        answerMd: "",
        markschemeMd: "",
        markPoints: [
          { code: "✓", marks: 1, implied: false, text: "the responsiveness of quantity demanded to a change in the good's price" },
          { code: "✓", marks: 1, implied: false, text: "measured as $\\dfrac{\\%\\Delta Q_d}{\\%\\Delta P}$, ceteris paribus" },
        ],
      },
      {
        label: "b",
        answerMd: "$-0.5$, price inelastic",
        markschemeMd: "",
        markPoints: [
          { code: "✓", marks: 1, implied: false, text: "$\\text{PED} = \\dfrac{-5}{10} = -0.5$" },
          { code: "✓", marks: 1, implied: false, text: "price inelastic, because $|\\text{PED}| < 1$" },
        ],
      },
    ],
    workedSolutionMd: "",
    criteria: null,
    feedbackPoints: null,
  },
};

function mathsSample(): SampleQuestion {
  const row = exportToRow(sampleMaths as ExportQuestion);
  return { subjectLabel: "Maths AA", question: rowToQuestion(row), markscheme: rowToMarkscheme(row) };
}

/** Hand-written fallback questions for the homepage's "Try 3 questions" (markschemes included, on purpose). */
export function getSampleQuestions(): SampleQuestion[] {
  return [CHEMISTRY, ECONOMICS, mathsSample()];
}

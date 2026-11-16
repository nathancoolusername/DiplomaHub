"use client";

import Link from "next/link";
import { openBro } from "@/components/shared/bro/bro-visibility";
import { links } from "@/lib/practice/links";
import type { AttemptResult } from "@/lib/data/types";

// "Where the marks went" on the results page: worked out from the attempt
// itself (marks lost per subtopic, which kinds of mark points were missed,
// pace), no AI. Pro students can take it to Bro from here.

type Item = AttemptResult["items"][number];

/** Mark points not ticked on a written question, by kind (M, A, R…). */
function missedKinds(item: Item, into: Record<string, number>) {
  for (const part of item.markscheme.parts) {
    const ticked = new Set(item.answer.tickedPoints[part.label] ?? []);
    part.markPoints.forEach((p, i) => {
      if (ticked.has(i)) return;
      const kind = p.code.trim().charAt(0).toUpperCase();
      into[kind] = (into[kind] ?? 0) + p.marks;
    });
  }
}

const KIND_LINE: Record<string, string> = {
  M: "Most of the lost marks were method marks (M), so the setup is where it goes wrong: get the first step right and the rest follows.",
  A: "Most of the lost marks were accuracy marks (A): the method was there, the final answers slipped. Check each line before moving on.",
  R: "Most of the lost marks were reasoning marks (R): say why each step is true, not just what it is.",
};

export function MarksDebrief({ result, isPro }: { result: AttemptResult; isPro: boolean }) {
  const { items, set, marksEarned, marksPossible } = result;
  const lost = marksPossible - marksEarned;

  const bySubtopic = new Map<string, { code: string; name: string; lost: number; possible: number }>();
  const kinds: Record<string, number> = {};
  let wrongMcq = 0;
  let mcq = 0;
  for (const item of items) {
    const earned = item.answer.marksAwarded ?? 0;
    const s = bySubtopic.get(item.subtopic.code) ?? { code: item.subtopic.code, name: item.subtopic.shortName, lost: 0, possible: 0 };
    s.lost += item.question.totalMarks - earned;
    s.possible += item.question.totalMarks;
    bySubtopic.set(item.subtopic.code, s);
    if (item.markscheme.correctOption) {
      mcq++;
      if (earned < item.question.totalMarks) wrongMcq++;
    } else if (!item.markscheme.criteria && earned < item.question.totalMarks) {
      missedKinds(item, kinds);
    }
  }
  const focus = [...bySubtopic.values()].filter((s) => s.lost > 0).sort((a, b) => b.lost - a.lost || b.lost / b.possible - a.lost / a.possible).slice(0, 2);
  const firstMissedIndex = items.findIndex((x) => (x.answer.marksAwarded ?? 0) < x.question.totalMarks);

  const lines: string[] = [];
  if (lost === 0) {
    lines.push(`Every mark. Next time try ${set.settings.timer === "off" ? "it at exam pace" : "a harder set"} to push it further.`);
  } else {
    const where = focus.map((s) => `${s.code} ${s.name} (${s.lost} mark${s.lost === 1 ? "" : "s"})`);
    lines.push(
      bySubtopic.size === 1
        ? `You dropped ${lost} of ${marksPossible} mark${marksPossible === 1 ? "" : "s"}.`
        : `You dropped ${lost} of ${marksPossible} marks, most of them on ${where.join(" and ")}.`,
    );
    const topKind = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
    const kindTotal = Object.values(kinds).reduce((a, b) => a + b, 0);
    if (topKind && KIND_LINE[topKind[0]] && topKind[1] / kindTotal >= 0.5) lines.push(KIND_LINE[topKind[0]]);
    if (mcq >= 3 && wrongMcq / mcq >= 0.4) lines.push(`${wrongMcq} of ${mcq} multiple-choice answers were wrong: open the worked solutions below for each one.`);
  }
  if (result.examPaceS > 0 && result.timeTakenS > result.examPaceS * 1.25) {
    lines.push("You were slower than exam pace, so try the next one with the timer on.");
  }

  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="marks-debrief">
      <h2 id="marks-debrief" className="font-serif font-bold text-headline-sm text-on-surface">
        {lost === 0 ? "Full marks" : "Where the marks went"}
      </h2>
      <p className="text-body-lg text-on-surface">{lines.join(" ")}</p>
      {(focus.length > 0 || (isPro && firstMissedIndex >= 0)) && (
        <div className="flex flex-wrap items-center gap-sm">
          {focus.map((f) => (
            <Link
              key={f.code}
              href={links.build(set.subjectId, set.practiceType, [f.code])}
              className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90"
            >
              Practise {f.code} {f.name}
            </Link>
          ))}
          {isPro && firstMissedIndex >= 0 && (
            <button
              type="button"
              onClick={() =>
                openBro({ question: { attemptId: result.attempt.id, questionId: items[firstMissedIndex].question.id, label: `Question ${firstMissedIndex + 1}` } })
              }
              className="rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary cursor-pointer"
            >
              Talk it through with Bro
            </button>
          )}
        </div>
      )}
    </section>
  );
}

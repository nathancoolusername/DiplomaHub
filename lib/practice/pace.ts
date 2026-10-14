// Exam pace: how long a set "should" take at real exam speed, from the
// subject's paper durations and mark totals (subjects.papers).

import type { Level, PaperCode, Subject } from "@/lib/data/types";

/** Seconds per mark for one paper at one level, e.g. Maths AA P1 HL: 120 min / 110 marks. */
export function secondsPerMark(subject: Subject, paper: PaperCode, level: Level): number {
  const spec = subject.papers.find((p) => p.code === paper) ?? subject.papers[0];
  const minutes = spec?.duration[level] ?? spec?.duration.HL ?? spec?.duration.SL;
  const marks = spec?.totalMarks[level] ?? spec?.totalMarks.HL ?? spec?.totalMarks.SL;
  if (!minutes || !marks) return 72; // ~1.2 min per mark, a sensible IB-wide fallback
  return (minutes * 60) / marks;
}

export function examPaceSeconds(
  subject: Subject,
  level: Level,
  questions: { paper: PaperCode; totalMarks: number }[],
): number {
  return Math.round(
    questions.reduce((sum, q) => sum + q.totalMarks * secondsPerMark(subject, q.paper, level), 0),
  );
}

/**
 * On pace when the marks already attempted are at least what exam pace
 * would have covered by now (with a small grace margin).
 */
export function isOnPace(elapsedS: number, examPaceS: number, marksAttempted: number, marksTotal: number): boolean {
  if (examPaceS <= 0 || marksTotal <= 0) return true;
  const expectedMarks = (elapsedS / examPaceS) * marksTotal;
  return marksAttempted + 0.5 >= expectedMarks * 0.9;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

export function formatMinutes(totalSeconds: number): string {
  const min = Math.round(totalSeconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

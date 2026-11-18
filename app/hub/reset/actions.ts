"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { addHubItems, buildSet, getUserSubjects, markWeeklyReset, renameSet } from "@/lib/data";
import { findSubtopic } from "@/lib/catalog";
import type { BuildSettings, SubjectId } from "@/lib/data/types";

export type ResetSessionInput = { subjectId: string; subtopicIds: string[]; title: string; startAt: string; endAt: string };

const DAY = 86_400_000;
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

/**
 * Finishes the Sunday Reset: each session goes on the Hub as a study block;
 * one on a practice topic gets its own short set (opened from the Hub). Then
 * the week is marked done. Free for everyone.
 */
export async function finishResetAction(weekStart: string, sessions: ResetSessionInput[]): Promise<{ added: number; sets: number }> {
  if (!(await getCurrentUserId())) throw new Error("Sign in to plan your week");
  if (!isDay(weekStart) || Math.abs(Date.parse(`${weekStart}T00:00:00Z`) - Date.now()) > 9 * DAY) throw new Error("That week isn't this week");
  if (!Array.isArray(sessions) || sessions.length > 5) throw new Error("Pick up to five sessions");

  const subjects = await getUserSubjects();
  const now = Date.now();
  const clean = sessions.map((s) => {
    const us = subjects.find((x) => x.subject.id === s.subjectId);
    if (!us) throw new Error("That isn't one of your subjects");
    const start = Date.parse(s.startAt);
    const end = Date.parse(s.endAt);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start || end - start > 2 * 3600_000) throw new Error("Check the session times");
    if (start < now - DAY || start > now + 15 * DAY) throw new Error("Sessions go in the next two weeks");
    const subtopicIds = (Array.isArray(s.subtopicIds) ? s.subtopicIds : []).filter((id) => typeof id === "string" && findSubtopic(us.subject.id, id)).slice(0, 4);
    const title = String(s.title ?? "").trim().slice(0, 80) || `${us.subject.shortName} revision`;
    return { us, subtopicIds, title, start: new Date(start).toISOString(), end: new Date(end).toISOString() };
  });

  // A short practice set per topic session, when the bank has questions for it.
  let sets = 0;
  const items = [];
  for (const s of clean) {
    let practiceSetId: string | null = null;
    if (s.subtopicIds.length && s.us.subject.supportedTypes.includes("mcq_short")) {
      const settings: BuildSettings = {
        subtopicIds: s.subtopicIds,
        questionType: "mix",
        count: 6,
        difficulty: "mixed",
        paper: null,
        calculator: true,
        includeHl: s.us.level === "HL",
        timer: "off",
        mcqFeedback: "each",
        answerOn: "screen",
      };
      try {
        const set = await buildSet(s.us.subject.id as SubjectId, "mcq_short", s.us.level, settings, { writtenCap: null, save: true });
        if (set.questionIds.length) {
          practiceSetId = set.id;
          sets++;
          await renameSet(set.id, `Reset: ${s.title}`.slice(0, 60)).catch(() => undefined);
        }
      } catch {
        // No questions for that topic yet: it's still a study block.
      }
    }
    items.push({ title: `${s.us.subject.shortName}: ${s.title}`, kind: "study" as const, subjectId: s.us.subject.id, start: s.start, end: s.end, allDay: false, practiceSetId });
  }
  if (items.length) await addHubItems(items, "From your Sunday Reset");

  // Before migration 50 the week can't be recorded; the sessions are still added.
  await markWeeklyReset(weekStart, items.length).catch(() => undefined);
  revalidatePath("/hub");
  revalidatePath("/");
  return { added: items.length, sets };
}

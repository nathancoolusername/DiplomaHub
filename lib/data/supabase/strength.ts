import "server-only";

import { cache } from "react";
import type { StrengthMap, SubjectId, SubtopicStrength, UserSubject } from "@/lib/data/types";
import { averageScore, levelFor } from "@/lib/practice/strength";
import { topicTree } from "@/lib/catalog";
import { check, db, requireUserId, rpc } from "./client";
import { getUserSubjects } from "./viewer";

type Record_ = { score: number | null; answeredCount: number };

/** topic_strength for the signed-in student, keyed `${subjectId}:${subtopicCode}`. */
const strengthRecords = cache(async (): Promise<Map<string, Record_>> => {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("topic_strength")
    .select("subject_id, subtopic_code, score, answered_count")
    .eq("user_id", uid);
  check(error);
  return new Map(
    (data ?? []).map((r) => [
      `${r.subject_id}:${r.subtopic_code}`,
      { score: r.score === null ? null : Number(r.score), answeredCount: r.answered_count },
    ]),
  );
});

function buildMap(us: UserSubject, records: Map<string, Record_>): StrengthMap {
  const topics = topicTree(us.subject.id)
    .map((topic) => ({
      code: topic.code,
      name: topic.name,
      subtopics: topic.subtopics
        // SL students don't see HL-only subtopics.
        .filter((s) => us.level === "HL" || !s.hlOnly)
        .map((s): SubtopicStrength => {
          const r = records.get(`${us.subject.id}:${s.id}`) ?? { score: null, answeredCount: 0 };
          return { ...s, score: r.score, answeredCount: r.answeredCount, level: levelFor(r.score, r.answeredCount) };
        }),
    }))
    .filter((t) => t.subtopics.length > 0);

  const withData = topics.flatMap((t) => t.subtopics).filter((s) => s.level !== "none");
  return {
    subject: us.subject,
    level: us.level,
    topics,
    overall: averageScore(withData.map((s) => s.score)),
    weakest: [...withData].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3),
  };
}

/** One map per subject the student takes (core first), for the carousels. */
export async function getStrengthMaps(): Promise<StrengthMap[]> {
  const [subjects, records] = await Promise.all([getUserSubjects(), strengthRecords()]);
  return subjects.map((us) => buildMap(us, records));
}

export async function getStrengthMap(subjectId: SubjectId): Promise<StrengthMap | null> {
  return (await getStrengthMaps()).find((m) => m.subject.id === subjectId) ?? null;
}

export type WeakTopic = {
  subjectId: SubjectId;
  topicCode: string;
  topicName: string | null;
  subtopicCode: string;
  subtopicName: string;
  /** topic_strength score, 0–1 (what the strength map shows). */
  score: number;
  answeredCount: number;
  /** Questions logged in practice_activity in the last 60 days. */
  recentQuestions: number;
  /** Marks earned / possible over those, 0–1; null when none. */
  recentAccuracy: number | null;
  lastPractisedAt: string | null;
};

/**
 * The signed-in student's weakest subtopics, up to `perSubject` per subject
 * they take, weakest first. Only subtopics with enough answers to show a
 * level on the strength map count. For DiplomaBro.
 */
export async function getWeakestTopics(perSubject = 3): Promise<Map<SubjectId, WeakTopic[]>> {
  const rows = await rpc<Array<Record<string, unknown>>>("my_weakest_topics", { p_per_subject: perSubject });
  const out = new Map<SubjectId, WeakTopic[]>();
  for (const r of rows ?? []) {
    const t: WeakTopic = {
      subjectId: r.subject_id as SubjectId,
      topicCode: r.topic_code as string,
      topicName: (r.topic_name as string | null) ?? null,
      subtopicCode: r.subtopic_code as string,
      subtopicName: r.subtopic_name as string,
      score: Number(r.score),
      answeredCount: r.answered_count as number,
      recentQuestions: (r.recent_questions as number) ?? 0,
      recentAccuracy: r.recent_accuracy === null || r.recent_accuracy === undefined ? null : Number(r.recent_accuracy),
      lastPractisedAt: (r.last_practised_at as string | null) ?? null,
    };
    out.set(t.subjectId, [...(out.get(t.subjectId) ?? []), t]);
  }
  return out;
}

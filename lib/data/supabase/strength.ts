import "server-only";

import { cache } from "react";
import type { StrengthMap, SubjectId, SubtopicStrength, UserSubject } from "@/lib/data/types";
import { averageScore, levelFor } from "@/lib/practice/strength";
import { topicTree } from "@/lib/catalog";
import { check, db, requireUserId } from "./client";
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

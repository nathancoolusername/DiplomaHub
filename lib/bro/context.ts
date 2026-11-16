import "server-only";

import { allSubjects, findSubtopic, subjectById, topicTree } from "@/lib/catalog";
import { getBoundaryOverrides, getBroMemory, getExamSession, getExamSessions, getProStatus, getThemePreference, getResults, getUpcomingItems, getUserSubjects, getViewer, getWeakestTopics } from "@/lib/data";
import { chartGrade, describeResult, RESULT_KIND_LABEL } from "@/lib/results";
import { boundariesFor } from "@/lib/grade-boundaries";
import { db, requireUserId } from "@/lib/data/supabase/client";
import { MEMORY_KIND_LABEL } from "./memory-rules";
import { getMyDailyStanding } from "@/lib/forty-five/server";
import { gameDay } from "@/lib/forty-five/dates";

// The context builder (BUILD_SPEC "DiplomaBro backend"): one compact block
// about the student, sent with every chat request. Keep it short: it's paid
// for on every message. Includes the practice they did in the last 14 days, what Bro remembers (bro_memory, with ids so
// the forget tool can name one) and when the student usually practises.

const KIND: Record<string, string> = { deadline: "deadline", test: "test", mock: "mock exam", study: "study block" };

function day(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone });
}

/**
 * When the student usually practises, from practice_activity in the last 60
 * days, in their timezone: the busiest two-hour window, and weekdays vs
 * weekends. Null until there are 5 different days to go on.
 */
async function studyRoutine(timeZone: string): Promise<string | null> {
  const uid = await requireUserId();
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const { data, error } = await (await db())
    .from("practice_activity")
    .select("created_at")
    .eq("user_id", uid)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error || !data?.length) return null;

  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" });
  // One vote per day and hour, so a single long session doesn't drown everything else.
  const seen = new Set<string>();
  const hours = new Array(24).fill(0);
  const days = new Set<string>();
  let weekend = 0;
  let weekday = 0;
  for (const r of data) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(r.created_at as string)).map((p) => [p.type, p.value]));
    const day = `${parts.year}-${parts.month}-${parts.day}`;
    const hour = Number(parts.hour);
    const key = `${day} ${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hours[hour]++;
    if (!days.has(day)) {
      days.add(day);
      if (parts.weekday === "Sat" || parts.weekday === "Sun") weekend++;
      else weekday++;
    }
  }
  if (days.size < 5) return null;
  let best = 0;
  for (let h = 1; h < 24; h++) if (hours[h] + hours[(h + 1) % 24] > hours[best] + hours[(best + 1) % 24]) best = h;
  const pad = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
  const when = weekend > weekday ? "mostly at weekends" : weekend === 0 ? "on weekdays" : "mostly on weekdays";
  return `Usually practises around ${pad(best)}–${pad(best + 2)}, ${when} (${days.size} practice days in the last 60).`;
}

/**
 * What the student actually practised in the last 14 days, one line per
 * finished set (practice_activity rows grouped by attempt): when, subject,
 * how many questions, marks, and the subtopics that cost the most marks.
 * Up to 8 sets, newest first.
 */
async function recentPractice(timeZone: string): Promise<string[]> {
  const uid = await requireUserId();
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data, error } = await (await db())
    .from("practice_activity")
    .select("attempt_id, subject, subtopic, mode, score, max_score, created_at")
    .eq("user_id", uid)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error || !data?.length) return [];

  type Row = { attempt_id: string | null; subject: string; subtopic: string; mode: string; score: number; max_score: number; created_at: string };
  const sets = new Map<string, Row[]>();
  for (const r of data as Row[]) {
    // Rows of a deleted set have no attempt any more: group them by day and subject.
    const key = r.attempt_id ?? `${r.created_at.slice(0, 10)}:${r.subject}`;
    sets.set(key, [...(sets.get(key) ?? []), r]);
  }
  const recent = [...sets.values()].slice(0, 8);
  // Which practice set each attempt was (for redo_set / scheduling); RLS keeps it to their own.
  const attemptIds = recent.map((rows) => rows[0].attempt_id).filter((id): id is string => !!id);
  const setOf = new Map<string, string>();
  if (attemptIds.length) {
    const { data: att } = await (await db()).from("attempts").select("id, set_id").eq("user_id", uid).in("id", attemptIds);
    for (const a of (att ?? []) as { id: string; set_id: string }[]) setOf.set(a.id, a.set_id);
  }
  const lines: string[] = [];
  for (const rows of recent) {
    const subjectId = rows[0].subject as Parameters<typeof subjectById>[0];
    const name = subjectById(subjectId)?.shortName ?? rows[0].subject;
    const score = rows.reduce((n, r) => n + r.score, 0);
    const max = rows.reduce((n, r) => n + r.max_score, 0);
    const lost = new Map<string, number>();
    for (const r of rows) if (r.max_score > r.score) lost.set(r.subtopic, (lost.get(r.subtopic) ?? 0) + r.max_score - r.score);
    const worst = [...lost.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([code]) => `${code} ${findSubtopic(subjectId, code)?.shortName ?? ""}`.trim());
    const kind = rows.every((r) => r.mode === "mcq") ? "MCQs" : rows.some((r) => r.mode === "mcq") ? "questions" : "written questions";
    lines.push(
      `- ${day(rows[0].created_at, timeZone)}: ${name}, ${rows.length} ${kind}, ${score}/${max} marks (${max ? Math.round((score / max) * 100) : 0}%)${
        worst.length ? `; lost most marks on ${worst.join(" and ")}` : ""
      }${rows[0].attempt_id && setOf.get(rows[0].attempt_id) ? ` [set ${setOf.get(rows[0].attempt_id)}]` : ""}`,
    );
  }
  return lines;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** Their Hub sets (migration 46), newest first. */
async function hubSets(): Promise<{ id: string; name: string }[]> {
  const uid = await requireUserId();
  const { data } = await (await db()).from("hub_sets").select("id, name").eq("owner_id", uid).order("created_at", { ascending: false }).limit(20);
  return (data ?? []) as { id: string; name: string }[];
}

/** Their practice sets, newest first (for sharing, or to point them back to one). */
async function practiceSets(): Promise<{ id: string; title: string; subject_id: string }[]> {
  const uid = await requireUserId();
  const { data } = await (await db()).from("practice_sets").select("id, title, subject_id").eq("owner_id", uid).order("created_at", { ascending: false }).limit(15);
  return (data ?? []) as { id: string; title: string; subject_id: string }[];
}

/** Today's Forty-Five for them, or null. */
async function fortyFive() {
  const uid = await requireUserId();
  return getMyDailyStanding(uid, gameDay()).catch(() => null);
}

export async function buildBroContext(timeZone = "UTC"): Promise<string> {
  // Every query at once: each one is a round trip to the database in Ireland.
  const [viewer, subjects, session, items, weakest, memory, routine, practice, results, overrides, sets, ff, pSets, theme, sessions, pro] = await Promise.all([
    getViewer(),
    getUserSubjects(),
    getExamSession(),
    getUpcomingItems(60),
    getWeakestTopics(3),
    getBroMemory(),
    studyRoutine(timeZone),
    recentPractice(timeZone),
    getResults(),
    getBoundaryOverrides(),
    hubSets(),
    fortyFive(),
    practiceSets(),
    getThemePreference().catch(() => null),
    getExamSessions().catch(() => []),
    getProStatus().catch(() => null),
  ]);

  const lines: string[] = [];
  lines.push(`Today: ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone })}.`);
  if (viewer.firstName) lines.push(`Student's first name: ${viewer.firstName}.`);
  if (session) lines.push(`Exam session: ${session.label} (first exam around ${day(session.firstExamDate, "UTC")}).`);

  lines.push(
    subjects.length
      ? `Subjects (id for record_result in brackets): ${subjects.map((s) => `${s.subject.shortName}${s.levelSet ? ` ${s.level}` : ""} [${s.subject.id}]`).join(", ")}.`
      : "Subjects: none picked yet.",
  );

  // The syllabus of each of their subjects, so Bro picks real subtopics (build_set) and links the right ones.
  const syllabus: string[] = [];
  for (const us of subjects) {
    const tree = topicTree(us.subject.id);
    if (!tree.length) continue;
    syllabus.push(`${us.subject.shortName} [${us.subject.id}]:`);
    for (const t of tree) {
      const subs = t.subtopics
        .filter((st) => us.level === "HL" || !us.levelSet || !st.hlOnly)
        .map((st) => `${st.code} ${st.shortName}${st.hlOnly ? " (HL)" : ""}`)
        .join("; ");
      syllabus.push(`  ${t.code} ${t.name}: ${subs}`);
    }
  }
  if (syllabus.length) {
    lines.push("Syllabus of their subjects (topic code, then its subtopics; use these exact codes):");
    lines.push(...syllabus);
  }

  // Hub items with their ids, so Bro can propose edits and deletions (propose_hub_changes).
  const soonEnd = Date.now() + 14 * 86_400_000;
  const soon = items.filter((i) => Date.parse(i.startsAt) <= soonEnd);
  const later = items.filter((i) => Date.parse(i.startsAt) > soonEnd);
  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
  if (soon.length) {
    lines.push("Calendar, next 14 days ([id] for propose_hub_changes):");
    for (const i of soon.slice(0, 30)) {
      const subject = i.subjectId ? subjectById(i.subjectId)?.shortName : null;
      lines.push(`- ${day(i.startsAt, timeZone)} ${time(i.startsAt)}: ${i.title} (${KIND[i.kind] ?? i.kind}${subject ? `, ${subject}` : ""}) [${i.id}]`);
    }
  } else {
    lines.push("Calendar, next 14 days: nothing.");
  }
  if (later.length) {
    lines.push(`Later (up to 60 days): ${later.slice(0, 20).map((i) => `${day(i.startsAt, timeZone)} ${i.title} [${i.id}]`).join("; ")}`);
  }

  // Their Hub sets (migration 46), for renaming or deleting with propose_hub_changes.
  // Settings Bro can change with propose_settings.
  lines.push(
    `Settings: theme ${theme ?? "not set"}; Pro badge ${pro?.badgeHidden ? "hidden" : "shown"}; exam sessions to pick from: ${sessions.map((x) => x.label).join(", ")}.`,
  );
  lines.push(`All IB subjects (ids for add_classes / swap_core): ${allSubjects().map((x) => `${x.shortName} [${x.id}]`).join("; ")}`);
  if (sets.length) lines.push(`Their Hub sets: ${sets.map((st) => `"${st.name}" [${st.id}]`).join("; ")}`);
  if (pSets.length) {
    lines.push(
      `Their practice sets, newest first (ids for share_code, rename_set, redo_set and practice_set_id; link /practice/sets/{id}/play to start one, /practice/sets/{id}/pdf for a printable PDF): ${pSets
        .map((p) => `"${p.title}"${subjectById(p.subject_id as never) ? ` (${subjectById(p.subject_id as never)!.shortName})` : ""} [${p.id}]`)
        .join("; ")}`,
    );
  }

  const weak = [...weakest.entries()].filter(([, t]) => t.length);
  if (weak.length) {
    lines.push("Weakest subtopics from their practice (strength 0–100%):");
    for (const [subjectId, topics] of weak) {
      const name = subjectById(subjectId)?.shortName ?? subjectId;
      const list = topics
        .map((t) => `${t.subtopicCode} ${t.subtopicName} ${pct(t.score)}${t.recentAccuracy !== null ? ` (recent accuracy ${pct(t.recentAccuracy)})` : ""}`)
        .join("; ");
      lines.push(`- ${name}: ${list}`);
    }
  } else {
    lines.push("Practice so far: not enough to know weak topics yet.");
  }

  if (practice.length) {
    lines.push("Practice they finished in the last 14 days (newest first):");
    lines.push(...practice);
  } else {
    lines.push("Practice they finished in the last 14 days: none.");
  }

  // Their own logged results (Progress page), per subject: how many, the
  // trend from first to latest, and the 4 most recent. Per subject, so a
  // lot of Physics tests can't push every other subject out.
  if (results.length) {
    lines.push("Test results they logged, per subject (≈ = estimated from a percentage with that subject's IB May 2025 boundaries, or their school's if they set them):");
    const bySubject = new Map<string, typeof results>();
    for (const r of results) bySubject.set(r.subjectId, [...(bySubject.get(r.subjectId) ?? []), r]);
    for (const [subjectId, list] of bySubject) {
      const s = subjects.find((x) => x.subject.id === subjectId);
      const b = boundariesFor(subjectId, s?.levelSet ? s.level : null, overrides[subjectId]);
      const graded = list.map((r) => ({ r, g: chartGrade(r, b) })).filter((x) => x.g);
      const first = graded[0]?.g;
      const last = graded[graded.length - 1]?.g;
      const trend = first && last && graded.length > 1 ? `, ${first.estimated ? "≈" : ""}${first.grade} → ${last.estimated ? "≈" : ""}${last.grade} from first to latest` : "";
      lines.push(`- ${s?.subject.shortName ?? subjectId}: ${list.length} result${list.length === 1 ? "" : "s"}${trend}. Latest:`);
      for (const { r, g } of [...graded].reverse().slice(0, 4)) {
        lines.push(`  - ${day(`${r.takenOn}T12:00:00Z`, "UTC")}: ${r.title} (${RESULT_KIND_LABEL[r.kind]}): ${describeResult(r)}${g!.estimated ? ` ≈ grade ${g!.grade}` : ""}`);
      }
    }
  } else {
    lines.push("Test results they logged: none yet (they can log them on the Progress page, or tell you).");
  }

  // Today's Forty-Five, so Bro can suggest it as a warm-up (and not after they've done it).
  if (ff) {
    lines.push(
      `Today's Forty-Five (the daily IB word puzzle, /forty-five): ${
        !ff.played ? "not played yet" : !ff.finished ? "started, not finished" : `solved, ${ff.score ?? "?"}/45${ff.rank ? `, #${ff.rank} today` : ""}`
      }.`,
    );
  }

  if (routine) lines.push(`Study routine (from their practice): ${routine}`);

  if (memory.length) {
    lines.push(`What you remember about them (${memory.length} of 30; [id] for forget):`);
    for (const m of memory) lines.push(`- [${m.id}] ${MEMORY_KIND_LABEL[m.kind]}: ${m.content}${m.source === "student" ? " (written by the student)" : ""}`);
  } else {
    lines.push("What you remember about them: nothing yet.");
  }

  return lines.join("\n");
}

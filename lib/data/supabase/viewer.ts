import "server-only";

import { cache } from "react";
import type { CalendarItemKind, ExamSession, GettingStarted, Level, Subject, SubjectId, UserSubject, Viewer } from "@/lib/data/types";
import { allSubjects, subjectById } from "@/lib/catalog";
import { PRO_COMING_SOON } from "@/lib/plans";
import { toCatalogSubjectId, toHubSubjectId } from "@/lib/hub-subjects";
import { check, db, requireUserId, rpc } from "./client";
import { getNextTimedItem } from "./calendar";

/** IB students take six subjects; extra classes are any number on top. */
export const CORE_SUBJECT_COUNT = 6;

type UserRow = {
  id: string;
  display_name: string | null;
  is_pro: boolean | null;
  exam_session_id: string | null;
  diplomapro_onboarded_at: string | null;
  dismissed_hints: string[] | null;
  hub_subjects: string[] | null;
  custom_hub_subjects: { id: string; name: string }[] | null;
  theme: ThemePreference | null;
};

export type ThemePreference = "system" | "light" | "dark" | "midnight";

const userRow = cache(async (): Promise<UserRow> => {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("users")
    .select("id, display_name, is_pro, exam_session_id, diplomapro_onboarded_at, dismissed_hints, hub_subjects, custom_hub_subjects, theme")
    .eq("id", uid)
    .single();
  check(error);
  return data as UserRow;
});

export const getViewer = cache(async (): Promise<Viewer> => {
  const u = await userRow();
  const name = (u.display_name ?? "").trim();
  return {
    id: u.id,
    displayName: name,
    firstName: name.split(/\s+/)[0] || "there",
    // Nobody has Pro while it's coming soon (users.is_pro is left alone for launch day).
    isPro: !!u.is_pro && !PRO_COMING_SOON,
    examSessionId: u.exam_session_id,
  };
});

/** The saved theme, or null if the student hasn't saved one yet. */
export async function getThemePreference(): Promise<ThemePreference | null> {
  return (await userRow()).theme;
}

export async function setThemePreference(theme: ThemePreference): Promise<void> {
  await rpc("set_theme", { p_theme: theme });
}

/** Saves the student's exam session (an exam_sessions id). */
export async function setExamSession(id: string): Promise<void> {
  await rpc("set_exam_session", { p_id: id });
}

export const getExamSessions = cache(async (): Promise<ExamSession[]> => {
  const { data, error } = await (await db()).from("exam_sessions").select("id, label, first_exam_date").order("first_exam_date");
  check(error);
  return (data ?? []).map((s) => ({ id: s.id, label: s.label, firstExamDate: s.first_exam_date }));
});

export async function getExamSession(): Promise<ExamSession | null> {
  const [viewer, sessions] = await Promise.all([getViewer(), getExamSessions()]);
  return sessions.find((s) => s.id === viewer.examSessionId) ?? null;
}

// ── user_subjects (the only source of a student's subjects) ─────────────

/** A subject the student typed themselves: "custom:xxxx" (the Hub's id format), no practice content. */
export function isCustomSubjectId(id: string): boolean {
  return id.startsWith("custom:");
}

export function customSubject(id: string, name: string): Subject {
  return { id, name, shortName: name, ibGroup: 0, resourceTag: null, supportedTypes: [], papers: [] };
}

/** One of the student's subjects as it's picked and saved; `name` only for custom subjects. */
export type SubjectChoice = { subjectId: SubjectId; level: Level; name?: string };

function validChoice(c: SubjectChoice): boolean {
  if (c.level !== "HL" && c.level !== "SL") return false;
  if (isCustomSubjectId(c.subjectId)) {
    const name = c.name?.trim() ?? "";
    return /^custom:[A-Za-z0-9_-]{1,40}$/.test(c.subjectId) && name.length >= 1 && name.length <= 40;
  }
  return !!subjectById(c.subjectId);
}

function toRow(uid: string, c: SubjectChoice, isCore: boolean) {
  return {
    user_id: uid,
    subject_id: c.subjectId,
    level: c.level,
    is_core: isCore,
    custom_name: isCustomSubjectId(c.subjectId) ? c.name!.trim() : null,
  };
}

export const getUserSubjects = cache(async (): Promise<UserSubject[]> => {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("user_subjects")
    .select("subject_id, level, is_core, custom_name, created_at")
    .eq("user_id", uid)
    .order("created_at");
  check(error);
  const list = (data ?? []).flatMap((r): UserSubject[] => {
    const subject = r.custom_name ? customSubject(r.subject_id, r.custom_name) : subjectById(r.subject_id);
    return subject ? [{ subject, level: (r.level ?? "SL") as Level, isCore: r.is_core }] : [];
  });
  return [...list.filter((s) => s.isCore), ...list.filter((s) => !s.isCore)];
});

export async function getUserSubject(subjectId: string): Promise<UserSubject | null> {
  return (await getUserSubjects()).find((s) => s.subject.id === subjectId) ?? null;
}

export async function getAllSubjects(): Promise<Subject[]> {
  return allSubjects();
}

/** Replaces the six core subjects. An extra class that becomes core stops being an extra. */
export async function setCoreSubjects(core: SubjectChoice[]): Promise<void> {
  if (core.length !== CORE_SUBJECT_COUNT) throw new Error(`Pick exactly ${CORE_SUBJECT_COUNT} subjects`);
  if (new Set(core.map((c) => c.subjectId)).size !== core.length) throw new Error("Each subject can only be picked once");
  if (!core.every(validChoice)) throw new Error("Unknown subject or level");
  const uid = await requireUserId();
  const sb = await db();
  const ids = core.map((c) => c.subjectId);
  check((await sb.from("user_subjects").delete().eq("user_id", uid).eq("is_core", true)).error);
  check((await sb.from("user_subjects").delete().eq("user_id", uid).in("subject_id", ids)).error);
  check((await sb.from("user_subjects").insert(core.map((c) => toRow(uid, c, true)))).error);
}

export async function addExtraClass(choice: SubjectChoice): Promise<void> {
  if (!validChoice(choice)) throw new Error("Unknown subject");
  const uid = await requireUserId();
  const { error } = await (await db()).from("user_subjects").insert(toRow(uid, choice, false));
  if (error?.code === "23505") throw new Error("You already take this subject");
  check(error);
}

export async function removeExtraClass(subjectId: SubjectId): Promise<void> {
  const uid = await requireUserId();
  check((await (await db()).from("user_subjects").delete().eq("user_id", uid).eq("subject_id", subjectId).eq("is_core", false)).error);
}

// ── Onboarding and first-time hints ─────────────────────────────────────

export async function needsOnboarding(): Promise<boolean> {
  return (await userRow()).diplomapro_onboarded_at === null;
}

/**
 * The rows onboarding starts from: the student's core subjects if set,
 * otherwise what they picked in the Hub (users.hub_subjects). Never padded
 * with guesses: with fewer than six, the wizard asks them to pick the rest.
 */
export async function getOnboardingSubjects(): Promise<SubjectChoice[]> {
  const [current, u] = await Promise.all([getUserSubjects(), userRow()]);
  const rows: SubjectChoice[] = current
    .filter((s) => s.isCore)
    .map((s) => ({ subjectId: s.subject.id, level: s.level, ...(isCustomSubjectId(s.subject.id) ? { name: s.subject.name } : {}) }));
  for (const hubId of u.hub_subjects ?? []) {
    if (rows.length >= CORE_SUBJECT_COUNT) break;
    // The Hub only says "English": skip it if they already have an English course, else start from the likeliest one.
    if (rows.some((r) => toHubSubjectId(r.subjectId) === hubId)) continue;
    const id = toCatalogSubjectId(hubId);
    // The Hub's own custom subjects come along with their names.
    const custom = isCustomSubjectId(id) ? u.custom_hub_subjects?.find((c) => c.id === id) : undefined;
    if (custom) rows.push({ subjectId: id, level: "SL", name: custom.name.slice(0, 40) });
    else if (subjectById(id)) rows.push({ subjectId: id, level: "SL" });
  }
  return rows.slice(0, CORE_SUBJECT_COUNT);
}

export type OnboardingAnswers = {
  examSessionId: string;
  subjects: SubjectChoice[];
  nextTest: { title: string; subjectId: SubjectId | null; kind: CalendarItemKind; date: string; hasTimer: boolean } | null;
  /** The student's IANA timezone, so the test lands at 09:00 their time. */
  timezone?: string;
};

export async function completeOnboarding(a: OnboardingAnswers): Promise<void> {
  await rpc("complete_onboarding", { p: a });
}

export const HINT_IDS = ["strength-map", "bro-button", "midnight"] as const;
export type HintId = (typeof HINT_IDS)[number];

/** Whether this student has dismissed a hint (regardless of setup). */
export async function hasDismissedHint(id: HintId): Promise<boolean> {
  return ((await userRow()).dismissed_hints ?? []).includes(id);
}

/** Hints still to show; none while onboarding is open, so they don't stack on the wizard. */
export async function getPendingHints(): Promise<HintId[]> {
  const u = await userRow();
  if (u.diplomapro_onboarded_at === null) return [];
  return HINT_IDS.filter((id) => !(u.dismissed_hints ?? []).includes(id));
}

export async function dismissHint(id: string): Promise<void> {
  await rpc("dismiss_hint", { p_hint: id });
}

/** Home's "Getting started" checklist, derived from real data so it ticks itself off. */
export async function getGettingStarted(): Promise<GettingStarted> {
  const uid = await requireUserId();
  const sb = await db();
  const [subjects, timed, marked, saved] = await Promise.all([
    getUserSubjects(),
    getNextTimedItem(),
    // Reaching the marking/results page counts as finishing.
    sb.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", uid).in("status", ["marking", "marked"]),
    sb.from("practice_sets").select("id", { count: "exact", head: true }).eq("owner_id", uid).eq("saved", true),
  ]);
  check(marked.error);
  check(saved.error);
  const now: GettingStarted = {
    pickSubjects: subjects.filter((s) => s.isCore).length >= CORE_SUBJECT_COUNT,
    addCountdownTest: timed !== null,
    finishFirstSet: (marked.count ?? 0) > 0,
    saveOrEnterCode: (saved.count ?? 0) > 0,
  };
  // Once done, a step stays done (deleting the countdown test doesn't untick it).
  const doneNow = (Object.keys(now) as (keyof GettingStarted)[]).filter((k) => now[k]);
  let ever: string[] = doneNow;
  try {
    ever = await rpc<string[]>("record_getting_started", { p_done: doneNow });
  } catch {
    // Migration 11 not run yet: fall back to what's true right now.
  }
  return {
    pickSubjects: now.pickSubjects || ever.includes("pickSubjects"),
    addCountdownTest: now.addCountdownTest || ever.includes("addCountdownTest"),
    finishFirstSet: now.finishFirstSet || ever.includes("finishFirstSet"),
    saveOrEnterCode: now.saveOrEnterCode || ever.includes("saveOrEnterCode"),
  };
}

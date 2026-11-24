import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";
import type { DayPoint, Labelled, Range } from "@/app/lib/admin-stats";
import { levenshtein, squash } from "@/lib/deadline/normalize";

// Read-only numbers and review queues for Admin → Deadline (migration 56).
// The tables are service-role only, so every entry point checks the admin id.

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function adminClient(): Promise<SupabaseClient | null> {
  return isAdmin(await getCurrentUserId()) ? createAdminClient() : null;
}

/** Every row of a query (the API returns 1,000 at a time). */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(/does not exist|schema cache/i.test(error.message) ? "Run migration 56 (Deadline) first" : error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

const day = (iso: string) => iso.slice(0, 10);
function daySeries(dates: string[], days: number): DayPoint[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(day(d), (counts.get(day(d)) ?? 0) + 1);
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ date: d, count: counts.get(d) ?? 0 });
  }
  return out;
}
const tally = (xs: string[]): Labelled[] => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

// ── What's waiting (tab badges) ─────────────────────────────────────────
export async function getDeadlineWaiting(): Promise<{ review: number; reports: number }> {
  const admin = await adminClient();
  if (!admin) return { review: 0, reports: 0 };
  try {
    const [rej, rep] = await Promise.all([
      all<{ prompt_id: string; norm_text: string }>((f, t) => admin.from("dl_answer_rejects").select("prompt_id, norm_text").eq("status", "new").order("id").range(f, t)),
      all<{ message_id: string }>((f, t) => admin.from("dl_message_reports").select("message_id").order("id").range(f, t)),
    ]);
    return { review: new Set(rej.map((r) => `${r.prompt_id}|${r.norm_text}`)).size, reports: new Set(rep.map((r) => r.message_id)).size };
  } catch {
    return { review: 0, reports: 0 };
  }
}

// ── Analytics ───────────────────────────────────────────────────────────
export type DeadlineAnalytics = {
  games: { started: number; finished: number; abandoned: number; players: number; avgPlayers: number | null; avgMinutes: number | null;
    overtimePct: number | null; playAgainPct: number | null; squadPct: number | null; messagesPerGame: number | null; reactionsPerGame: number | null };
  perDay: DayPoint[];
  sizes: Labelled[];
  funnel: Labelled[];
  joinsVia: Labelled[];
  endReasons: Labelled[];
  matchedBy: Labelled[];
  points: Labelled[];
  answers: { total: number; avgSeconds: number | null; rejects: number; appealed: number };
  prompts: { slug: string; text: string; rounds: number; avgAnswers: number; exhausted: number; cleared: number }[];
};

export async function getDeadlineAnalytics(range: Range): Promise<Result<DeadlineAnalytics>> {
  const admin = await adminClient();
  if (!admin) return { ok: false, error: "Not authorised" };
  const since = new Date(Date.now() - range * 86_400_000).toISOString();
  try {
    const [games, events, rounds, log, rejects, prompts] = await Promise.all([
      all<{ id: string; squad_id: string | null; players: number; started_at: string; ended_at: string | null; end_reason: string | null; overtime: boolean; play_again_no: number; messages: number; reactions: number }>(
        (f, t) => admin.from("dl_games").select("id, squad_id, players, started_at, ended_at, end_reason, overtime, play_again_no, messages, reactions").gte("started_at", since).order("id").range(f, t)),
      all<{ kind: string; data: Record<string, unknown> }>((f, t) => admin.from("dl_events").select("kind, data").gte("created_at", since).order("id").range(f, t)),
      all<{ prompt_id: string; answers: number; end_reason: string }>((f, t) => admin.from("dl_prompt_rounds").select("prompt_id, answers, end_reason").gte("started_at", since).order("id").range(f, t)),
      all<{ matched_by: string; ms_taken: number; points: number }>((f, t) => admin.from("dl_answer_log").select("matched_by, ms_taken, points").gte("created_at", since).order("id").range(f, t)),
      all<{ appealed: boolean }>((f, t) => admin.from("dl_answer_rejects").select("appealed").gte("created_at", since).order("id").range(f, t)),
      all<{ id: string; slug: string; text: string }>((f, t) => admin.from("dl_prompts").select("id, slug, text").order("id").range(f, t)),
    ]);
    const finished = games.filter((g) => g.end_reason === "won");
    const players = new Set(
      (await all<{ user_id: string }>((f, t) => admin.from("dl_game_players").select("user_id").in("game_id", games.length ? games.map((g) => g.id) : ["00000000-0000-0000-0000-000000000000"]).order("game_id").order("user_id").range(f, t)))
        .map((p) => p.user_id),
    ).size;
    const pct = (n: number) => (games.length ? Math.round((100 * n) / games.length) : null);
    const kinds = tally(events.map((e) => e.kind));
    const k = (name: string) => kinds.find((x) => x.label === name)?.count ?? 0;
    const byPrompt = new Map<string, { rounds: number; answers: number; exhausted: number; cleared: number }>();
    for (const r of rounds) {
      const p = byPrompt.get(r.prompt_id) ?? { rounds: 0, answers: 0, exhausted: 0, cleared: 0 };
      p.rounds++; p.answers += r.answers;
      if (r.end_reason === "exhausted") p.exhausted++;
      if (r.end_reason === "cleared") p.cleared++;
      byPrompt.set(r.prompt_id, p);
    }
    const promptById = new Map(prompts.map((p) => [p.id, p]));
    const REASON: Record<string, string> = { back_to_failer: "Back to the player who failed", second_fail: "Second fail", cleared: "Cleared (3 circles, no fail)", exhausted: "Every answer used", game_over: "Game ended" };
    const VIA: Record<string, string> = { code: "Typed the code", link: "Invite link", squad: "From a squad" };
    return {
      ok: true,
      data: {
        games: {
          started: games.length, finished: finished.length, abandoned: games.filter((g) => g.end_reason === "abandoned").length, players,
          avgPlayers: round1(avg(games.map((g) => g.players))),
          avgMinutes: round1(avg(finished.filter((g) => g.ended_at).map((g) => (Date.parse(g.ended_at!) - Date.parse(g.started_at)) / 60_000))),
          overtimePct: pct(games.filter((g) => g.overtime).length), playAgainPct: pct(games.filter((g) => g.play_again_no > 0).length),
          squadPct: pct(games.filter((g) => g.squad_id).length),
          messagesPerGame: round1(avg(games.map((g) => g.messages))), reactionsPerGame: round1(avg(games.map((g) => g.reactions))),
        },
        perDay: daySeries(games.map((g) => g.started_at), range),
        sizes: [2, 3, 4, 5, 6, 7, 8].map((n) => ({ label: `${n} players`, count: games.filter((g) => g.players === n).length })),
        funnel: [
          { label: "Opened Deadline", count: k("play_page_opened") },
          { label: "Rooms created", count: k("room_created") },
          { label: "Invites copied", count: k("invite_copied") },
          { label: "Joined a room", count: k("joined") },
          { label: "Games started", count: k("game_started") + k("play_again") },
          { label: "Games finished", count: k("game_finished") },
          { label: "Saved as a squad", count: k("squad_saved") },
        ],
        joinsVia: tally(events.filter((e) => e.kind === "joined").map((e) => VIA[String(e.data?.via)] ?? String(e.data?.via ?? "?"))),
        endReasons: tally(rounds.map((r) => REASON[r.end_reason] ?? r.end_reason)),
        matchedBy: tally(log.map((l) => ({ exact: "Exact", typo: "Typo", sound: "Sounds like", prefix: "First word" })[l.matched_by] ?? l.matched_by)),
        points: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ label: `+${n}`, count: log.filter((l) => l.points === n).length })),
        answers: { total: log.length, avgSeconds: round1(avg(log.map((l) => l.ms_taken / 1000))), rejects: rejects.length, appealed: rejects.filter((r) => r.appealed).length },
        prompts: [...byPrompt.entries()]
          .map(([id, p]) => ({ slug: promptById.get(id)?.slug ?? "?", text: promptById.get(id)?.text ?? "?", rounds: p.rounds, avgAnswers: round1(p.answers / p.rounds) ?? 0, exhausted: p.exhausted, cleared: p.cleared }))
          .sort((a, b) => b.rounds - a.rounds),
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Missing answers and typo accepts ────────────────────────────────────
export type MissingGroup = {
  norm: string;
  /** What players typed most often (prefilled when adding it). */
  raw: string;
  count: number;
  players: number;
  appealed: number;
  reasons: string[];
  lastAt: string;
  /** The nearest existing answers, nearest first. */
  closest: string[];
};
export type TypoGroup = { raw: string; key: string; answer: string; matchedBy: string; count: number; lastAt: string };
export type ReviewPrompt = { slug: string; text: string; active: boolean; answers: string[]; missing: MissingGroup[]; typos: TypoGroup[] };

export async function getDeadlineReview(): Promise<Result<ReviewPrompt[]>> {
  const admin = await adminClient();
  if (!admin) return { ok: false, error: "Not authorised" };
  try {
    const [rejects, accepted] = await Promise.all([
      all<{ prompt_id: string; user_id: string | null; raw_text: string; norm_text: string; reason: string; appealed: boolean; created_at: string }>(
        (f, t) => admin.from("dl_answer_rejects").select("prompt_id, user_id, raw_text, norm_text, reason, appealed, created_at").eq("status", "new").order("id").range(f, t)),
      all<{ prompt_id: string; raw_text: string; canonical_then: string; matched_by: string; created_at: string }>(
        (f, t) => admin.from("dl_answer_log").select("prompt_id, raw_text, canonical_then, matched_by, created_at").neq("matched_by", "exact").order("id").range(f, t)),
    ]);
    const ids = [...new Set([...rejects.map((r) => r.prompt_id), ...accepted.map((a) => a.prompt_id)])];
    if (!ids.length) return { ok: true, data: [] };
    const [prompts, answers, forms] = await Promise.all([
      all<{ id: string; slug: string; text: string; active: boolean; deny_forms: string[]; extra: Record<string, unknown> }>(
        (f, t) => admin.from("dl_prompts").select("id, slug, text, active, deny_forms, extra").in("id", ids).order("id").range(f, t)),
      all<{ prompt_id: string; canonical: string; aliases: string[] }>((f, t) => admin.from("dl_prompt_answers").select("prompt_id, canonical, aliases").in("prompt_id", ids).order("id").range(f, t)),
      all<{ prompt_id: string; form: string }>((f, t) => admin.from("dl_answer_forms").select("prompt_id, form").in("prompt_id", ids).order("answer_id").order("form").range(f, t)),
    ]);
    const out: ReviewPrompt[] = [];
    for (const p of prompts) {
      const ans = answers.filter((a) => a.prompt_id === p.id);
      const formSet = new Set(forms.filter((f) => f.prompt_id === p.id).map((f) => f.form));
      const deny = new Set(p.deny_forms ?? []);
      const ok = new Set(Array.isArray(p.extra?.typo_ok) ? (p.extra.typo_ok as string[]) : []);
      // Missing: rejects grouped by what was typed (normalised).
      const groups = new Map<string, typeof rejects>();
      for (const r of rejects.filter((r) => r.prompt_id === p.id)) groups.set(r.norm_text, [...(groups.get(r.norm_text) ?? []), r]);
      const missing: MissingGroup[] = [...groups.entries()].map(([norm, rs]) => {
        const raws = tally(rs.map((r) => r.raw_text.trim()));
        const sq = squash(norm);
        const closest = ans
          .map((a) => ({ c: a.canonical, d: Math.min(...[a.canonical, ...(a.aliases ?? [])].map((x) => levenshtein(squash(x), sq))) }))
          .sort((a, b) => a.d - b.d).map((x) => x.c)
          .filter((c, i, list) => list.indexOf(c) === i).slice(0, 3);
        return {
          norm, raw: raws[0]?.label ?? norm, count: rs.length, players: new Set(rs.map((r) => r.user_id)).size,
          appealed: rs.filter((r) => r.appealed).length, reasons: [...new Set(rs.map((r) => r.reason))],
          lastAt: rs.map((r) => r.created_at).sort().at(-1)!, closest,
        };
      }).sort((a, b) => b.appealed - a.appealed || b.players - a.players || b.count - a.count);
      // Typo accepts: fuzzy matches not since made a spelling, denied, or marked fine.
      const tg = new Map<string, typeof accepted>();
      for (const a of accepted.filter((a) => a.prompt_id === p.id)) {
        const key = squash(a.raw_text);
        if (!key || formSet.has(key) || deny.has(key) || ok.has(key)) continue;
        tg.set(`${key}|${a.canonical_then}`, [...(tg.get(`${key}|${a.canonical_then}`) ?? []), a]);
      }
      const typos: TypoGroup[] = [...tg.entries()].map(([k, as]) => ({
        key: k.split("|")[0], raw: tally(as.map((a) => a.raw_text.trim()))[0].label, answer: as[0].canonical_then,
        matchedBy: as[0].matched_by, count: as.length, lastAt: as.map((a) => a.created_at).sort().at(-1)!,
      })).sort((a, b) => b.count - a.count);
      if (missing.length || typos.length)
        out.push({ slug: p.slug, text: p.text, active: p.active, answers: ans.map((a) => a.canonical).sort(), missing, typos });
    }
    // Prompts with flagged answers first, then the most to look at.
    out.sort((a, b) => b.missing.reduce((n, m) => n + m.appealed, 0) - a.missing.reduce((n, m) => n + m.appealed, 0)
      || (b.missing.length + b.typos.length) - (a.missing.length + a.typos.length));
    return { ok: true, data: out };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Chat reports ────────────────────────────────────────────────────────
export type ReportedMessage = {
  messageId: string;
  body: string;
  author: { id: string | null; name: string; reportsTotal: number };
  reporters: string[];
  reasons: string[];
  firstAt: string;
  /** null: the room (and the message) is gone (rooms last 24 h). */
  hidden: boolean | null;
};

export async function getDeadlineReports(): Promise<Result<ReportedMessage[]>> {
  const admin = await adminClient();
  if (!admin) return { ok: false, error: "Not authorised" };
  try {
    const reports = await all<{ message_id: string; reporter_id: string | null; author_id: string | null; reason: string | null; body_snapshot: string; created_at: string }>(
      (f, t) => admin.from("dl_message_reports").select("message_id, reporter_id, author_id, reason, body_snapshot, created_at").order("created_at", { ascending: false }).order("id").range(f, t));
    if (!reports.length) return { ok: true, data: [] };
    const msgIds = [...new Set(reports.map((r) => r.message_id))];
    const people = [...new Set(reports.flatMap((r) => [r.reporter_id, r.author_id]).filter(Boolean))] as string[];
    const [msgs, names] = await Promise.all([
      all<{ id: string; hidden: boolean }>((f, t) => admin.from("dl_room_messages").select("id, hidden").in("id", msgIds).order("id").range(f, t)),
      all<{ id: string; display_name: string | null }>((f, t) => admin.from("public_profiles").select("id, display_name").in("id", people.length ? people : ["00000000-0000-0000-0000-000000000000"]).order("id").range(f, t)),
    ]);
    const name = (id: string | null) => (id ? names.find((n) => n.id === id)?.display_name ?? "Someone" : "Deleted account");
    const byAuthor = new Map<string, Set<string>>();
    for (const r of reports) if (r.author_id) byAuthor.set(r.author_id, (byAuthor.get(r.author_id) ?? new Set()).add(r.message_id));
    return {
      ok: true,
      data: msgIds.map((id) => {
        const rs = reports.filter((r) => r.message_id === id);
        const m = msgs.find((x) => x.id === id);
        return {
          messageId: id, body: rs[0].body_snapshot,
          author: { id: rs[0].author_id, name: name(rs[0].author_id), reportsTotal: rs[0].author_id ? byAuthor.get(rs[0].author_id)!.size : 0 },
          reporters: rs.map((r) => name(r.reporter_id)), reasons: [...new Set(rs.map((r) => r.reason).filter(Boolean))] as string[],
          firstAt: rs.map((r) => r.created_at).sort()[0], hidden: m ? m.hidden : null,
        };
      }),
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

import "server-only";

import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import type { BroBrief, CalendarItem, StrengthMap, Suggestion } from "@/lib/data/types";
import { subjectById } from "@/lib/catalog";
import { BRO_BRIEF_PROMPT, BRO_CHAT_MODEL } from "@/lib/bro/prompt";
import { getBroMemory } from "./bro-memory";
import { getUpcomingItems } from "./calendar";
import { db } from "./client";
import { getStrengthMaps } from "./strength";
import { getSuggestions } from "./suggestions";
import { getViewer } from "./viewer";

// Bro's brief (Pro): the Hub's "Bro's brief" and the line under Home's
// greeting. Bro writes them from the student's facts (this week's calendar,
// weakest topics, the top suggestions, memory), and they're cached in
// bro_briefs (migration 47) with a hash of those facts. While the facts are
// the same (including the date), pages show the cached text for free. When
// they change, the page shows the rule-based brief straight away and Bro
// rewrites it after the response (one small Sonnet call, ~0.5¢), so the
// next visit has it. Without migration 47, it's always the rule-based one.

function when(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

/** The brief from rules, shown until Bro's is written (and when it can't be). */
async function ruleBrief(items: CalendarItem[], maps: StrengthMap[]): Promise<string> {
  const tests = items.filter((i) => i.kind === "test" || i.kind === "mock");
  const deadlines = items.filter((i) => i.kind === "deadline");

  const parts: string[] = [];
  if (tests.length) {
    parts.push(
      `Busy week: ${tests.map((t) => `${t.title} ${when(t.startsAt)}`).join(", ")}${
        deadlines.length ? `, plus ${deadlines.map((d) => `${d.title} due ${when(d.startsAt)}`).join(", ")}` : ""
      }.`,
    );
    // Same focus as the suggestions, so the brief and "Next steps" agree.
    const first = tests[0];
    const map = maps.find((m) => m.subject.id === first.subjectId);
    const focus = first.subjectId ? (await getSuggestions("subject", first.subjectId))[0] : undefined;
    const focusIds = focus?.action?.type === "practice" ? focus.action.subtopicIds : [];
    const names = map?.topics.flatMap((t) => t.subtopics).filter((s) => focusIds.includes(s.id)).map((s) => s.shortName) ?? [];
    if (names.length) {
      parts.push(`For ${subjectById(first.subjectId!)?.shortName}, I'd start tonight with ${names.slice(0, 2).join(" and ")}: they're your shakiest topics for that test.`);
    }
  } else if (deadlines.length) {
    parts.push(`Quiet week for tests. Keep an eye on ${deadlines.map((d) => `${d.title} (${when(d.startsAt)})`).join(", ")}.`);
  } else {
    parts.push("Nothing on the calendar this week, which makes it a good time to shore up weak topics.");
  }
  const weakest = maps
    .flatMap((m) => m.weakest.slice(0, 1).map((s) => ({ s, m })))
    .sort((a, b) => (a.s.score ?? 0) - (b.s.score ?? 0))[0];
  if (weakest && !tests.some((t) => t.subjectId === weakest.m.subject.id)) {
    parts.push(`Also worth 20 minutes: ${weakest.s.shortName} in ${weakest.m.subject.shortName}.`);
  }
  return parts.join(" ");
}

/** What Bro writes from: plain lines, also hashed to know when to rewrite. */
function factsFor(items: CalendarItem[], maps: StrengthMap[], suggestions: Suggestion[], memory: string[]): string {
  const today = new Date();
  const lines = [`Today: ${today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.`];
  lines.push(
    items.length
      ? `This week's calendar:\n${items
          .map((i) => `- ${i.title} (${i.kind}${i.subjectId ? `, ${subjectById(i.subjectId)?.shortName ?? i.subjectId}` : ""}): ${when(i.startsAt)}${i.isDeadline ? " (deadline)" : ""}`)
          .join("\n")}`
      : "This week's calendar: nothing.",
  );
  const weak = maps
    .filter((m) => m.weakest.length)
    .map((m) => `- ${m.subject.shortName}: ${m.weakest.slice(0, 2).map((s) => `${s.shortName} (${s.level})`).join(", ")}`);
  lines.push(weak.length ? `Weakest topics (with enough practice to tell):\n${weak.join("\n")}` : "Weakest topics: not enough practice yet.");
  lines.push(suggestions.length ? `DiplomaHub's suggestions, first one first:\n${suggestions.map((s, i) => `${i + 1}. ${s.text}`).join("\n")}` : "Suggestions: none.");
  if (memory.length) lines.push(`What they've told you:\n${memory.map((m) => `- ${m}`).join("\n")}`);
  return lines.join("\n\n");
}

const SCHEMA = {
  type: "object",
  properties: { brief: { type: "string" }, nudge: { type: "string" } },
  required: ["brief", "nudge"],
  additionalProperties: false,
};

let client: Anthropic | null = null;
const anthropic = () =>
  (client ??= new Anthropic(
    process.env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } } : {},
  ));

/** Rewrites in flight on this server, so two tabs don't pay twice. */
const writing = new Set<string>();

async function writeBrief(userId: string, facts: string, hash: string, suggestionId: string | null) {
  if (writing.has(userId)) return;
  writing.add(userId);
  try {
    const msg = await anthropic().beta.messages.create({
      model: BRO_CHAT_MODEL,
      max_tokens: 1000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: BRO_BRIEF_PROMPT,
      messages: [{ role: "user", content: facts }],
    });
    console.info(`bro brief ${JSON.stringify({ in: msg.usage.input_tokens, out: msg.usage.output_tokens })}`);
    if (msg.stop_reason === "refusal") return;
    const block = msg.content.find((b) => b.type === "text");
    const out = JSON.parse(block && block.type === "text" ? block.text : "{}") as { brief?: unknown; nudge?: unknown };
    const text = typeof out.brief === "string" ? out.brief.trim().slice(0, 1200) : "";
    const nudge = typeof out.nudge === "string" ? out.nudge.trim().slice(0, 160) : "";
    if (!text) return;
    await createAdminClient()
      .from("bro_briefs")
      .upsert({
        user_id: userId,
        text,
        nudge: nudge && suggestionId ? nudge : null,
        suggestion_id: suggestionId,
        facts_hash: hash,
        model: msg.model,
        input_tokens: msg.usage.input_tokens,
        output_tokens: msg.usage.output_tokens,
        generated_at: new Date().toISOString(),
      });
  } catch (e) {
    console.error("bro brief", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
  } finally {
    writing.delete(userId);
  }
}

/** null for free users, and when Bro has nothing to go on yet (no calendar items, no practice). */
export async function getBroBrief(): Promise<BroBrief | null> {
  const viewer = await getViewer();
  if (!viewer.isPro) return null;

  const [items, maps, suggestions, memory] = await Promise.all([
    getUpcomingItems(7),
    getStrengthMaps(),
    getSuggestions("home"),
    getBroMemory().catch(() => []),
  ]);
  if (items.length === 0 && maps.every((m) => m.overall === null)) return null;

  const facts = factsFor(items, maps, suggestions, memory.slice(0, 12).map((m) => m.content));
  const hash = createHash("sha256").update(facts).digest("hex").slice(0, 32);
  const top = suggestions[0] ?? null;

  const { data: cached, error } = await (await db()).from("bro_briefs").select("text, nudge, suggestion_id, facts_hash, generated_at").eq("user_id", viewer.id).maybeSingle();
  if (!error && cached && cached.facts_hash === hash) {
    return {
      text: cached.text as string,
      generatedAt: cached.generated_at as string,
      nudge: cached.nudge && top && cached.suggestion_id === top.id ? (cached.nudge as string) : null,
      fromBro: true,
    };
  }
  // Not written yet, or the facts changed: the rule-based brief now, Bro's after the response.
  // (error: before migration 47, so nothing to write to.)
  if (!error) after(() => writeBrief(viewer.id, facts, hash, top?.id ?? null));
  return { text: await ruleBrief(items, maps), generatedAt: new Date().toISOString(), nudge: null, fromBro: false };
}

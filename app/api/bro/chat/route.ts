import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { buildBroContext } from "@/lib/bro/context";
import { BRO_CHAT_MODEL, BRO_SYSTEM_PROMPT } from "@/lib/bro/prompt";
import { consumeUsage, deleteBroConversation, getAttemptConversationId, getBroConversations, getBroHistory, getConversationAttempt, getProStatus } from "@/lib/data";
import { saveBroExchange } from "@/lib/data/supabase/bro";
import { addBroMemory, forgetBroMemory } from "@/lib/data/supabase/bro-memory";
import { MEMORY_KINDS } from "@/lib/bro/memory-rules";
import { addResult } from "@/lib/data/supabase/results";
import { describeResult, RESULT_KINDS } from "@/lib/results";
import { loadQuestionForBro, questionRef } from "@/lib/bro/question";
import {
  runBuildSet,
  runRedoSet,
  runRenameSet,
  runProposeSettings,
  runFindHubItems,
  runFindResources,
  runProposeHubChanges,
  runProposeHubItems,
  runRedeemCode,
  runShareCode,
} from "@/lib/bro/tools";
import type { BroCard } from "@/lib/bro/cards";
import { sameOriginJson } from "@/lib/forty-five/request";
import { resolveOrigin } from "@/app/lib/resolveOrigin";

// DiplomaBro chat (Pro). Chats are separate (migration 40): GET ?c= opens one
// (default: the latest) and lists them, POST continues one (conversationId,
// null = a new chat), DELETE ?c= deletes one.
// In order (BUILD_SPEC "Every Bro request"): session,
// Pro, the daily bro_message cap, then context + history → Claude, streamed
// back as NDJSON lines:
//   {"t":"delta","text":"…"}   a piece of the reply
//   {"t":"done","id":n,"conversationId":"…","remaining":n} finished and saved (id: the reply, for flagging;
//                              remaining: today's uses left, null = no cap)
//   {"t":"memory","id":n,"kind":"…","content":"…"} Bro remembered something (the bar shows it with Undo)
//   {"t":"forgot","content":"…"} Bro deleted a memory item
//   {"t":"result","id":"…","text":"…"} Bro logged a test result (the bar shows it with Undo)
//   {"t":"card","card":{…}}   a set Bro built or Hub items it proposes (saved with the reply)
//   {"t":"error","message":"…"} stopped; nothing was saved
// Refusals before streaming starts come back as JSON { error, message } with a status.
// The exchange is saved only once the reply is complete.

export const maxDuration = 60;

const MAX_MESSAGE = 2000;
const HISTORY_TURNS = 20;
/** Model calls per message: enough for a remember or two and the answer. */
const MAX_ROUNDS = 4;

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "remember",
    description:
      "Save one short, lasting fact about the student that will help in later chats: a goal (target grades, university plans), something they find hard, how they like to be helped, their coursework topic and progress (never its text), or a study note (upcoming mocks, routine). Use it when the student tells you something that will still be true next week. Don't save what's already in the student context or the memory list, one-off questions, or anything about health, feelings, family, relationships, religion, sexuality, contact details or where they live. One fact per call, in the third person, under 200 characters.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...MEMORY_KINDS], description: "goal, struggle, preference, coursework or note" },
        content: { type: "string", description: 'The fact, e.g. "Aiming for 38 points; wants medicine in the UK"' },
      },
      required: ["kind", "content"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "record_result",
    description:
      "Log a test result the student told you about on their Progress page: a class test, mock, IA/EE draft, end-of-term or predicted grade. Give the subject id from the student context, a short name, the kind, the date (YYYY-MM-DD, today unless they said otherwise) and at least one of: IB grade 1-7, marks with the total, or a percentage. Leave the others null.",
    input_schema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Subject id from the student context, e.g. biology" },
        title: { type: "string", description: 'Short name, e.g. "Unit 3 test"' },
        kind: { type: "string", enum: [...RESULT_KINDS] },
        date: { type: "string", description: "YYYY-MM-DD" },
        grade: { type: ["integer", "null"], description: "IB grade 1-7, or null" },
        marks: { type: ["number", "null"], description: "Marks scored, or null" },
        max_marks: { type: ["number", "null"], description: "Total marks, or null" },
        percent: { type: ["number", "null"], description: "Percentage 0-100, or null" },
      },
      required: ["subject_id", "title", "kind", "date", "grade", "marks", "max_marks", "percent"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "build_set",
    description:
      'Build a practice set for the student right now (it\'s saved to their sets and shown as a card with Start and Edit buttons). Use it when they want to practise something or agree to your offer. Use the exact subtopic codes from the syllabus in the student context, the narrowest that match what they asked for (integration → only the integration subtopics, not differentiation); a topic code like "5" means the whole topic, only when they want all of it. Usually 1 to 4 codes. 8 questions is a good default; 5 for a quick warm-up, 12 to 15 for a proper session.',
    input_schema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Subject id from the student context" },
        subtopic_codes: { type: "array", items: { type: "string" }, description: 'Syllabus codes, e.g. ["9.1", "9.2"]' },
        question_type: { type: "string", enum: ["mcq", "short", "mix"] },
        count: { type: "integer", description: "3 to 20" },
        difficulty: { type: "string", enum: ["easier", "exam", "harder", "mixed"] },
        timed: { type: "boolean", description: "Exam-pace timer; only if they ask for exam conditions" },
        title: { type: ["string", "null"], description: 'Short name, e.g. "Redox warm-up", or null' },
      },
      required: ["subject_id", "subtopic_codes", "question_type", "count", "difficulty", "timed", "title"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "rename_set",
    description:
      "Rename one of the student's practice sets straight away, when they ask. Use the practice_set_id from the student context (their practice sets) or from build_set / redo_set.",
    input_schema: {
      type: "object",
      properties: {
        practice_set_id: { type: "string", description: "The practice set's id" },
        title: { type: "string", description: "The new name, short (up to about 60 characters)" },
      },
      required: ["practice_set_id", "title"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "redo_set",
    description:
      'Give the student a set to do again, shown as a card with Start, Edit and PDF: "wrong" makes a new set of the questions they lost marks on last time they finished it; "all" is the same set again. Use it when they want to redo or retry a set (e.g. from their recent practice). To schedule the redo, call this first, wait for its practice_set_id, then propose_hub_items.',
    input_schema: {
      type: "object",
      properties: {
        practice_set_id: { type: "string", description: "The finished set's id (from the student context)" },
        which: { type: "string", enum: ["wrong", "all"] },
      },
      required: ["practice_set_id", "which"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "propose_hub_items",
    description:
      "Propose items for the student's Hub calendar: tests, mocks, deadlines they tell you about, or study sessions you plan with them. They see a clean preview card and add it with one tap, so nothing is added until they do. To change a plan, propose the whole new version. Dates are YYYY-MM-DD in the student's time; start_time is HH:MM (24h) or null for an all-day item. To schedule a practice set, give the study session its practice_set_id (to schedule a new set, call build_set first and use the id it returns).",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: 'e.g. "Chemistry test: redox" or "Physics IA session"' },
              kind: { type: "string", enum: ["test", "mock", "deadline", "study"] },
              subject_id: { type: ["string", "null"], description: "Subject id from the student context, or null" },
              date: { type: "string", description: "YYYY-MM-DD" },
              start_time: { type: ["string", "null"], description: "HH:MM, or null for all day" },
              duration_minutes: { type: ["integer", "null"], description: "For timed items, e.g. 60" },
              practice_set_id: {
                type: "string",
                description:
                  "For a study session to do one of their practice sets: the set's id (from build_set's result or the practice sets in the student context). On the Hub it opens that set, and finishing the set ticks it off. \"\" for anything else.",
              },
            },
            required: ["title", "kind", "subject_id", "date", "start_time", "duration_minutes", "practice_set_id"],
            additionalProperties: false,
          },
        },
        plan_title: {
          type: ["string", "null"],
          description:
            'Name it when it\'s a plan or timetable worth keeping together, e.g. "Mocks timetable" or "Mock revision plan": it then shows with a calendar and can be shared with a code. null for one-off items.',
        },
      },
      required: ["items", "plan_title"],
      additionalProperties: false,
    },
    strict: true,
  },
  // These two aren't strict: strict tools allow only 16 nullable parameters in all.
  // Their inputs are checked on the server (lib/bro/tools.ts) like every tool's.
  {
    name: "find_hub_items",
    description:
      "Find items in the student's Hub (with their ids) by words in the title and/or a date range, when the item they mean isn't in your context (older, or more than 60 days away). Returns text, no card.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: 'Words from the title, e.g. "chemistry test"' },
        from: { type: "string", description: "YYYY-MM-DD (default: a week ago)" },
        to: { type: "string", description: "YYYY-MM-DD (default: six months ahead)" },
      },
    },
  },
  {
    name: "propose_hub_changes",
    description:
      "Propose changes to anything already in the student's Hub (by [id] from your context or find_hub_items): move, rename or retype items, tick them off or reopen them, turn the countdown on or off, change notes, subject or checklist, delete them; and create Hub sets from items, rename sets, add or remove items, delete sets. They see a before/after card and nothing changes until they tap Apply. For an edit, give only the fields that change. Dates are YYYY-MM-DD in the student's time; start_time HH:MM (24h).",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["update", "delete"] },
              item_id: { type: "string" },
              title: { type: "string" },
              kind: { type: "string", enum: ["test", "mock", "deadline", "study"] },
              date: { type: "string", description: "New day, YYYY-MM-DD" },
              start_time: { type: "string", description: "New start, HH:MM" },
              all_day: { type: "boolean", description: "true to make it all day, false to give it a time" },
              duration_minutes: { type: "integer" },
              done: { type: "boolean", description: "true to tick it off, false to reopen it" },
              timer: { type: "boolean", description: "The countdown on their Home page: on or off" },
              notes: { type: "string", description: "Replaces the item's notes (keep what they had unless they want it gone)" },
              subject_id: { type: "string", description: 'Subject id from the student context, or "none"' },
              stages: {
                type: "array",
                items: { type: "string" },
                description: "The item's whole checklist, in order (replaces it; ticks stay on stages that keep their name)",
              },
            },
            required: ["action", "item_id"],
          },
        },
        sets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["create", "rename", "add_items", "remove_items", "delete"] },
              set_id: { type: "string", description: "The set's id (not for create)" },
              new_name: { type: "string", description: "create and rename: the name" },
              item_ids: { type: "array", items: { type: "string" }, description: "create, add_items, remove_items: the Hub item ids" },
              delete_items: { type: "boolean", description: "Deleting a set: true also deletes its items; otherwise they stay in the Hub" },
            },
            required: ["action"],
          },
        },
      },
    },
  },
  {
    name: "share_code",
    description:
      "Make a share code the student can send friends, for one of their practice sets, Hub items (a deadline, test, study session), or Hub sets (an existing set by id, or Hub items picked now with a name, like their mocks timetable). It's made straight away and shown with copy buttons; it changes nothing for them. Friends redeem it on /codes or by giving it to Bro.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["practice_set", "hub_item", "hub_set"] },
        id: { type: "string", description: "The practice set, Hub item or Hub set id from the student context (leave out for a Hub set made from item_ids)" },
        item_ids: { type: "array", items: { type: "string" }, description: "hub_set without an id: the Hub item ids to share" },
        name: { type: "string", description: 'hub_set without an id: what to call it, e.g. "Mocks timetable"' },
      },
      required: ["type"],
    },
  },
  {
    name: "redeem_code",
    description:
      "Use a DiplomaHub code the student gives you and asks you to add (from a friend, a teacher or DiplomaHub): a practice set, Hub item or Pro trial is added straight away; a Hub set shows a card asking whether to keep its dates or start it on a day they pick. Only when they want it used, not when they just mention a code.",
    input_schema: { type: "object", properties: { code: { type: "string", description: "The code as they typed it" } }, required: ["code"] },
  },
  {
    name: "propose_settings",
    description:
      "Propose changes to the student's DiplomaHub settings when they ask: theme, exam session, HL/SL for a subject, adding or removing an extra class, swapping one of their six subjects for another, showing or hiding their Pro badge. They see a before/after card and nothing changes until they tap Apply. Give only what changes.",
    input_schema: {
      type: "object",
      properties: {
        theme: { type: "string", enum: ["system", "light", "dark", "midnight"] },
        exam_session: { type: "string", description: 'e.g. "May 2027"' },
        levels: {
          type: "array",
          items: { type: "object", properties: { subject_id: { type: "string" }, level: { type: "string", enum: ["HL", "SL"] } }, required: ["subject_id", "level"] },
        },
        add_classes: {
          type: "array",
          items: { type: "object", properties: { subject_id: { type: "string" }, level: { type: "string", enum: ["HL", "SL"] } }, required: ["subject_id"] },
        },
        remove_classes: { type: "array", items: { type: "string" }, description: "Extra classes (not their six) to remove, by subject id" },
        swap_core: {
          type: "array",
          items: {
            type: "object",
            properties: { from: { type: "string" }, to: { type: "string" }, level: { type: "string", enum: ["HL", "SL"] } },
            required: ["from", "to"],
          },
          description: "Replace one of their six subjects with another",
        },
        hide_pro_badge: { type: "boolean" },
      },
    },
  },
  {
    name: "find_resources",
    description:
      "Search DiplomaHub's resource library (notes, exemplars, IA/EE examples, templates made by IB students) and show the best matches as a card with Open buttons. Use it when they need materials: an IA or EE example, notes on a topic, a template. Never recommend resources outside DiplomaHub.",
    input_schema: {
      type: "object",
      properties: {
        subject_id: { type: ["string", "null"], description: "Subject id from the student context, or null (e.g. for EE or TOK)" },
        query: { type: "string", description: 'What they need, e.g. "physics IA exemplar" or "redox notes"' },
      },
      required: ["subject_id", "query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "forget",
    description: "Delete one remembered item by its id (shown as [id] in the memory list) when the student asks you to forget it or says it's no longer true.",
    input_schema: { type: "object", properties: { id: { type: "integer", description: "The item's id" } }, required: ["id"], additionalProperties: false },
    strict: true,
  },
];

// Made on first use, so a build without ANTHROPIC_API_KEY still works.
let client: Anthropic | null = null;
// An organization-wide key must name its workspace (ANTHROPIC_WORKSPACE_ID);
// a key made inside a workspace needs nothing extra.
const anthropic = () =>
  (client ??= new Anthropic(process.env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } } : {}));

/**
 * With a question attached, Sonnet can ask Opus for a second opinion (the
 * advisor tool, server-side): only when its working disagrees with the
 * markscheme or it isn't sure (BRO_SYSTEM_PROMPT says when). At most once a
 * reply, with a bounded answer. Opus reads the same conversation; its advice
 * comes back encrypted and only Sonnet sees it.
 */
const ADVISOR = {
  type: "advisor_20260301",
  name: "advisor",
  model: "claude-opus-5-5",
  max_uses: 1,
  max_tokens: 3000,
  caching: { type: "ephemeral", ttl: "5m" },
} as unknown as Anthropic.Beta.BetaToolUnion;

/** What every Bro request shares, so the warm-up writes exactly the cache the chat reads. */
function broBase(context: string, withAdvisor = false) {
  return {
    model: BRO_CHAT_MODEL,
    betas: ["server-side-fallback-2026-07-01", ...(withAdvisor ? ["advisor-tool-2026-03-01"] : [])] as Anthropic.Beta.AnthropicBeta[],
    fallbacks: "default" as const,
    output_config: { effort: "low" as const },
    tools: withAdvisor ? [...TOOLS, ADVISOR] : TOOLS,
    system: [
      // Two cache points, kept for an hour: the prompt and tools (the same for every student, so
      // one write an hour serves everyone) and the student's context (the same across their chats
      // until something in it changes). Every message starts a new chat, so without these the
      // automatic point at the end would never match and each reply would re-read ~13k tokens.
      { type: "text" as const, text: BRO_SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const, ttl: "1h" as const } },
      {
        type: "text" as const,
        text: `Student context (from DiplomaHub, not written by the student; the memory list may include lines the student wrote):\n${context}`,
        cache_control: { type: "ephemeral" as const, ttl: "1h" as const },
      },
    ],
  };
}

/** What the student sees while a tool runs. */
const TOOL_STATUS: Record<string, string> = {
  build_set: "Building your set…",
  propose_hub_items: "Planning it for your Hub…",
  propose_hub_changes: "Checking your Hub…",
  find_hub_items: "Looking through your Hub…",
  find_resources: "Finding resources…",
  record_result: "Logging your result…",
  share_code: "Making your code…",
  redeem_code: "Redeeming your code…",
  propose_settings: "Checking your settings…",
  remember: "Noting that down…",
  forget: "Forgetting that…",
};

// Warm-up: when the bar opens, the student's context is written to the cache with an empty
// request (max_tokens 0: no reply, no output billed), so their first message starts straight
// away. At most once per WARM_EVERY per student on this server; when nothing has changed it's
// only a cache read, which also keeps the entry alive.
const WARM_EVERY = 10 * 60_000;
const warmedAt = new Map<string, number>();

async function warm(timeZone: unknown): Promise<Response> {
  const userId = await getCurrentUserId();
  const blocked = await guard();
  if (blocked || !userId) return blocked ?? fail("signed_out", "Sign in to talk to Bro.", 401);
  if (Date.now() - (warmedAt.get(userId) ?? 0) < WARM_EVERY) return NextResponse.json({ ok: true });
  if (warmedAt.size > 5000) warmedAt.clear();
  warmedAt.set(userId, Date.now());
  try {
    const t0 = Date.now();
    const context = await buildBroContext(validTimeZone(timeZone));
    const r = await anthropic().beta.messages.create({ ...broBase(context), max_tokens: 0, messages: [{ role: "user", content: "(warm-up)" }] });
    console.info(`bro warm ${JSON.stringify({ ms: Date.now() - t0, read: r.usage.cache_read_input_tokens ?? 0, write: r.usage.cache_creation_input_tokens ?? 0 })}`);
  } catch (e) {
    warmedAt.delete(userId);
    console.error("bro warm", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

type Fail = "invalid" | "signed_out" | "not_pro" | "cap_reached" | "error";
const fail = (error: Fail, message: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

function validTimeZone(tz: unknown): string {
  if (typeof tz !== "string" || tz.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

async function guard(): Promise<NextResponse | null> {
  if (!(await getCurrentUserId())) return fail("signed_out", "Sign in to talk to Bro.", 401);
  if (!(await getProStatus()).isPro) return fail("not_pro", "DiplomaBro is part of DiplomaPro.", 403);
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const chatId = (v: unknown): string | null => (typeof v === "string" && UUID.test(v) ? v : null);

/** A chat (?c=, default the latest) and the list of chats, for Bro to show when it opens. */
export async function GET(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  const url = new URL(req.url);
  const attempt = chatId(url.searchParams.get("attempt"));
  // ?attempt=: the chat about that practice set (empty when there's none yet); ?c=: one chat; neither: the latest.
  const wanted = attempt ? await getAttemptConversationId(attempt) : chatId(url.searchParams.get("c"));
  const [chat, conversations] = await Promise.all([
    attempt && !wanted ? Promise.resolve({ conversationId: null, messages: [] }) : getBroHistory(wanted, HISTORY_TURNS * 2),
    getBroConversations(),
  ]);
  return NextResponse.json({ ...chat, conversations }, { headers: { "Cache-Control": "no-store" } });
}

/** Deletes one chat (?c=). */
export async function DELETE(req: Request) {
  if (req.headers.get("origin") !== resolveOrigin(req.headers)) return fail("invalid", "Bad request.", 403);
  const blocked = await guard();
  if (blocked) return blocked;
  const id = chatId(new URL(req.url).searchParams.get("c"));
  if (!id) return fail("invalid", "Bad request.", 400);
  await deleteBroConversation(id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail("invalid", "Bad request.", 403);
  const t0 = Date.now();
  let body: { message?: unknown; opener?: unknown; timeZone?: unknown; conversationId?: unknown; question?: unknown; warm?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("invalid", "Bad request.", 400);
  }
  if (body.warm === true) return warm(body.timeZone);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return fail("invalid", "Type a message first.", 400);
  if (message.length > MAX_MESSAGE) return fail("invalid", `Keep it under ${MAX_MESSAGE} characters.`, 400);

  // "Talk to Bro" from the brief: the note Bro is following up. Sent to the model only, not saved.
  const opener = typeof body.opener === "string" && body.opener.length <= 1500 ? body.opener.trim() : "";

  const userId = await getCurrentUserId();
  const blocked = await guard();
  if (blocked || !userId) return blocked ?? fail("signed_out", "Sign in to talk to Bro.", 401);

  const timeZone = validTimeZone(body.timeZone);
  // The context is built while the message is counted (both are only database reads/writes).
  const contextReady = buildBroContext(timeZone);
  contextReady.catch(() => {}); // awaited below; don't let an early return leave it unhandled
  // Counted before the model runs, so two tabs can't both take the last message.
  const usage = await consumeUsage("bro_message");
  if (!usage.allowed) {
    return fail("cap_reached", `That's all ${usage.cap} of today's Bro messages. More tomorrow!`, 429, { cap: usage.cap });
  }

  // The question open on their screen (player, marking, results): loaded here from their own attempt, never from the browser.
  const qref = questionRef(body.question);
  const loaded = qref ? await loadQuestionForBro(userId, qref) : null;
  const questionBlock = loaded?.block ?? null;
  // Only an id that's really one of their chats continues it (RLS); anything else starts a new chat.
  // With a question, only a chat about that same attempt: never a general chat or another set's.
  let asked = chatId(body.conversationId);
  if (asked && loaded && qref && (await getConversationAttempt(asked)) !== qref.attemptId) asked = null;
  const [context, chat] = await Promise.all([contextReady, asked ? getBroHistory(asked, HISTORY_TURNS * 2) : Promise.resolve({ conversationId: null, messages: [] })]);
  const tContext = Date.now();
  const conversationId = chat.conversationId;
  const history = chat.messages;
  // The time goes with the message, not in the system prompt, so the cached prefix stays the same all day.
  const sentAt = new Date().toLocaleString("en-GB", { timeZone, weekday: "long", hour: "2-digit", minute: "2-digit" });
  // The API wants a user turn first; an older half-exchange at the cut is dropped.
  const firstUser = history.findIndex((m) => m.role === "user");
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...(firstUser === -1 ? [] : history.slice(firstUser)).map((m) => ({ role: m.role, content: m.content })),
    {
      role: "user",
      content: [
        { type: "text", text: opener ? `(I opened you from this note you wrote on my Hub: "${opener}")\n\n${message}` : message },
        { type: "text", text: `(Sent ${sentAt}, the student's time.)` },
        ...(questionBlock ? [{ type: "text" as const, text: `[From DiplomaHub, not written by the student]\n${questionBlock}` }] : []),
      ],
    },
  ];

  const encoder = new TextEncoder();
  const line = (o: unknown) => encoder.encode(JSON.stringify(o) + "\n");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      const tokens = { model: BRO_CHAT_MODEL as string, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      let refused = false;
      const cards: BroCard[] = [];
      let tFirstToken = 0;
      let tFirstText = 0;
      let rounds = 0;
      let advisorCalls = 0;
      try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
          rounds = round + 1;
          const reply = anthropic().beta.messages.stream(
            {
              ...broBase(context, Boolean(questionBlock)),
              max_tokens: 8000,
              // The conversation itself: a 5-minute point at the end (after the hour-long ones above).
              cache_control: { type: "ephemeral" },
              messages,
            },
            { signal: req.signal },
          );
          reply.on("streamEvent", (ev) => {
            if (!tFirstToken) tFirstToken = Date.now();
            if (ev.type === "content_block_start" && ev.content_block.type === "tool_use") {
              const status = TOOL_STATUS[ev.content_block.name];
              if (status) controller.enqueue(line({ t: "status", text: status }));
            } else if (ev.type === "content_block_start" && ev.content_block.type === "server_tool_use") {
              controller.enqueue(line({ t: "status", text: "Double-checking this one…" }));
            } else if (ev.type === "content_block_start" && ev.content_block.type === "thinking" && !answer) {
              controller.enqueue(
                line({ t: "status", text: round === 0 ? (questionBlock ? "Working through the question…" : "Thinking it through…") : "Putting it together…" }),
              );
            }
          });
          let firstText = true;
          reply.on("text", (text) => {
            if (!tFirstText) tFirstText = Date.now();
            // Text written before a tool call and after it: keep them apart as paragraphs.
            if (firstText && answer && !/\s$/.test(answer)) {
              answer += "\n\n";
              controller.enqueue(line({ t: "delta", text: "\n\n" }));
            }
            firstText = false;
            answer += text;
            controller.enqueue(line({ t: "delta", text }));
          });
          const final = await reply.finalMessage();
          tokens.model = final.model;
          tokens.input += final.usage.input_tokens;
          tokens.output += final.usage.output_tokens;
          tokens.cacheRead += final.usage.cache_read_input_tokens ?? 0;
          tokens.cacheWrite += final.usage.cache_creation_input_tokens ?? 0;
          // Opus's second opinion is billed apart (usage.iterations). Every Opus 5.5 price is
          // exactly twice Sonnet 5.5's, so it's saved as twice the tokens: one model column,
          // and the cost estimates (Admin → Bro, scripts/bro-costs.mjs) stay right.
          for (const it of (
            final.usage as {
              iterations?: { type?: string; input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }[];
            }
          ).iterations ?? []) {
            if (it.type !== "advisor_message") continue;
            advisorCalls++;
            tokens.input += 2 * (it.input_tokens ?? 0);
            tokens.output += 2 * (it.output_tokens ?? 0);
            tokens.cacheRead += 2 * (it.cache_read_input_tokens ?? 0);
            tokens.cacheWrite += 2 * (it.cache_creation_input_tokens ?? 0);
          }
          // A long server-side step (the advisor) can pause the turn: send it back to carry on.
          if (final.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: final.content });
            continue;
          }

          if (final.stop_reason === "refusal") {
            refused = true;
            break;
          }
          const calls = final.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (final.stop_reason !== "tool_use" || calls.length === 0) break;

          // Run the tools, side by side (the inputs are checked again here, whatever the model sent).
          // What they show (cards, notes) goes out in the order Bro called them.
          let cardSlots = 6 - cards.length;
          const CARD_TOOLS = ["build_set", "redo_set", "propose_hub_items", "find_resources", "propose_hub_changes", "share_code", "redeem_code", "propose_settings"];
          const ran = await Promise.all(
            calls.map(async (call): Promise<{ result: Anthropic.Beta.BetaToolResultBlockParam; out: unknown[]; card?: BroCard }> => {
              const done = (content: string, ok: boolean, out: unknown[] = [], card?: BroCard) => ({
                result: { type: "tool_result" as const, tool_use_id: call.id, content, is_error: !ok },
                out,
                card,
              });
              const i = (call.input ?? {}) as Record<string, unknown>;
              if (call.name === "remember") {
                const r = await addBroMemory(userId, i.kind, i.content, "bro");
                return r.ok
                  ? done(`Saved as [${r.item.id}].`, true, [{ t: "memory", id: r.item.id, kind: r.item.kind, content: r.item.content }])
                  : done(`Not saved: ${r.reason}`, false);
              }
              if (call.name === "record_result") {
                const r = await addResult(
                  { subjectId: i.subject_id, title: i.title, kind: i.kind, takenOn: i.date, grade: i.grade, marks: i.marks, maxMarks: i.max_marks, percent: i.percent },
                  "bro",
                  userId,
                );
                return r.ok
                  ? done("Logged on their Progress page.", true, [{ t: "result", id: r.result.id, text: `${r.result.title}, ${describeResult(r.result)}` }])
                  : done(`Not logged: ${r.reason}`, false);
              }
              if (call.name === "rename_set") {
                const r = await runRenameSet(i);
                return r.ok ? done(r.text, true) : done(`Not done: ${r.reason}`, false);
              }
              if (call.name === "find_hub_items") {
                const r = await runFindHubItems(i, timeZone);
                return r.ok ? done(r.text, true) : done(`Not done: ${r.reason}`, false);
              }
              if (CARD_TOOLS.includes(call.name)) {
                if (cardSlots <= 0) return done("Not done: Too many cards in one reply.", false);
                cardSlots--;
                const r =
                  call.name === "build_set"
                    ? await runBuildSet(i)
                    : call.name === "redo_set"
                      ? await runRedoSet(i)
                      : call.name === "find_resources"
                        ? await runFindResources(i)
                        : call.name === "propose_hub_changes"
                          ? await runProposeHubChanges(i, timeZone)
                          : call.name === "share_code"
                            ? await runShareCode(i)
                            : call.name === "redeem_code"
                              ? await runRedeemCode(i)
                              : call.name === "propose_settings"
                                ? await runProposeSettings(i)
                                : await runProposeHubItems(i, timeZone);
                return r.ok ? done(r.note, true, [{ t: "card", card: r.card }], r.card) : done(`Not done: ${r.reason}`, false);
              }
              if (call.name === "forget" && Number.isSafeInteger(i.id)) {
                const gone = await forgetBroMemory(userId, i.id as number);
                return gone ? done("Deleted.", true, [{ t: "forgot", content: gone }]) : done("No item with that id.", false);
              }
              return done("Unknown tool or bad input.", false);
            }),
          );
          const results = ran.map((r) => r.result);
          // The next round is Bro writing its reply around what the tools did.
          controller.enqueue(line({ t: "status", text: "Putting it together…" }));
          for (const r of ran) {
            if (r.card) cards.push(r.card);
            for (const o of r.out) controller.enqueue(line(o));
          }
          // Append the whole assistant turn unchanged (thinking blocks included), then the results.
          messages.push({ role: "assistant", content: final.content }, { role: "user", content: results });
        }

        if (!refused && !answer.trim() && cards.length) {
          // A reply that's only a card still gets a line of text, so the chat reads naturally.
          answer =
            cards[0].type === "set" || cards[0].type === "code" || cards[0].type === "redeem"
              ? "Here you go."
              : cards[0].type === "hub_changes" || cards[0].type === "settings"
                ? "Here's what would change. Tap Apply if it looks right."
                : "Here's the plan. Look right?";
          controller.enqueue(line({ t: "delta", text: answer }));
        }
        if (refused) {
          controller.enqueue(line({ t: "error", message: "Bro can't help with that one. Try asking another way." }));
        } else if (!answer.trim()) {
          controller.enqueue(line({ t: "error", message: "Bro didn't come up with an answer. Try again?" }));
        } else {
          const saved = await saveBroExchange(
            userId,
            conversationId,
            message,
            answer,
            tokens,
            loaded && qref ? { attemptId: qref.attemptId, setTitle: loaded.setTitle } : undefined,
            cards,
          );
          controller.enqueue(line({ t: "done", id: saved.replyId, conversationId: saved.conversationId, remaining: usage.remaining }));
        }
      } catch (e) {
        if (!req.signal.aborted) {
          console.error("bro chat", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
          const busy = e instanceof Anthropic.RateLimitError || (e instanceof Anthropic.APIError && (e.status ?? 0) >= 500);
          controller.enqueue(
            line({
              t: "error",
              message: busy
                ? "Bro is busy right now. Try again in a minute."
                : answer.trim()
                  ? "This reply couldn't be saved, so it won't be here when you come back."
                  : "Something went wrong. Try again?",
            }),
          );
        }
      } finally {
        // One line per reply: where the time went and what it cost, for the logs.
        console.info(
          `bro timing ${JSON.stringify({
            context: tContext - t0,
            firstToken: tFirstToken ? tFirstToken - t0 : null,
            firstText: tFirstText ? tFirstText - t0 : null,
            total: Date.now() - t0,
            rounds,
            advisor: advisorCalls,
            in: tokens.input,
            out: tokens.output,
            cacheRead: tokens.cacheRead,
            cacheWrite: tokens.cacheWrite,
          })}`,
        );
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}

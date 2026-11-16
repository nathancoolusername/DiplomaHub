import "server-only";

import type { CalendarItem, StrengthMap, Suggestion, SuggestionSurface, SubtopicStrength } from "@/lib/data/types";
import { getUpcomingItems } from "./calendar";
import { getBroMemory } from "./bro-memory";
import { getStrengthMaps } from "./strength";
import { getUserSubjects, getViewer } from "./viewer";

// Suggestions, most urgent first:
//   1. a test or mock coming up in that subject (focused on the tested topic
//      when the title names one, e.g. "Maths AA test: Calculus"),
//   2. Pro: a topic the student told Bro they find hard (bro_memory, kind
//      "struggle"), when its name matches subtopics in one of their subjects
//      (ranked like something three days away, so a test this week wins),
//   3. anything else coming up: deadlines get "Plan time", the rest (uni
//      events, tests in subjects with nothing to practise) are just
//      mentioned; all of these are interleaved soonest first,
//   4. their weakest topics with enough data,
//   5. a starter set when there's nothing else to say.
// Rule-based (no API cost); Pro gets Bro's fuller wording and the memory step.
// Every suggestion also has a short headline for Home's line under the greeting.

/** How far ahead a test starts steering a subject's suggestions. */
const TEST_HORIZON_DAYS = 14;

function daysUntil(iso: string): number {
  const a = new Date(iso);
  const b = new Date();
  return Math.round(
    (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86_400_000,
  );
}

function whenLabel(days: number): string {
  return days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

function list(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

type Focus = {
  map: StrengthMap;
  test: CalendarItem | null;
  /** Pro: subtopics the student told Bro they find hard (when there's no test). */
  remembered: boolean;
  testTopic: string | null;
  weakest: SubtopicStrength[];
  subtopics: SubtopicStrength[];
};

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Subtopics named in what the student told Bro they find hard ("Finds integration by parts hard"). */
function rememberedSubtopics(map: StrengthMap, struggles: string[]): SubtopicStrength[] {
  if (!struggles.length) return [];
  const said = struggles.map((t) => ` ${norm(t)} `);
  const mentions = (name: string) => {
    const n = norm(name);
    return n.length >= 5 && said.some((t) => t.includes(` ${n} `));
  };
  const hits = new Map<string, SubtopicStrength>();
  for (const topic of map.topics) {
    if (mentions(topic.name)) for (const s of topic.subtopics) hits.set(s.id, s);
    for (const s of topic.subtopics) if (mentions(s.name) || mentions(s.shortName)) hits.set(s.id, s);
  }
  return [...hits.values()].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 3);
}

/** Works out what one subject's practice should focus on right now. */
function subjectFocus(map: StrengthMap, upcoming: CalendarItem[], struggles: string[]): Focus {
  const test =
    upcoming.find((i) => i.subjectId === map.subject.id && (i.kind === "test" || i.kind === "mock") && daysUntil(i.startsAt) <= TEST_HORIZON_DAYS) ??
    null;

  // Narrow to the tested topic when the item's title names one.
  const all = map.topics.flatMap((t) => t.subtopics);
  let scope = all;
  let testTopic: string | null = null;
  if (test) {
    const title = test.title.toLowerCase();
    const topic = map.topics.find((t) => title.includes(t.name.toLowerCase()));
    if (topic) {
      scope = topic.subtopics;
      testTopic = topic.name;
    }
  }

  const weakest = scope.filter((s) => s.level !== "none").sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const untried = scope.filter((s) => s.level === "none");

  if (!test) {
    const said = rememberedSubtopics(map, struggles);
    if (said.length) return { map, test, remembered: true, testTopic: null, weakest: said.filter((s) => s.level !== "none"), subtopics: said };
  }
  return { map, test, remembered: false, testTopic, weakest, subtopics: [...weakest, ...untried].slice(0, 3) };
}

function toSuggestion(f: Focus, bro: boolean): Suggestion | null {
  const { map, test, testTopic, weakest, remembered } = f;
  if (f.subtopics.length === 0) return null;
  const subject = map.subject.shortName;
  const practiceType = map.subject.supportedTypes[0] ?? "mcq_short";
  const action = { type: "practice" as const, subjectId: map.subject.id, practiceType, subtopicIds: f.subtopics.map((s) => s.id) };
  const reasons: string[] = [];
  if (test) reasons.push(`${test.kind === "mock" ? "Mock" : "Test"} ${whenLabel(daysUntil(test.startsAt))}`);
  else if (remembered) reasons.push("You told Bro");
  else if (weakest.length) reasons.push("Weakest topics");

  const testLine = test ? `Your ${test.title} is ${whenLabel(daysUntil(test.startsAt))}.` : "";
  const weak = weakest.slice(0, 2).map((s) => s.shortName);

  let text: string;
  if (!bro) {
    // Free: plain rule wording.
    text = test
      ? `${testLine} Practise ${testTopic ?? subject}?`
      : weak.length
        ? `Your weakest area in ${subject} is ${weak[0]}. Start a 10-question set?`
        : `Start with a 10-question set in ${subject}. It takes about 10 minutes.`;
  } else if (remembered) {
    const named = f.subtopics.slice(0, 2).map((s) => s.shortName);
    text = `You said ${list(named)} ${named.length === 1 ? "is" : "are"} hard for you. A short set to work on ${named.length === 1 ? "it" : "them"}, one step at a time?`;
  } else if (test) {
    text = weak.length
      ? `${testLine} Your shakiest ${testTopic ?? subject} topics are ${list(weak)}. A 10-question set on them?`
      : `${testLine} A 10-question set on ${testTopic ?? subject} would show where you stand.`;
  } else {
    text = weak.length
      ? `Your weakest ${weak.length === 1 ? "area is" : "areas are"} ${list(weak)}. Start a 10-question set${weak.length > 1 ? " on them" : ""}?`
      : `Start with a 10-question set in ${subject}. It takes about 10 minutes.`;
  }

  const first = f.subtopics[0]?.shortName ?? subject;
  const headline = test
    ? `${test.title} ${whenLabel(daysUntil(test.startsAt))}. ${weak[0] ?? testTopic ?? subject} first?`
    : remembered
      ? `Let's crack ${first} today.`
      : weak.length
        ? `${weak[0]} is your shakiest topic. Ten minutes on it?`
        : `Ten questions in ${subject} to start?`;

  return {
    id: `${bro ? "bro" : "rule"}-${map.subject.id}-${f.subtopics.map((s) => s.id).join("-")}`,
    text,
    headline,
    actionLabel: test ? "Prepare for it" : "Build this set",
    action,
    source: bro ? "bro" : "rule",
    reasons,
  };
}

// Tests by days away; what they told Bro counts like something three days away (after this
// week's tests and anything due in the next few days, before later ones); then weakest topics.
const REMEMBERED_RANK = 3.25;
const focusRank = (f: Focus) => (f.test ? daysUntil(f.test.startsAt) : f.remembered ? REMEMBERED_RANK : 1000 + (f.weakest[0]?.score ?? 1));

/** Subjects ordered by urgency (soonest test first, then the weakest), plus what's coming up. */
async function rankedFocus(isPro: boolean): Promise<{ ranked: Focus[]; upcoming: CalendarItem[] }> {
  const [allMaps, upcoming, memory] = await Promise.all([
    getStrengthMaps(),
    getUpcomingItems(TEST_HORIZON_DAYS),
    isPro ? getBroMemory().catch(() => []) : Promise.resolve([]),
  ]);
  const struggles = memory.filter((m) => m.kind === "struggle").map((m) => m.content);
  // Only subjects there's something to practise in.
  const maps = allMaps.filter((m) => m.topics.length > 0 && m.subject.supportedTypes.length > 0);
  return { ranked: maps.map((m) => subjectFocus(m, upcoming, struggles)).sort((a, b) => focusRank(a) - focusRank(b)), upcoming };
}

/**
 * Something coming up that isn't already a practice suggestion. A deadline
 * (IA, EE, homework…) gets "Plan time", which opens Hub's Add item as a study
 * session for it. Anything else (a university event, a test in a subject
 * there's nothing to practise in yet) is only mentioned: no button.
 * Free wording stays general.
 * TODO(phase 7): Pro gets Bro's specific next step ("write your IA intro").
 */
function upcomingSuggestion(item: CalendarItem): Suggestion {
  const when = whenLabel(daysUntil(item.startsAt));
  if (item.isDeadline) {
    return {
      id: `rule-deadline-${item.id}`,
      text: `${item.title} is due ${when}. Set aside some time for it?`,
      headline: `${item.title} is due ${when}. Block out time?`,
      actionLabel: "Plan time",
      action: { type: "plan_time", itemId: item.id },
      source: "rule",
      reasons: [`Due ${when}`],
    };
  }
  const label = item.kind === "mock" ? "Mock" : item.kind === "test" ? "Test" : "Coming up";
  return {
    id: `rule-upcoming-${item.id}`,
    text: `${item.title} is ${when}.`,
    headline: `${item.title} is ${when}.`,
    source: "rule",
    reasons: [label === "Coming up" ? `Coming up ${when}` : `${label} ${when}`],
  };
}

async function starter(): Promise<Suggestion[]> {
  const first = (await getUserSubjects()).find((s) => s.subject.supportedTypes.length > 0)?.subject;
  if (!first) return [];
  return [
    {
      id: "rule-starter",
      text: `Start with a 10-question set in ${first.shortName}. It takes about 10 minutes.`,
      headline: `Ten questions in ${first.shortName} to start?`,
      actionLabel: "Start",
      action: { type: "practice", subjectId: first.id, practiceType: first.supportedTypes[0] ?? "mcq_short", subtopicIds: [] },
      source: "rule",
    },
  ];
}

/**
 * Suggestions for a surface. Pass a subject on the subject and build pages:
 * those only ever suggest work in that subject.
 */
export async function getSuggestions(surface: SuggestionSurface, subjectId?: string): Promise<Suggestion[]> {
  const bro = (await getViewer()).isPro;
  const { ranked, upcoming } = await rankedFocus(bro);

  // Subject and build pages stay about practising that subject.
  if (subjectId) {
    const f = ranked.find((x) => x.map.subject.id === subjectId);
    const s = f ? toSuggestion(f, bro) : null;
    return s ? [s] : [];
  }

  // Tests and other items soonest first (a test wins a tie), then weakest topics.
  // Home: the first is the line under the greeting, the next two are cards.
  const max = 3;
  const fromFocus = ranked
    .filter((f) => f.test || f.remembered || f.weakest.length)
    .map((f) => ({ rank: focusRank(f), test: f.test, s: toSuggestion(f, bro) }));
  // Everything else coming up, except study sessions and tests that already
  // have a practice suggestion above.
  const covered = new Set(fromFocus.map((x) => x.test).filter((t) => t !== null).map((t) => t.id));
  const fromUpcoming = upcoming
    .filter((i) => i.kind !== "study" && !covered.has(i.id))
    .map((i) => ({ rank: daysUntil(i.startsAt) + 0.5, s: upcomingSuggestion(i) }));
  const out = [...fromFocus, ...fromUpcoming]
    .filter((x): x is { rank: number; s: Suggestion } => x.s !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, max)
    .map((x) => x.s);
  return out.length ? out : starter();
}

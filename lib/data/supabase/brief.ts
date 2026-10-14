import "server-only";

import type { BroBrief } from "@/lib/data/types";
import { subjectById } from "@/lib/catalog";
import { getUpcomingItems } from "./calendar";
import { getStrengthMaps } from "./strength";
import { getSuggestions } from "./suggestions";
import { getViewer } from "./viewer";

// Bro's weekly brief (Pro). Until DiplomaBro (phase 7) writes it with the
// model and caches it in bro_suggestions, it's assembled from the same facts
// the context builder will send: the next 7 days and the weakest topics.

function when(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

/** null for free users, and when Bro has nothing to go on yet (no calendar items, no practice). */
export async function getBroBrief(): Promise<BroBrief | null> {
  if (!(await getViewer()).isPro) return null;

  const [items, maps] = await Promise.all([getUpcomingItems(7), getStrengthMaps()]);
  if (items.length === 0 && maps.every((m) => m.overall === null)) return null;
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
  return { text: parts.join(" "), generatedAt: new Date().toISOString() };
}

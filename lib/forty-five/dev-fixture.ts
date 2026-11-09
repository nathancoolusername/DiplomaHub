import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { Group } from "./engine.ts";
import type { SourcePuzzle } from "./format.ts";

// Dev only: a puzzle straight from content/forty-five/daily, for /dev/forty-five.
export function devPuzzle(slug: string): { slug: string; groups: Group[] } | null {
  if (process.env.NODE_ENV === "production") return null;
  const dir = path.join(process.cwd(), "content/forty-five/daily");
  if (!fs.existsSync(dir)) return null;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const p = (JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as SourcePuzzle[]).find((x) => x.slug === slug);
    if (p) return { slug, groups: p.groups.map((g) => ({ difficulty: g.difficulty, label: g.label, words: [...g.words], explanation: g.explanation })) };
  }
  return null;
}

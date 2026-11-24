// Flags daily sprint: 20 flags a day picked from the UTC date, the same for
// everyone, with no table and no scheduling. Each tier is walked through in a
// shuffled order (reshuffled every lap), so a country only comes back once its
// whole tier has had a turn (about 5 days for easy, 8 medium, 18 hard).

import { COUNTRIES, type Tier } from "./countries.ts";
import { FLAGS } from "./config.ts";

/** Today's date in UTC, "YYYY-MM-DD". */
export const utcToday = (now = new Date()) => now.toISOString().slice(0, 10);

const DAY_MS = 86_400_000;
const dayIndex = (date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${FLAGS.launchDate}T00:00:00Z`)) / DAY_MS);

/** Sprint number: launch day is #1. */
export const sprintNumber = (date: string) => dayIndex(date) + 1;

export function nextResetAt(now = new Date()): Date {
  return new Date(Date.parse(`${utcToday(now)}T00:00:00Z`) + DAY_MS);
}

/** The game day the server plays. In local dev FLAGS_TODAY=YYYY-MM-DD can move it. */
export function gameDay(): string {
  const o = process.env.NODE_ENV !== "production" ? process.env.FLAGS_TODAY : undefined;
  return o && /^\d{4}-\d{2}-\d{2}$/.test(o) ? o : utcToday();
}

function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(xs: readonly T[], seed: string): T[] {
  const r = rng(seed);
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BY_TIER: Record<Tier, string[]> = {
  1: COUNTRIES.filter((c) => c.tier === 1).map((c) => c.code),
  2: COUNTRIES.filter((c) => c.tier === 2).map((c) => c.code),
  3: COUNTRIES.filter((c) => c.tier === 3).map((c) => c.code),
};

const laps = new Map<string, string[]>();

/**
 * Mixed into every shuffle so the code alone (it's a public repo) can't tell
 * you tomorrow's sprint. Server only; set FLAGS_SEED in production and never
 * change it, or every past day's board changes.
 */
const seed = () => process.env.FLAGS_SEED ?? "";

/**
 * Tier `tier`'s order on lap `lap`. Countries from the end of the previous lap
 * go to the back of this one, so nothing comes back a day or two later.
 */
function lapOrder(tier: Tier, lap: number): string[] {
  const key = `${seed()}:${tier}:${lap}`;
  const hit = laps.get(key);
  if (hit) return hit;
  let order = shuffled(BY_TIER[tier], `flags:${seed()}:${tier}:${lap}`);
  if (lap > 0) {
    const tail = new Set(lapOrder(tier, lap - 1).slice(-2 * FLAGS.dailyMix[tier]));
    order = [...order.filter((c) => !tail.has(c)), ...order.filter((c) => tail.has(c))];
  }
  laps.set(key, order);
  return order;
}

/** The codes on `date`'s sprint, in board order. */
export function dailyCodes(date: string): string[] {
  const d = Math.max(0, dayIndex(date));
  const picked: string[] = [];
  for (const tier of [1, 2, 3] as Tier[]) {
    const pool = BY_TIER[tier];
    const k = FLAGS.dailyMix[tier];
    for (let i = d * k; i < d * k + k; i++) picked.push(lapOrder(tier, Math.floor(i / pool.length))[i % pool.length]);
  }
  return shuffled(picked, `flags:${seed()}:board:${date}`);
}

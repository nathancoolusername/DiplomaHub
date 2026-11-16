// List prices in US dollars per million tokens, for Admin → Bro's cost
// estimate. Check them against the Claude pricing page now and then; the
// real bill is in the Claude Console.

type Price = { input: number; output: number; cacheRead: number; cacheWrite: number };

const PRICES: Record<string, Price> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export type TokenTotals = { model: string; input: number; output: number; cache_read: number; cache_write: number };

/** Estimated dollars for some token totals; unknown models are priced like Sonnet 5.5. */
export function estimateCost(rows: TokenTotals[]): number {
  let dollars = 0;
  for (const r of rows) {
    const p = PRICES[r.model] ?? PRICES["claude-sonnet-5-5"];
    dollars +=
      ((r.input ?? 0) * p.input + (r.output ?? 0) * p.output + (r.cache_read ?? 0) * p.cacheRead + (r.cache_write ?? 0) * p.cacheWrite) / 1_000_000;
  }
  return dollars;
}

export function formatDollars(d: number): string {
  if (d === 0) return "$0";
  if (d < 0.01) return "<$0.01";
  return `$${d.toFixed(d < 10 ? 2 : 0)}`;
}

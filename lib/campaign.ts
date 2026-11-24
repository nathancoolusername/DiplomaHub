// The DiplomaPro launch campaign: the monthly price drops for everyone as
// more students join. Client-safe (the counter animates in the browser).

export type Tier = { price: number; at: number };

/** Price per month (EUR) once `at` students have joined. Lowest first is not assumed: sorted by `at`. */
export const TIERS: Tier[] = [
  { price: 9.99, at: 0 },
  { price: 8.99, at: 50 },
  { price: 7.99, at: 100 },
  { price: 6.99, at: 150 },
];

/** The price after the campaign, for anyone who joins later. */
export const LIST_PRICE = 9.99;

export const euros = (n: number) => `€${n.toFixed(2)}`;

/** The tier reached with `joined` students. */
export function currentTier(joined: number): Tier {
  return [...TIERS].sort((a, b) => a.at - b.at).filter((t) => joined >= t.at).pop() ?? TIERS[0];
}

/** The next tier still to reach, or null when the lowest price is unlocked. */
export function nextTier(joined: number): Tier | null {
  return [...TIERS].sort((a, b) => a.at - b.at).find((t) => t.at > joined) ?? null;
}

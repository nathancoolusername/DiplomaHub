// Forty-Five difficulty tiers: names, colours (tokens in app/globals.css) and share squares.

export type Tier = 1 | 2 | 3 | 4;

export const TIERS: Record<Tier, { name: string; bg: string; text: string; square: string }> = {
  1: { name: "Warm-up", bg: "bg-ff-1", text: "text-on-ff-1", square: "🟩" },
  2: { name: "Steady", bg: "bg-ff-2", text: "text-on-ff-2", square: "🟧" },
  3: { name: "Tricky", bg: "bg-ff-3", text: "text-on-ff-3", square: "🟦" },
  4: { name: "Fiendish", bg: "bg-ff-4", text: "text-on-ff-4", square: "🟥" },
};

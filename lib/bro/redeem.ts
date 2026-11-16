import { CODE_ALPHABET, type RedeemResult } from "@/lib/codes";

// Redeeming a code through Bro (redeem_code tool, and the Hub set choice on its card).

/** A code typed any way ("abc-de", " ABCDE ") in the code alphabet, or null. */
export function normaliseCode(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const c = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length >= 5 && c.length <= 12 && [...c].every((ch) => CODE_ALPHABET.includes(ch)) ? c : null;
}

/** What a redeemed code gave, in words, and where it is. */
export function redeemedText(r: Extract<RedeemResult, { ok: true }>): { text: string; href: string } {
  switch (r.type) {
    case "practice_set":
      return r.own
        ? { text: `That's the code of their own set "${r.title}" (from its printed PDF): nothing was copied. Open goes to marking it: the letters they circled, then the markscheme.`, href: `/practice/sets/${r.setId}/mark` }
        : { text: `"${r.title}" is in your practice sets.`, href: `/practice/sets/${r.setId}` };
    case "hub_item":
      return { text: `"${r.title}" is on your Hub.`, href: "/hub" };
    case "hub_set":
      return { text: `"${r.name}" (${r.count} items) is on your Hub, under Sets.`, href: "/hub" };
    default:
      return { text: `${r.days} days of DiplomaPro added.`, href: "/pro" };
  }
}


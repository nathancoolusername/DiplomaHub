// What Bro may remember (DiplomaBro spec: "It doesn't store sensitive details";
// most students are minors). Every save, by Bro or by the student, goes
// through checkMemory() on the server. It errs on the side of refusing: a
// refused line just isn't saved, while a saved sensitive one would be sent to
// the model on every message.

export const MEMORY_KINDS = ["goal", "struggle", "preference", "coursework", "note"] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const MEMORY_KIND_LABEL: Record<MemoryKind, string> = {
  goal: "Goals",
  struggle: "What they find hard",
  preference: "How they like help",
  coursework: "Coursework",
  note: "Study notes",
};

export const MEMORY_MAX_ITEMS = 30;
export const MEMORY_MAX_LENGTH = 200;

const SENSITIVE: { category: string; pattern: RegExp }[] = [
  {
    category: "health",
    pattern:
      /\b(depress\w*|anxi\w*|panic attack|adhd|add\b|autis\w*|dyslexi\w*|diagnos\w*|medicat\w*|meds\b|pills?\b|therap\w*|counsell?or|psychiatr\w*|psycholog\w*|self[- ]?harm\w*|suicid\w*|eating disorder|anorexi\w*|bulimi\w*|pregnan\w*|illness|ill\b|sick\b|disease|disabilit\w*|hospital|doctor|surgery|injur\w*|allerg\w*|insomnia|mental health|ocd\b|ptsd\b|bipolar)\b/i,
  },
  {
    category: "family and relationships",
    pattern:
      /\b(mum|mom|mother|dad|father|parents?|step\w*|brother|sister|siblings?|grand\w*|aunt|uncle|cousin|famil\w*|divorc\w*|boyfriend|girlfriend|partner|crush|dating|relationship|breakup|broke up|foster|adopted|custody)\b/i,
  },
  {
    category: "religion and beliefs",
    pattern: /\b(religio\w*|muslim|islam\w*|christian\w*|catholic|jewish|judaism|hindu\w*|buddhis\w*|sikh\w*|atheis\w*|church|mosque|synagogue|temple|pray\w*|ramadan|fasting)\b/i,
  },
  {
    category: "sexuality and gender identity",
    pattern: /\b(gay|lesbian|bisexual|bi\b|queer|trans\w*gender|transgender|nonbinary|non-binary|lgbt\w*|sexual\w*)\b/i,
  },
  {
    category: "contact details and location",
    pattern:
      /(@|https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d|\b(address|street|road|avenue|postcode|zip code|i live|lives? in|my house|phone|whatsapp|snapchat|instagram|insta\b|tiktok|discord)\b)/i,
  },
  {
    category: "money and safety",
    pattern: /\b(password|bank|card number|debt|abuse\w*|bull(y|ied|ying)|police|arrest\w*|drugs?|alcohol|drunk|vap\w*|smok\w*)\b/i,
  },
];

export type MemoryCheck = { ok: true; content: string } | { ok: false; reason: string };

/** Trims and checks one memory line. */
export function checkMemory(kind: unknown, content: unknown): MemoryCheck {
  if (typeof kind !== "string" || !(MEMORY_KINDS as readonly string[]).includes(kind)) {
    return { ok: false, reason: "Unknown kind." };
  }
  if (typeof content !== "string") return { ok: false, reason: "Nothing to remember." };
  const text = content.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "Nothing to remember." };
  if (text.length > MEMORY_MAX_LENGTH) return { ok: false, reason: `Keep it under ${MEMORY_MAX_LENGTH} characters.` };
  // IA/EE text is never stored: only topics and progress.
  if (kind === "coursework" && text.length > 160) return { ok: false, reason: "For coursework, keep just the topic and how far along it is." };
  for (const { category, pattern } of SENSITIVE) {
    if (pattern.test(text)) return { ok: false, reason: `Bro doesn't keep anything about ${category}.` };
  }
  return { ok: true, content: text };
}

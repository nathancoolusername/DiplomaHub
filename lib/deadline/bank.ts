// The Deadline prompt bank: its JSON format (the old content/deadline files,
// still used for bulk uploads) and how it lines up with the database
// (migration 56). Used by Admin → Deadline and by the tests.
// No answers live in this repo: content/ is git-excluded, the repo is public.

/** [canonical, rarity 1–7, aliases?, "x" = exact only?] */
export type Answer = [string, number, string[]?, string?];
export type Prompt = {
  slug: string;
  subject: string;
  text: string;
  fuzzy?: boolean;
  deny?: string[];
  answers: Answer[];
  /** Reviewer-only keys (note, reviewed): stored as `extra`, never shown in the game. */
  [extra: string]: unknown;
};
export type BankFile = { file: string; prompts: Prompt[] };

/** One prompt as the database holds it. */
export type DbPrompt = {
  slug: string;
  subject: string;
  text: string;
  fuzzy: boolean;
  deny: string[];
  active: boolean;
  file: string | null;
  position: number | null;
  extra: Record<string, unknown>;
  /** In file order (answers added in Admin last). */
  answers: Answer[];
};

const GAME_KEYS = new Set(["slug", "subject", "text", "fuzzy", "deny", "answers"]);

/** [c, r] / [c, r, aliases] / [c, r, aliases|[], "x"]: the shortest form that says it. */
export function tidyAnswer(a: Answer): Answer {
  const aliases = (a[2] ?? []).map((x) => x.trim()).filter(Boolean);
  if (a[3] === "x") return [a[0].trim(), a[1], aliases, "x"];
  return aliases.length ? [a[0].trim(), a[1], aliases] : [a[0].trim(), a[1]];
}

/** Problems that make an import refuse (the database checks them again). */
export function validate(files: BankFile[]): string[] {
  const errs: string[] = [];
  const slugs = new Map<string, string>();
  for (const { file, prompts } of files) {
    if (!Array.isArray(prompts)) { errs.push(`${file}: not a list of prompts`); continue; }
    for (const p of prompts) {
      if (!p || typeof p !== "object") { errs.push(`${file}: a prompt isn't an object`); continue; }
      const at = `${file} · ${p.slug ?? "(no slug)"}`;
      if (typeof p.slug !== "string" || !p.slug.trim()) errs.push(`${at}: no slug`);
      else if (slugs.has(p.slug.trim())) errs.push(`${at}: slug also in ${slugs.get(p.slug.trim())}`);
      else slugs.set(p.slug.trim(), file);
      if (typeof p.text !== "string" || !p.text.trim() || typeof p.subject !== "string" || !p.subject.trim()) errs.push(`${at}: needs text and subject`);
      if (p.deny != null && (!Array.isArray(p.deny) || p.deny.some((d) => typeof d !== "string"))) errs.push(`${at}: deny must be a list of words`);
      if (!Array.isArray(p.answers) || !p.answers.length) { errs.push(`${at}: no answers`); continue; }
      const seen = new Set<string>();
      for (const a of p.answers) {
        if (!Array.isArray(a) || typeof a[0] !== "string" || !a[0].trim() || !Number.isInteger(a[1]) || a[1] < 1 || a[1] > 7
          || (a[2] != null && (!Array.isArray(a[2]) || a[2].some((x) => typeof x !== "string")))) {
          errs.push(`${at}: bad answer ${JSON.stringify(a).slice(0, 80)}`);
          continue;
        }
        if (seen.has(a[0].trim())) errs.push(`${at}: "${a[0]}" listed twice`);
        seen.add(a[0].trim());
      }
    }
  }
  return errs;
}

export type PayloadPrompt = {
  slug: string; subject: string; text: string; fuzzy: boolean; deny: string[];
  file: string; position: number; extra: Record<string, unknown>; answers: Answer[];
};

/** What dl_import_bank receives. */
export function toPayload(files: BankFile[]): PayloadPrompt[] {
  return files.flatMap(({ file, prompts }) => prompts.map((p, position) => ({
    slug: p.slug.trim(), subject: p.subject.trim(), text: p.text.trim(), fuzzy: p.fuzzy ?? true,
    deny: (p.deny ?? []).map((d) => d.trim()).filter(Boolean), file, position,
    extra: Object.fromEntries(Object.entries(p).filter(([k]) => !GAME_KEYS.has(k))),
    answers: p.answers.map(tidyAnswer),
  })));
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sortedKeys = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

export type ImportDiff = {
  prompts: number;
  newPrompts: string[];
  changedPrompts: string[];
  added: number;
  changed: number;
  removed: number;
  /** Prompts on in the database but missing from the files: an import switches them off. */
  retired: string[];
  /** One line per prompt whose answers change. */
  lines: { slug: string; added: string[]; changed: string[]; removed: string[] }[];
  /** Slugs an import has to send (including layout-only changes). */
  touched: string[];
};

/** Files → database: what an import would change. */
export function diffImport(files: BankFile[], db: DbPrompt[], retireMissing = true): ImportDiff {
  const bySlug = new Map(db.map((p) => [p.slug, p]));
  const payload = toPayload(files);
  const out: ImportDiff = { prompts: payload.length, newPrompts: [], changedPrompts: [], added: 0, changed: 0, removed: 0, retired: [], lines: [], touched: [] };
  for (const p of payload) {
    const old = bySlug.get(p.slug);
    if (!old) { out.newPrompts.push(p.slug); out.touched.push(p.slug); out.added += p.answers.length; continue; }
    const head = old.subject !== p.subject || old.text !== p.text || old.fuzzy !== p.fuzzy || !same(old.deny, p.deny) || !old.active;
    const layout = old.file !== p.file || old.position !== p.position || !same(sortedKeys(old.extra), sortedKeys(p.extra))
      || !same(old.answers.map((a) => a[0]), p.answers.map((a) => a[0]));
    if (head) out.changedPrompts.push(p.slug);
    const oldA = new Map(old.answers.map((a) => [a[0], a]));
    const newA = new Set(p.answers.map((a) => a[0]));
    const add = p.answers.filter((a) => !oldA.has(a[0])).map((a) => a[0]);
    const chg = p.answers.filter((a) => oldA.has(a[0]) && !same(tidyAnswer(oldA.get(a[0])!), a)).map((a) => a[0]);
    const rm = old.answers.filter((a) => !newA.has(a[0])).map((a) => a[0]);
    out.added += add.length; out.changed += chg.length; out.removed += rm.length;
    if (add.length || chg.length || rm.length) out.lines.push({ slug: p.slug, added: add, changed: chg, removed: rm });
    if (head || layout || add.length || chg.length || rm.length) out.touched.push(p.slug);
  }
  if (retireMissing) {
    const inFiles = new Set(payload.map((p) => p.slug));
    out.retired = db.filter((p) => p.active && !inFiles.has(p.slug)).map((p) => p.slug);
  }
  return out;
}

/** Answers per prompt, as read from the database (position order, Admin additions last). */
export function groupAnswers(rows: { prompt_id: string; canonical: string; rarity: number; aliases: string[] | null; exact_only: boolean; position: number | null }[]) {
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.prompt_id, [...(by.get(r.prompt_id) ?? []), r]);
  const out = new Map<string, Answer[]>();
  for (const [id, list] of by) {
    list.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || a.canonical.localeCompare(b.canonical));
    out.set(id, list.map((a) => tidyAnswer([a.canonical, a.rarity, a.aliases ?? [], a.exact_only ? "x" : undefined])));
  }
  return out;
}

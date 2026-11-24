// Finds a comment's quote in a PDF page's text items (from pdf.js
// getTextContent), so the viewer can highlight it. Pure: no pdf.js import.

export type TextRun = { str: string; transform: number[]; width: number; height: number; hasEOL?: boolean };

/** A highlight in PDF user space: [x1, y1, x2, y2] (y up). */
export type PdfRect = [number, number, number, number];

const fold = (ch: string) =>
  ch
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐‑‒–—−]/g, "-")
    .toLowerCase();

/**
 * Normalises text (case, accents, curly quotes, dashes, whitespace) and keeps,
 * for every normalised character, which run and which character it came from.
 */
function normalise(runs: TextRun[]): { text: string; map: { run: number; ch: number }[] } {
  let text = "";
  const map: { run: number; ch: number }[] = [];
  let lastSpace = true;
  const push = (c: string, run: number, ch: number) => {
    if (/\s/.test(c)) {
      if (lastSpace) return;
      text += " ";
      map.push({ run, ch });
      lastSpace = true;
      return;
    }
    for (const f of fold(c)) {
      text += f;
      map.push({ run, ch });
    }
    lastSpace = false;
  };
  runs.forEach((r, i) => {
    for (let j = 0; j < r.str.length; j++) push(r.str[j], i, j);
    if (r.hasEOL) push(" ", i, r.str.length);
  });
  return { text, map };
}

const normaliseQuote = (q: string) =>
  [...q.replace(/^["'“”‘’\s.…]+|["'“”‘’\s.…]+$/g, "")]
    .map((c) => (/\s/.test(c) ? " " : fold(c)))
    .join("")
    .replace(/ +/g, " ")
    .trim();

/** Matches with and without spaces, since PDFs often split or join words oddly. */
function findRange(text: string, quote: string): [number, number] | null {
  if (quote.length < 3) return null;
  const i = text.indexOf(quote);
  if (i >= 0) return [i, i + quote.length];
  // Space-insensitive: compare with all spaces removed, then map back.
  const idx: number[] = [];
  let squashed = "";
  for (let k = 0; k < text.length; k++) {
    if (text[k] !== " ") {
      squashed += text[k];
      idx.push(k);
    }
  }
  const q = quote.replace(/ /g, "");
  const j = squashed.indexOf(q);
  if (j >= 0) return [idx[j], idx[j + q.length - 1] + 1];
  // Last resort: the first 6 words (the model may have trimmed or misquoted the end).
  const head = quote.split(" ").slice(0, 6).join(" ");
  if (head.length >= 12 && head !== quote) return findRange(text, head);
  return null;
}

/** Rectangles covering the quote on this page, one per text run it touches; null if not found. */
export function locateQuote(runs: TextRun[], quote: string): PdfRect[] | null {
  const { text, map } = normalise(runs);
  const range = findRange(text, normaliseQuote(quote));
  if (!range) return null;
  const [start, end] = range;
  const byRun = new Map<number, { from: number; to: number }>();
  for (let k = start; k < end; k++) {
    const { run, ch } = map[k];
    const cur = byRun.get(run);
    if (!cur) byRun.set(run, { from: ch, to: ch + 1 });
    else cur.to = Math.max(cur.to, ch + 1);
  }
  const rects: PdfRect[] = [];
  for (const [i, { from, to }] of byRun) {
    const r = runs[i];
    if (!r.str.length) continue;
    const [a, b, , , x, y] = r.transform;
    const h = r.height || Math.hypot(a, b) || 10;
    // Characters are spread evenly over the run's width: close enough for a highlight.
    const per = r.width / r.str.length;
    const x1 = x + per * from;
    const x2 = x + per * Math.min(to, r.str.length);
    rects.push([x1, y - h * 0.25, x2, y + h * 0.95]);
  }
  return rects.length ? rects : null;
}

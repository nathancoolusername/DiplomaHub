import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Questions, markschemes and solutions are stored as Markdown + LaTeX
// ($…$ inline, $$…$$ display), with GitHub-style pipe tables
// (| a | b | / |---|---|), so remark-gfm is on. KaTeX inherits
// currentColor, so maths follows the theme like any other text.

// Tables yes; single-tilde strikethrough no ("~5 cm" must stay as written).
const GFM: [typeof remarkGfm, { singleTilde: boolean }] = [remarkGfm, { singleTilde: false }];

/**
 * Fixes two things in maths before rendering:
 * - Money is written `$\$125$`. KaTeX reads `\$` as a dollar sign, but the
 *   Markdown maths parser ends the maths at that `$`, which printed
 *   "\125$". Inside maths `\$` becomes `\char36{}` (same glyph, no `$`).
 * - A stray `\'` (e.g. `f\'(x)`) is a text accent, not a prime; inside
 *   maths it becomes `'`.
 * - A `|` inside maths (|x|, \left| … \right|, set builders) becomes
 *   `\vert{}`, the same symbol: table rows are split on every `|`, even
 *   one inside $…$, which broke cells apart.
 * Outside maths, escapes are ordinary Markdown and are left alone.
 */
export function protectMathDollars(md: string): string {
  let out = "";
  let inMath = false;
  for (let i = 0; i < md.length; i++) {
    const c = md[i];
    if (c === "\\" && md[i + 1] === "$") {
      out += inMath ? "\\char36{}" : "\\$";
      i++;
      continue;
    }
    if (c === "\\" && md[i + 1] === "'" && inMath) {
      out += "'";
      i++;
      continue;
    }
    if (c === "\\" && md[i + 1] === "|" && inMath) {
      // \| (the norm sign) too: a table would read it as an escaped pipe.
      out += "\\Vert{}";
      i++;
      continue;
    }
    if (c === "|" && inMath) {
      out += "\\vert{}";
      continue;
    }
    if (c === "\\" && i + 1 < md.length) {
      // any other escape: copy both characters untouched
      out += c + md[i + 1];
      i++;
      continue;
    }
    if (c === "$") {
      // "$$" opens/closes display maths; "$" inline. Either way it toggles.
      const display = md[i + 1] === "$";
      out += display ? "$$" : "$";
      if (display) i++;
      inMath = !inMath;
      continue;
    }
    out += c;
  }
  return out;
}

/** The cells of one table row (after protectMathDollars, so a `|` in maths is already `\\vert{}`). */
function cellCount(line: string): number {
  const inner = line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  return inner.split(/(?<!\\)\|/).length;
}

const ROW = /^[ \t]*\|.*\|[ \t]*$/;
const DELIMITER = /^[ \t]*\|?[ \t]*:?-{1,}:?[ \t]*(\|[ \t]*:?-{1,}:?[ \t]*)*\|?[ \t]*$/;

/**
 * A pipe table only renders when its |---| row has exactly as many columns
 * as the header. Some generated questions are off by one (a header with 8
 * cells over a |---| row and data rows of 9), so every table is widened to
 * its widest row: the header gets empty cells, the |---| row more dashes.
 */
export function evenTables(md: string): string {
  const lines = md.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (!DELIMITER.test(lines[i]) || !ROW.test(lines[i - 1]) || !lines[i].includes("-")) continue;
    let end = i + 1;
    while (end < lines.length && ROW.test(lines[end])) end++;
    const width = Math.max(cellCount(lines[i - 1]), cellCount(lines[i]), ...lines.slice(i + 1, end).map(cellCount));
    const header = cellCount(lines[i - 1]);
    if (header < width) lines[i - 1] = lines[i - 1].trimEnd() + " |".repeat(width - header);
    lines[i] = "|" + "---|".repeat(width);
    i = end - 1;
  }
  return lines.join("\n");
}

const blockComponents: Components = {
  p: ({ children }) => <p className="mb-sm last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-lg mb-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-lg mb-sm">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-sm">
      <table className="border-collapse text-label-md [&_td]:border [&_td]:border-outline-variant [&_td]:px-sm [&_td]:py-xs [&_th]:border [&_th]:border-outline-variant [&_th]:px-sm [&_th]:py-xs">
        {children}
      </table>
    </div>
  ),
};

// For short fragments (MCQ options, mark points): no block wrappers.
const inlineComponents: Components = {
  ...blockComponents,
  p: ({ children }) => <>{children}</>,
};

export function MathMarkdown({
  children,
  inline = false,
  className = "",
}: {
  children: string;
  inline?: boolean;
  className?: string;
}) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={`math-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[GFM, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? inlineComponents : blockComponents}
      >
        {evenTables(protectMathDollars(children))}
      </ReactMarkdown>
    </Wrapper>
  );
}

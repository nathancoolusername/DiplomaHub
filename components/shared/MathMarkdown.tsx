import ReactMarkdown, { type Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Questions, markschemes and solutions are stored as Markdown + LaTeX
// ($…$ inline, $$…$$ display). KaTeX inherits currentColor, so maths
// follows the theme like any other text.

/**
 * Fixes two things in maths before rendering:
 * - Money is written `$\$125$`. KaTeX reads `\$` as a dollar sign, but the
 *   Markdown maths parser ends the maths at that `$`, which printed
 *   "\125$". Inside maths `\$` becomes `\char36{}` (same glyph, no `$`).
 * - A stray `\'` (e.g. `f\'(x)`) is a text accent, not a prime; inside
 *   maths it becomes `'`.
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
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? inlineComponents : blockComponents}
      >
        {protectMathDollars(children)}
      </ReactMarkdown>
    </Wrapper>
  );
}

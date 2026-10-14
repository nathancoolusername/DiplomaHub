import type { QuestionFigure } from "@/lib/data/types";

/**
 * Diagrams for a question, shown after the stem. The SVG is sanitized on the
 * server (lib/data/figures.ts) before it gets here, and draws with
 * currentColor so it follows the theme.
 */
export function QuestionFigures({ figures }: { figures?: QuestionFigure[] }) {
  if (!figures?.length) return null;
  return (
    <div className="flex flex-col items-center gap-md">
      {figures.map((f, i) => (
        <figure
          key={i}
          role="img"
          aria-label={f.alt}
          className="w-full max-w-[28rem] text-on-surface [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible"
          // Safe: sanitized server-side to drawing elements and attributes only.
          dangerouslySetInnerHTML={{ __html: f.svg }}
        />
      ))}
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getSet, getSetQuestions, getSubject, shareSet } from "@/lib/data";
import { formatCode } from "@/lib/codes";
import type { Question } from "@/lib/data/types";
import { examPaceSeconds } from "@/lib/practice/pace";
import { links } from "@/lib/practice/links";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { QuestionFigures } from "@/components/shared/QuestionFigures";
import { PrintToolbar } from "@/components/practice/pdf/PrintToolbar";

type Props = { params: Promise<{ setId: string }>; searchParams: Promise<{ print?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setId } = await params;
  const set = await getSet(setId).catch(() => null);
  // The PDF's file name comes from the title.
  return { title: set ? `${set.title} · DiplomaHub` : "Practice paper · DiplomaHub", robots: { index: false } };
}

// Light paper colours whatever the student's theme (Dark/Midnight would print light text).
const PAPER: CSSProperties = {
  ["--color-on-surface" as string]: "#0b1c30",
  ["--color-on-surface-variant" as string]: "#4a5568",
  ["--color-primary" as string]: "#002c98",
  ["--color-outline-variant" as string]: "#c9d2e3",
  ["--color-surface" as string]: "#ffffff",
  color: "#0b1c30",
  background: "#ffffff",
};

/** Answer lines: about two per mark, within reason. */
const linesFor = (marks: number) => Math.min(14, Math.max(3, marks * 2));

function AnswerLines({ marks }: { marks: number }) {
  return (
    <div aria-hidden="true" className="mt-sm">
      {Array.from({ length: linesFor(marks) }, (_, i) => (
        <div key={i} className="h-[28px] border-b border-dotted border-[#9aa6bb]" />
      ))}
    </div>
  );
}

/** Calculator allowed, or the same icon struck through: no calculator. */
function CalcIcon({ allowed, size = 16 }: { allowed: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={allowed ? "Calculator allowed" : "No calculator"}
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <path d="M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
      {!allowed && <line x1="2" y1="2" x2="22" y2="22" strokeWidth={2.4} />}
    </svg>
  );
}

function Marks({ n }: { n: number }) {
  return <span className="shrink-0 font-semibold tabular-nums">[{n}]</span>;
}

function PaperQuestion({ q, n }: { q: Question; n: number }) {
  const parts = q.parts.filter((p) => p.textMd || p.label !== "whole");
  const whole = q.parts.length === 1 && q.parts[0].label === "whole";
  return (
    <section className="dh-question flex gap-sm py-md border-t border-[#c9d2e3] first:border-t-0">
      <div className="w-8 shrink-0 flex flex-col items-start gap-xs">
        <span className="font-serif text-[17px] font-bold leading-none">{n}.</span>
        <span className={q.calculator ? "text-[#0b1c30]" : "text-[#b42318]"}>
          <CalcIcon allowed={q.calculator} />
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-sm text-[14.5px] leading-relaxed">
        {q.stemMd && <MathMarkdown>{q.stemMd}</MathMarkdown>}
        <QuestionFigures figures={q.figures} />

        {q.type === "mcq" && q.options ? (
          <>
            <div className="flex items-start gap-md">
              <div className="flex-1">
                <MathMarkdown>{q.parts[0]?.textMd ?? ""}</MathMarkdown>
              </div>
              <Marks n={q.totalMarks} />
            </div>
            <ol className="flex flex-col gap-sm">
              {q.options.map((o) => (
                <li key={o.key} className="flex items-start gap-sm">
                  <span className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#0b1c30] text-[13px] font-semibold">
                    {o.key}
                  </span>
                  <MathMarkdown inline>{o.textMd}</MathMarkdown>
                </li>
              ))}
            </ol>
          </>
        ) : whole ? (
          <>
            <div className="flex items-start gap-md">
              <div className="flex-1">
                <MathMarkdown>{q.parts[0].textMd}</MathMarkdown>
              </div>
              <Marks n={q.totalMarks} />
            </div>
            {q.type === "extended" && q.totalMarks >= 10 ? <p className="italic text-[#4a5568]">Answer on separate paper.</p> : <AnswerLines marks={q.totalMarks} />}
          </>
        ) : (
          parts.map((p) => (
            <div key={p.label} className="dh-part">
              <div className="flex items-start gap-md">
                <span className="w-9 shrink-0 font-semibold">({p.label})</span>
                <div className="flex-1 min-w-0">
                  <MathMarkdown>{p.textMd}</MathMarkdown>
                </div>
                <Marks n={p.marks} />
              </div>
              <div className="pl-[48px]">
                <AnswerLines marks={p.marks} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// A set as a printable DiplomaHub paper. The browser's print dialog makes the
// PDF, so the maths (KaTeX) and diagrams come out exactly as on screen.
// Questions only, never markschemes: same access as the player.
export default async function SetPdfPage({ params, searchParams }: Props) {
  const [{ setId }, { print }] = await Promise.all([params, searchParams]);
  const [set, questions] = await Promise.all([getSet(setId).catch(() => null), getSetQuestions(setId).catch(() => [])]);
  if (!set || questions.length === 0) notFound();
  const subject = getSubject(set.subjectId);
  if (!subject) notFound();

  const level = set.settings.level;
  const totalMarks = questions.reduce((n, q) => n + q.totalMarks, 0);
  const minutes = Math.max(5, Math.round(examPaceSeconds(subject, level, questions) / 60 / 5) * 5);
  const papers = [...new Set(questions.map((q) => q.paper))].map((p) => p.replace("P", "Paper ")).join(", ");
  // The code at the bottom: the set's share code (made now if it has none). Entering
  // your own code opens the set for marking; a friend's copy works the same way.
  const code = set.shareCode ?? (await shareSet(set.id).catch(() => null));

  return (
    <div className="dh-print-page min-h-screen bg-surface-container px-md py-lg">
      {/* Print: only the paper, on plain white A4, with a branded footer on every page. */}
      <style>{`
        @page { size: A4; margin: 12mm 14mm 16mm; }
        @media print {
          body * { visibility: hidden !important; }
          #dh-print, #dh-print * { visibility: visible !important; }
          #dh-print { position: absolute; inset: 0 auto auto 0; width: 100%; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; }
          html, body { background: #fff !important; }
          .dh-print-hide { display: none !important; }
          .dh-question, .dh-part, figure { break-inside: avoid; }
          .dh-footer { position: fixed; bottom: 0; left: 0; right: 0; margin: 0 !important; background: #fff; }
          .dh-footer-space { display: table-footer-group !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="mx-auto max-w-[210mm]">
        <PrintToolbar backHref={links.setQuestions(set.id)} auto={print === "1"} />

        <article id="dh-print" style={PAPER} className="rounded-xl bg-white px-[12mm] py-[10mm] shadow-sm">
          {/* The empty tfoot repeats on every printed page, keeping room for the fixed footer. */}
          <table className="w-full border-collapse">
            <tfoot className="dh-footer-space hidden">
              <tr>
                <td className="h-[10mm]" />
              </tr>
            </tfoot>
            <tbody>
              <tr>
                <td className="p-0 align-top">
                  <header className="flex flex-col gap-xs pb-sm border-b-2 border-[#002c98]">
                    <div className="flex items-baseline justify-between gap-md">
                      <span className="font-serif text-[22px] font-bold leading-none">
                        Diploma<span style={{ color: "#002c98" }}>Hub</span>
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a5568]">Practice paper</span>
                    </div>
                    <h1 className="font-serif text-[20px] font-bold leading-tight">{set.title}</h1>
                    <p className="text-[12.5px] text-[#4a5568]">
                      {subject.name} · {level}
                      {papers ? ` · ${papers}` : ""} · {questions.length} {questions.length === 1 ? "question" : "questions"} · {totalMarks} marks · about {minutes}{" "}
                      minutes
                    </p>
                    <p className="flex flex-wrap items-center gap-x-md gap-y-xs text-[12.5px] text-[#4a5568]">
                      <span className="inline-flex items-center gap-xs">
                        <CalcIcon allowed size={14} /> calculator allowed
                      </span>
                      <span className="inline-flex items-center gap-xs text-[#b42318]">
                        <CalcIcon allowed={false} size={14} /> <span className="text-[#4a5568]">no calculator</span>
                      </span>
                      <span>Marks in [brackets]</span>
                    </p>
                  </header>

                  <div>
                    {questions.map((q, i) => (
                      <PaperQuestion key={q.id} q={q} n={i + 1} />
                    ))}
                  </div>

                  <section className="dh-question mt-md flex items-center gap-md rounded-xl border-2 border-[#002c98] px-md py-sm">
                    <div className="flex-1 text-[12.5px]">
                      <p className="font-serif text-[15px] font-bold">Done? Mark it on DiplomaHub</p>
                      <p className="text-[#4a5568]">
                        {code
                          ? "Enter this code at diplomahub.org/codes, or give it to Bro. It opens this paper for marking against the markscheme."
                          : `Open diplomahub.org${links.play(set.id)} to mark it against the markscheme.`}
                      </p>
                    </div>
                    {code && (
                      <span className="font-mono text-[22px] font-bold tracking-[0.15em]" style={{ color: "#002c98" }}>
                        {formatCode(code)}
                      </span>
                    )}
                  </section>
                </td>
              </tr>
            </tbody>
          </table>

          <footer className="dh-footer mt-md flex items-center justify-between border-t border-[#c9d2e3] pt-xs text-[10px] text-[#4a5568]">
            <span>
              <span className="font-serif font-bold text-[#0b1c30]">
                Diploma<span style={{ color: "#002c98" }}>Hub</span>
              </span>{" "}
              · {set.title}
            </span>
            <span>diplomahub.org{code ? ` · code ${formatCode(code)}` : ""}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

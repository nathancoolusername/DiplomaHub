"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaperAction } from "@/app/practice/actions";
import { links } from "@/lib/practice/links";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { Spinner } from "@/components/spinner";

type Mcq = { id: string; n: number; stemMd: string; keys: string[] };

/**
 * Marking a printed paper: the letter circled for each multiple-choice
 * question (checked automatically), then the markscheme for the written ones.
 * With no multiple choice it goes straight to the markscheme.
 */
export function PaperMarking({ setId, title, mcqs, written }: { setId: string; title: string; mcqs: Mcq[]; written: number }) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const router = useRouter();

  const go = () =>
    start(async () => {
      setError(null);
      try {
        const { href } = await markPaperAction(setId, picks);
        router.push(href);
      } catch {
        setError("Couldn't open the markscheme. Try again.");
        started.current = false;
      }
    });

  // Only written questions: nothing to fill in here.
  useEffect(() => {
    if (mcqs.length === 0 && !started.current) {
      started.current = true;
      go();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mcqs.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-md py-xl flex flex-col items-center gap-md text-center">
        <p className="text-label-md text-on-surface-variant">{title}</p>
        {error ? (
          <>
            <p className="text-body-md text-error">{error}</p>
            <button type="button" onClick={go} className="rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-semibold cursor-pointer">
              Try again
            </button>
          </>
        ) : (
          <p className="inline-flex items-center gap-sm text-body-md text-on-surface">
            <Spinner size={16} /> Opening the markscheme…
          </p>
        )}
      </div>
    );
  }

  const chosen = mcqs.filter((q) => picks[q.id]).length;
  return (
    <div className="max-w-[720px] mx-auto px-md py-xl flex flex-col gap-lg pb-32">
      <header className="flex flex-col gap-xs">
        <p className="text-label-md text-on-surface-variant">{title}</p>
        <h1 className="font-serif font-bold text-headline-lg text-on-surface">Mark your paper</h1>
        <p className="text-body-md text-on-surface-variant">
          Pick the letter you circled for each multiple-choice question; they&apos;re checked for you.
          {written > 0 && " Then you tick your written answers against the markscheme."}
        </p>
      </header>

      <ul className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant">
        {mcqs.map((q) => (
          <li key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-sm px-lg py-md">
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-semibold text-on-surface">Question {q.n}</p>
              <div className="text-label-md text-on-surface-variant line-clamp-2">
                <MathMarkdown>{q.stemMd}</MathMarkdown>
              </div>
            </div>
            <div role="radiogroup" aria-label={`Question ${q.n}: the letter you circled`} className="flex gap-xs shrink-0">
              {q.keys.map((k) => {
                const on = picks[q.id] === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPicks((p) => (on ? Object.fromEntries(Object.entries(p).filter(([id]) => id !== q.id)) : { ...p, [q.id]: k }))}
                    className={`w-10 h-10 rounded-[50%] border-2 font-bold text-label-md cursor-pointer transition-colors ${
                      on ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface hover:border-primary"
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-surface glass border-t border-outline-variant">
        <div className="max-w-[720px] mx-auto px-md h-18 flex items-center justify-between gap-md">
          <span className="text-body-md text-on-surface tabular-nums">
            {chosen} / {mcqs.length} picked
            {error && <span className="ml-sm text-label-md text-error">{error}</span>}
          </span>
          <div className="flex items-center gap-sm">
            <Link href={links.play(setId)} className="hidden sm:inline text-label-md font-semibold text-on-surface-variant hover:text-primary">
              Do it on screen instead
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={go}
              className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
            >
              {busy && <Spinner size={14} />}
              {written > 0 ? "Next: the markscheme" : "See my results"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

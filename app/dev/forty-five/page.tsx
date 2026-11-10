import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { devPuzzle } from "@/lib/forty-five/dev-fixture";
import { shuffledWords } from "@/lib/forty-five/engine";
import { nextResetAt } from "@/lib/forty-five/dates";
import { Game } from "@/components/forty-five/Game";

export const metadata: Metadata = { title: "Forty-Five (demo)", robots: { index: false } };

type Props = { searchParams: Promise<{ p?: string }> };

// Dev only: play any content/ puzzle as a guest (/dev/forty-five?p=d-007), with
// no database. Same Game component and engine as /forty-five.
export default async function FortyFiveDemo({ searchParams }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const slug = (await searchParams).p ?? "d-001";
  const p = devPuzzle(slug);
  if (!p) notFound();
  return (
    <div className="max-w-[720px] mx-auto px-sm sm:px-md py-lg flex flex-col gap-lg">
      <h1 className="font-serif font-bold text-headline-lg text-on-surface text-center">Forty-Five #{Number(slug.slice(2)) || 1} (demo: {slug})</h1>
      <Game key={slug} api="/api/dev/forty-five" signedIn={false} puzzle={{ puzzleId: slug, number: Number(slug.slice(2)) || 1, date: "2026-11-10", words: shuffledWords(p.groups, slug), nextResetAt: nextResetAt().toISOString() }} />
    </div>
  );
}

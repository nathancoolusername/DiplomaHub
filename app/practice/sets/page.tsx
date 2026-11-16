import type { Metadata } from "next";
import Link from "next/link";
import { getPastSets, getSavedSets, getViewer } from "@/lib/data";
import { links } from "@/lib/practice/links";
import { PastSets } from "@/components/shared/PastSets";
import { YourSets } from "@/components/practice/sets/YourSets";

export const metadata: Metadata = { title: "Your sets" };

// Every set in one place: My sets (saved) and every set they've finished,
// each with its PDF, a redo and its results.
export default async function YourSetsPage() {
  const [viewer, saved, past] = await Promise.all([getViewer(), getSavedSets(), getPastSets({ limit: 100 })]);
  return (
    <div className="max-w-[1000px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <Link href={links.practice()} className="text-label-md font-semibold text-on-surface-variant hover:text-primary">
          ← Practice
        </Link>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Your sets</h1>
        <p className="text-body-md text-on-surface-variant">Your saved sets and every set you&apos;ve finished. Any of them can be a printable PDF.</p>
      </header>
      <YourSets sets={saved} isPro={viewer.isPro} />
      {past.length > 0 ? (
        <PastSets sets={past} showSubject full note={past.length === 100 ? "Your latest 100" : undefined} />
      ) : (
        <p className="text-body-md text-on-surface-variant">Sets you finish show up here with their results.</p>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FortyFiveTeaser from "@/components/home/signed-out/FortyFiveTeaser";
import { FinalCta, Hero, Improvement, LibrarySection, Loop, ProSection, Squads, Stats, SundayReset, TryIt } from "@/components/home/system/sections";
import { Wrap } from "@/components/home/system/upcoming";

export const metadata: Metadata = { title: "Homepage preview (dev)", robots: { index: false } };

// Dev-only: the live homepage plus the sections for features still being
// built (Sunday Reset, Squads, Wrapped), in the order they'll sit once shipped.
export default function HomePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="bg-surface">
      <Hero />
      <Stats />
      <Loop />
      <Improvement />
      <TryIt />
      <LibrarySection />
      <SundayReset />
      <Squads />
      <Wrap />
      <FortyFiveTeaser />
      <ProSection />
      <FinalCta />
    </main>
  );
}

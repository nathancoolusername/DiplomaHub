import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FinalCta, Hero, LibrarySection, Loop, ProSection, Stats, StayOnTrack, TryIt } from "@/components/home/system/sections";
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
      <TryIt />
      <Loop />
      <LibrarySection />
      <StayOnTrack />
      <Wrap />
      <ProSection />
      <FinalCta />
    </main>
  );
}

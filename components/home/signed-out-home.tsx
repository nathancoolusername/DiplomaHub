import FortyFiveTeaser from "./signed-out/FortyFiveTeaser";
import { FinalCta, Hero, Improvement, LibrarySection, Loop, ProSection, Squads, Stats, SundayReset, TryIt } from "./system/sections";

// The signed-out homepage: "Your IB, run like a system". Everything here is
// the same for every visitor (ISR, see app/page.tsx), so nothing reads
// per-user data. Wrapped (still being built) is in ./system/upcoming.tsx
// (preview at /dev/home); add it here when it ships.
export default function SignedOutHome() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
      <Loop />
      <Improvement />
      <TryIt />
      <LibrarySection />
      <SundayReset />
      <Squads />
      <FortyFiveTeaser />
      <ProSection />
      <FinalCta />
    </div>
  );
}

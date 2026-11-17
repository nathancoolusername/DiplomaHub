import FortyFiveTeaser from "./signed-out/FortyFiveTeaser";
import { FinalCta, Hero, Improvement, LibrarySection, Loop, ProSection, Stats, TryIt } from "./system/sections";

// The signed-out homepage: "Your IB, run like a system". Everything here is
// the same for every visitor (ISR, see app/page.tsx), so nothing reads
// per-user data. Sections for features still being built are in
// ./system/upcoming.tsx (preview at /dev/home); add each here when it ships.
export default function SignedOutHome() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Stats />
      <Loop />
      <Improvement />
      <TryIt />
      <LibrarySection />
      <FortyFiveTeaser />
      <ProSection />
      <FinalCta />
    </div>
  );
}

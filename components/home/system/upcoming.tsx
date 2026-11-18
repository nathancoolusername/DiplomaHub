import { Share2 } from "lucide-react";
import { eyebrow, h2 } from "./sections";

// Homepage sections for features still being built (now just Wrapped). They
// only show on /dev/home; move each into the homepage
// (components/home/signed-out-home.tsx) the day its feature ships. Every
// number here is sample data.

/** Story cards in the style of a year-in-review: bold colour, huge numbers, one idea each. */
export function Wrap() {
  return (
    <section className="px-md py-20 overflow-hidden">
      <div className="max-w-[1300px] mx-auto flex flex-col gap-xl">
        <div className="text-center flex flex-col gap-sm max-w-180 mx-auto">
          <p className={eyebrow}>DiplomaHub Wrapped, every month</p>
          <h2 className={h2}>Your month, made for your story.</h2>
          <p className="text-body-lg text-on-surface-variant">
            On the 1st, your last month comes back as a set of cards: marks recovered, your comeback topic, your study personality and your
            squad&apos;s best. Swipe through, then share.
          </p>
        </div>
        <div className="flex gap-md justify-start lg:justify-center overflow-x-auto pb-md snap-x -mx-md px-md">
          <StoryCard bg="#1a1446" fg="white" blob="#6d4bff">
            <p className="text-label-md font-bold uppercase tracking-[0.2em] opacity-80">October</p>
            <p className="font-serif font-black text-[5.5rem] leading-[0.9]" style={{ color: "#c6ff3d" }}>143</p>
            <p className="text-[1.6rem] font-bold leading-tight">marks recovered.</p>
            <p className="text-body-md opacity-80 mt-auto">Your best month so far.</p>
          </StoryCard>
          <StoryCard bg="#ff5a36" fg="#1a0b05" blob="#ffd23f">
            <p className="text-label-md font-bold uppercase tracking-[0.2em] opacity-80">Your comeback topic</p>
            <p className="font-serif font-black text-[2.5rem] leading-[0.95]">Elasticity</p>
            <p className="text-[1.3rem] font-bold leading-tight">From 2 of 9 marks to 9 of 9 in three weeks.</p>
            <p className="text-body-md opacity-80 mt-auto">Economics never saw it coming.</p>
          </StoryCard>
          <StoryCard bg="#0d2b25" fg="white" blob="#0fa37f">
            <p className="text-label-md font-bold uppercase tracking-[0.2em] opacity-80">Your study personality</p>
            <p className="font-serif font-black text-[2.5rem] leading-[0.95]" style={{ color: "#7dffcf" }}>The Night Closer</p>
            <p className="text-body-md opacity-90">71% of your marks came back after 9pm. You finish what you start: 94% of your sets done.</p>
          </StoryCard>
          <StoryCard bg="#ffe4f1" fg="#5c0b2e" blob="#ff7ab6">
            <p className="text-label-md font-bold uppercase tracking-[0.2em] opacity-70">Your top 5</p>
            <ol className="flex flex-col gap-xs">
              {["Elasticity", "Waves", "Integration", "Market failure", "Kinematics"].map((t, i) => (
                <li key={t} className="flex items-baseline gap-sm">
                  <span className="font-serif font-black text-[2rem] leading-none w-7" style={{ color: "#d6246e" }}>
                    {i + 1}
                  </span>
                  <span className="text-[1.25rem] font-bold">{t}</span>
                </li>
              ))}
            </ol>
            <p className="text-body-md opacity-80 mt-auto">Gap: 6 → 3 points.</p>
          </StoryCard>
        </div>
        <p className="text-center text-label-md text-on-surface-variant inline-flex items-center gap-xs justify-center">
          <Share2 size={14} aria-hidden="true" /> Every card is 9:16, ready for a story. Grades never appear unless you add them.
        </p>
      </div>
    </section>
  );
}

function StoryCard({ bg, fg, blob, children }: { bg: string; fg: string; blob: string; children: React.ReactNode }) {
  return (
    <div
      className="relative shrink-0 snap-center w-60 aspect-[9/16] rounded-[28px] p-lg overflow-hidden shadow-2xl flex flex-col gap-sm"
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-50 blur-2xl" style={{ backgroundColor: blob }} aria-hidden="true" />
      <span className="absolute -left-10 bottom-10 w-32 h-32 rounded-[40%] opacity-30 blur-xl rotate-12" style={{ backgroundColor: blob }} aria-hidden="true" />
      <div className="relative flex flex-col gap-sm h-full">{children}</div>
      <p className="relative text-[0.7rem] font-bold tracking-[0.2em] uppercase opacity-60">DiplomaHub Wrapped</p>
    </div>
  );
}


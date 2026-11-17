import { CalendarDays, ListChecks, Share2, Trophy, Users } from "lucide-react";
import { card, eyebrow, h2 } from "./sections";

// Homepage sections for features still being built. They only show on
// /dev/home; move each into the homepage (components/home/signed-out-home.tsx)
// the day its feature ships. Every number here is sample data.

export function Squads() {
  const board = [
    { n: "Maya", m: 34, c: "bg-primary/85" },
    { n: "You", m: 27, c: "bg-primary" },
    { n: "Leo", m: 21, c: "bg-primary/65" },
    { n: "Aarav", m: 18, c: "bg-primary/50" },
    { n: "Sofia", m: 12, c: "bg-primary/35" },
  ];
  return (
    <section className="px-md py-20 bg-surface-container-low">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-xl items-center">
        <div className="flex flex-col gap-md">
          <p className={eyebrow}>Squads</p>
          <h2 className={h2}>Revise with your friends, not just next to them.</h2>
          <p className="text-body-lg text-on-surface-variant">
            One code and your friends are in. Your squad gets its own leaderboard, a shared shelf of sets, the same mock dates on everyone&apos;s
            Hub, and a nudge when someone&apos;s gone quiet. Squads compare marks recovered, never grades.
          </p>
          <ul className="grid sm:grid-cols-2 gap-sm text-body-md text-on-surface">
            <li className="flex gap-sm"><Trophy size={18} className="text-primary shrink-0 mt-px" /> Weekly squad leaderboard</li>
            <li className="flex gap-sm"><ListChecks size={18} className="text-primary shrink-0 mt-px" /> Sets shared in one tap</li>
            <li className="flex gap-sm"><CalendarDays size={18} className="text-primary shrink-0 mt-px" /> Shared test dates</li>
            <li className="flex gap-sm"><Users size={18} className="text-primary shrink-0 mt-px" /> Explain-it-to-me requests</li>
          </ul>
        </div>
        <div className={`${card} p-lg flex flex-col gap-md shadow-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif font-bold text-headline-md text-on-surface">The Paper 2 Survivors</p>
              <p className="text-label-md text-on-surface-variant">5 members · code K7MPX</p>
            </div>
            <span className="rounded-full bg-secondary-container text-on-secondary-container px-md py-xs text-label-md font-semibold">This week</span>
          </div>
          <ol className="flex flex-col gap-sm">
            {board.map((p, i) => (
              <li key={p.n} className={`flex items-center gap-sm rounded-2xl px-sm py-xs ${p.n === "You" ? "bg-primary-fixed" : ""}`}>
                <span className="w-5 text-label-md font-bold text-on-surface-variant tabular-nums">{i + 1}</span>
                <span className={`w-8 h-8 rounded-full ${p.c} text-white flex items-center justify-center text-label-md font-bold`}>{p.n[0]}</span>
                <span className="flex-1 text-body-md font-semibold text-on-surface">{p.n}</span>
                <div className="w-32 h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div className={`h-full ${p.c}`} style={{ width: `${(p.m / 34) * 100}%` }} />
                </div>
                <span className="w-10 text-right text-label-md font-bold tabular-nums text-on-surface">{p.m}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-surface-container-low p-sm flex items-center gap-sm text-label-md text-on-surface">
            <ListChecks size={16} className="text-primary" />
            <span className="flex-1">
              <span className="font-semibold">Maya</span> shared &ldquo;Organic mechanisms, 12 Qs&rdquo;
            </span>
            <span className="rounded-lg bg-primary text-on-primary px-sm py-px font-semibold">Start</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SundayReset() {
  return (
    <section className="px-md py-20">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-xl items-center">
        <div className={`${card} p-lg flex flex-col gap-md shadow-xl order-2 lg:order-1`}>
          <div className="flex items-center justify-between">
            <p className="font-serif font-bold text-headline-md text-on-surface">Sunday Reset</p>
            <span className="text-label-md text-on-surface-variant">10 min · 3 steps</span>
          </div>
          <div className="flex flex-col gap-sm">
            <div className="rounded-2xl bg-surface-container-low p-md">
              <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">1 · Last week</p>
              <p className="text-body-md text-on-surface">
                <span className="font-semibold">8 marks recovered.</span> Still open: 3 on waves, 2 on evaluate questions.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-md">
              <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">2 · This week</p>
              <p className="text-body-md text-on-surface">Physics test Thursday · Econ IA draft Friday</p>
            </div>
            <div className="rounded-2xl bg-primary-fixed text-on-primary-fixed p-md flex flex-col gap-xs">
              <p className="text-label-sm font-bold uppercase tracking-wide">3 · Three sessions</p>
              <p className="text-body-md">Mon 25 min waves · Tue 20 min evaluate · Wed 30 min Paper 2 mix</p>
              <span className="self-start rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold">Add to my Hub</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-md order-1 lg:order-2">
          <p className={eyebrow}>The weekly ritual</p>
          <h2 className={h2}>Ten minutes on Sunday. A calm week after it.</h2>
          <p className="text-body-lg text-on-surface-variant">
            Look back at the marks you lost, see what&apos;s coming, and put three short sessions where they&apos;ll count. The whole system,
            in one sitting. You get a reminder, and your squad sees who&apos;s done theirs.
          </p>
        </div>
      </div>
    </section>
  );
}

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


import { Fragment } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Crosshair, Library, ListChecks, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { BroAvatar } from "@/components/shared/BroAvatar";
import { WaitlistForm } from "@/components/pro/WaitlistForm";
import { getHomepageStats } from "@/app/lib/actions/site-stats";
import { getFeaturedResources } from "@/app/lib/actions/resources";
import { getQuickCheckSubjects } from "@/lib/marketing/quick-check";
import { getPracticeQuestionCount } from "@/lib/marketing/stats";
import { allSubjects } from "@/lib/catalog";
import { QuickCheckPicker } from "./QuickCheck";
import { SystemDemo } from "./SystemDemo";
import { CountUp } from "./CountUp";
import { FortyFiveMark } from "@/components/forty-five/FortyFiveMark";

// The signed-out homepage: "Your IB, run like a system". Everything here is
// the same for every visitor (the page is static), so the numbers that
// aren't real counts are labelled as samples. Wrapped (still being built)
// lives in ./upcoming.tsx and only shows on /dev/home until it ships.

export const eyebrow = "text-label-md font-bold uppercase tracking-[0.15em] text-primary";
export const h2 = "font-serif font-bold text-headline-lg text-on-surface";
export const card = "rounded-3xl bg-surface-container-lowest border border-outline-variant";
const sample = "rounded-full bg-surface-container px-sm py-px text-label-sm text-on-surface-variant";

export function Hero() {
  const subjects = allSubjects()
    .map((s) => ({ id: s.id, name: s.shortName }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section className="bg-surface-container-low px-md pt-16 md:pt-20 pb-xl">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-xl items-center">
        <div className="flex flex-col gap-lg text-center lg:text-left">
          <p className={eyebrow}>For every IB subject, Year 1 and Year 2</p>
          <h1 className="font-serif font-bold text-on-surface text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[1.02] tracking-tight">
            Your IB,
            <br />
            <span className="text-primary">run like a system.</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-140 mx-auto lg:mx-0">Every test planned. Every result tracked. Every subject climbing.</p>
          <div className="flex flex-wrap items-center gap-md justify-center lg:justify-start">
            <Link href="/signup" className="rounded-lg bg-primary text-on-primary px-lg py-sm text-body-lg font-semibold hover:bg-primary/90">
              Start free
            </Link>
            <a href="#try-it" className="text-body-md font-semibold text-primary hover:underline">
              or try 3 questions ↓
            </a>
          </div>
        </div>
        <SystemDemo subjects={subjects} />
      </div>
    </section>
  );
}

/** Real numbers, counting up when they scroll into view. */
export async function Stats() {
  const [r, questions] = await Promise.all([getHomepageStats(), getPracticeQuestionCount().catch(() => 0)]);
  const st = r.success ? r.data : null;
  if (!st) return null;
  const items = [
    ...(questions > 0 ? [{ n: questions, suffix: "+", label: "practice questions" }] : []),
    { n: st.resourceCount, suffix: "+", label: "free resources" },
    { n: st.userCount, suffix: "+", label: "IB students" },
    { n: st.subjectCount, suffix: "", label: "subjects" },
  ];
  return (
    <section className="bg-surface-container-low px-md pb-16">
      <dl className="max-w-[1100px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-y-lg gap-x-md rounded-3xl border border-outline-variant bg-surface-container-lowest px-md py-lg">
        {items.map((x) => (
          <div key={x.label} className="flex flex-col-reverse items-center text-center gap-px">
            <dt className="text-label-md text-on-surface-variant">{x.label}</dt>
            <dd className="font-serif font-bold text-primary text-[clamp(2rem,5vw,3.25rem)] leading-none">
              <CountUp to={x.n} suffix={x.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Loop() {
  const steps = [
    { icon: <Crosshair size={20} />, name: "Find", body: "A strength map of every subject, topic by topic, and every marked set shows exactly where the marks went." },
    { icon: <CalendarDays size={20} />, name: "Plan", body: "Tests, IAs and deadlines on one Hub, with study sessions placed before each one." },
    { icon: <ListChecks size={20} />, name: "Practise", body: "Short sets on exactly the topics you need, not \"revise everything\". On screen or printed." },
    { icon: <TrendingUp size={20} />, name: "Improve", body: "Log every result and watch each subject climb, with your grade and the boundaries beside it." },
  ];
  return (
    <section className="px-md py-20">
      <div className="max-w-[1300px] mx-auto flex flex-col gap-xl">
        <div className="text-center flex flex-col gap-sm">
          <p className={eyebrow}>The system</p>
          <h2 className={h2}>One loop. Every week. Until May.</h2>
        </div>
        <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-md">
          {steps.map((s, i) => (
            <li key={s.name} className={`${card} p-lg flex flex-col gap-sm relative`}>
              <span className="absolute top-md right-md font-serif font-bold text-[3.5rem] leading-none text-primary/10" aria-hidden="true">
                {i + 1}
              </span>
              <span className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
                {s.icon}
              </span>
              <h3 className="font-serif font-bold text-headline-md text-on-surface">{s.name}</h3>
              <p className="text-body-md text-on-surface-variant">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Improvement() {
  const subjects = [
    { s: "Physics", from: 52, to: 74, g: "4 → 6" },
    { s: "History", from: 61, to: 70, g: "5 → 6" },
    { s: "Economics", from: 58, to: 66, g: "5 → 5" },
    { s: "Spanish B", from: 70, to: 81, g: "6 → 7" },
  ];
  return (
    <section className="px-md py-20 bg-surface-container">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
        <div className="flex flex-col gap-md">
          <p className={eyebrow}>The number that matters</p>
          <h2 className={h2}>Not streaks. Not hours. Improvement.</h2>
          <p className="text-body-lg text-on-surface-variant">
            Log each test and mock on Progress, and every subject gets its own line going up, with your grade and the boundaries beside it. In
            practice, every marked set also shows the exact marks you lost and why.
          </p>
          <Link href="/progress" className="self-start text-label-lg font-semibold text-primary hover:underline">
            See Progress →
          </Link>
        </div>
        <div className={`${card} p-lg flex flex-col gap-md shadow-xl`}>
          <div className="flex items-start justify-between gap-sm">
            <div>
              <p className="text-label-md text-on-surface-variant">Since September</p>
              <p className="font-serif font-bold text-[4rem] leading-none tabular-nums text-primary">+3</p>
              <p className="text-label-md text-on-surface-variant">grades up across your subjects</p>
            </div>
            <span className={sample}>Sample</span>
          </div>
          <ul className="flex flex-col gap-sm">
            {subjects.map((x) => (
              <li key={x.s} className="flex flex-col gap-px">
                <div className="flex justify-between text-label-md text-on-surface">
                  <span>{x.s}</span>
                  <span className="tabular-nums text-on-surface-variant">
                    {x.from}% → <span className="font-bold text-on-surface">{x.to}%</span> · grade {x.g}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-surface-container-high overflow-hidden">
                  {/* Where you started (pale), and how far you've come (solid). */}
                  <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${x.to}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-l-full bg-primary/40" style={{ width: `${x.from}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export async function TryIt() {
  const subjects = await getQuickCheckSubjects();
  return (
    <section id="try-it" className="px-md py-20 scroll-mt-16">
      <div className="max-w-[820px] mx-auto flex flex-col gap-lg">
        <div className="text-center flex flex-col gap-sm">
          <p className={eyebrow}>Try it now</p>
          <h2 className={h2}>Find your lost marks in 3 questions.</h2>
          <p className="text-body-lg text-on-surface-variant">Pick a subject, answer, mark it like an examiner. No account needed.</p>
        </div>
        <QuickCheckPicker subjects={subjects} />
        <p className="text-center text-label-sm text-on-surface-variant">
          Questions are written for DiplomaHub in the style of IB papers. DiplomaHub is not affiliated with the International Baccalaureate.
        </p>
      </div>
    </section>
  );
}

const RESOURCE_TYPES = ["Subject notes", "IA exemplars", "EE exemplars", "TOK exemplars", "Past papers", "Guides", "Templates"];

/** The library: every subject, including the ones practice doesn't cover yet. Real counts and real featured resources. */
export async function LibrarySection() {
  const [statsResult, featuredResult] = await Promise.all([getHomepageStats(), getFeaturedResources(3)]);
  const stats = statsResult.success ? statsResult.data : null;
  const featured = featuredResult.success ? featuredResult.data : [];
  return (
    <section className="px-md py-20 bg-surface-container-low">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-xl items-center">
        <div className="flex flex-col gap-md">
          <p className={eyebrow}>The library</p>
          <h2 className={h2}>Practice is growing subject by subject. Resources already cover every one.</h2>
          <p className="text-body-lg text-on-surface-variant">
            {stats ? `${stats.resourceCount}+` : "Hundreds of"} notes, exemplar IAs, EEs and TOK essays, guides and past papers, shared by IB
            students across {stats ? stats.subjectCount : "every"} subjects. And they&apos;re where you need them: open any deadline on your Hub
            and the matching resources are right there.
          </p>
          <div className="flex flex-wrap gap-xs">
            {RESOURCE_TYPES.map((t) => (
              <span key={t} className="rounded-full border border-outline-variant px-sm py-px text-label-md text-on-surface-variant">
                {t}
              </span>
            ))}
          </div>
          <Link href="/resources" className="self-start text-label-lg font-semibold text-primary hover:underline">
            Browse the library →
          </Link>
        </div>

        {featured.length > 0 && (
          <div className={`${card} p-lg flex flex-col gap-md shadow-xl`}>
            <div className="flex items-center gap-sm">
              <span className="w-10 h-10 rounded-xl bg-on-surface text-surface flex items-center justify-center" aria-hidden="true">
                <Library size={18} />
              </span>
              <div className="flex-1">
                <p className="text-body-md font-semibold text-on-surface">Popular in the library</p>
                <p className="text-label-sm text-on-surface-variant">Shared by IB students, free to everyone</p>
              </div>
            </div>
            <ul className="flex flex-col gap-xs">
              {featured.map((r) => (
                <li key={r.id}>
                  <Link href={`/resources/${r.id}`} className="group flex items-center gap-sm rounded-2xl bg-surface-container-low px-sm py-xs">
                    <span className="flex-1 min-w-0">
                      <span className="block text-body-md font-semibold text-on-surface truncate group-hover:text-primary">{r.title}</span>
                      <span className="block text-label-sm text-on-surface-variant">
                        {r.type_tag} · {r.subject_tag}
                      </span>
                    </span>
                    {r.download_count > 0 && <span className="text-label-sm text-on-surface-variant tabular-nums">{r.download_count} downloads</span>}
                    <span className="rounded-lg bg-primary text-on-primary px-sm py-px text-label-md font-semibold">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export function SundayReset() {
  return (
    <section className="px-md py-20">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-xl items-center">
        <div className={`${card} p-lg flex flex-col gap-md shadow-xl order-2 lg:order-1`}>
          <div className="flex items-center justify-between gap-sm">
            <p className="font-serif font-bold text-headline-md text-on-surface">Sunday Reset</p>
            <span className={sample}>Sample</span>
          </div>
          <div className="flex flex-col gap-sm">
            <div className="rounded-2xl bg-surface-container-low p-md">
              <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Last week</p>
              <p className="text-body-md text-on-surface">
                <span className="font-semibold">46 questions, 9 marks won back.</span> Most lost: simple harmonic motion, 7 of 15.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-md">
              <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">This week</p>
              <p className="text-body-md text-on-surface">Physics test Thursday · Economics IA draft Friday</p>
            </div>
            <div className="rounded-2xl bg-primary-fixed text-on-primary-fixed p-md flex flex-col gap-xs">
              <p className="text-label-sm font-bold uppercase tracking-wide">Three sessions that count</p>
              <p className="text-body-md">Mon 25 min · simple harmonic motion · Tue 20 min · price elasticity · Wed 30 min · integration</p>
              <span className="self-start rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold">Add all 3 to my Hub</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-md order-1 lg:order-2">
          <p className={eyebrow}>The weekly ritual</p>
          <h2 className={h2}>Ten minutes on Sunday. A calm week after it.</h2>
          <p className="text-body-lg text-on-surface-variant">
            Look back at last week and where the marks went, see what&apos;s coming, and put three short sessions where they&apos;ll count, each
            with a practice set ready on your Hub. Free, and your squad sees who&apos;s planned their week.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Squads() {
  const board = [
    { n: "Maya", pts: 142, ff: 41, reset: true },
    { n: "You", pts: 118, ff: 45, reset: true },
    { n: "Leo", pts: 87, ff: null, reset: false },
    { n: "Aarav", pts: 40, ff: 33, reset: true },
  ];
  return (
    <section className="px-md py-20 bg-surface-container-low">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-xl items-center">
        <div className="flex flex-col gap-md">
          <p className={eyebrow}>Squads</p>
          <h2 className={h2}>Revise with your friends, not just next to them.</h2>
          <p className="text-body-lg text-on-surface-variant">
            One code and up to 15 friends are in. Your squad gets a weekly board and a shared shelf. You see each other&apos;s practice points,
            marks won back, Forty-Five scores and who&apos;s planned their week. Never grades.
          </p>
          <ul className="grid sm:grid-cols-2 gap-sm text-body-md text-on-surface">
            <li className="flex gap-sm">
              <Trophy size={18} className="text-primary shrink-0 mt-px" aria-hidden="true" /> A board for this week and all time
            </li>
            <li className="flex gap-sm">
              <ListChecks size={18} className="text-primary shrink-0 mt-px" aria-hidden="true" /> Sets, test dates and plans in one tap
            </li>
            <li className="flex gap-sm">
              <Library size={18} className="text-primary shrink-0 mt-px" aria-hidden="true" /> Resources from the library
            </li>
            <li className="flex gap-sm">
              <FortyFiveMark /> <span>Forty-Five scores every day</span>
            </li>
          </ul>
        </div>
        <div className={`${card} p-lg flex flex-col gap-md shadow-xl`}>
          <div className="flex items-center justify-between gap-sm">
            <div>
              <p className="font-serif font-bold text-headline-md text-on-surface">The Paper 2 Survivors</p>
              <p className="text-label-md text-on-surface-variant">This week · code K7MPXR</p>
            </div>
            <span className={sample}>Sample</span>
          </div>
          <div className="grid grid-cols-[1.25rem_1fr_3rem_2.5rem_1.5rem] gap-sm px-sm text-label-sm text-on-surface-variant">
            <span />
            <span />
            <span className="text-right">Points</span>
            <span className="text-right">45</span>
            <span />
          </div>
          <ol className="flex flex-col gap-xs">
            {board.map((p, i) => (
              <li key={p.n} className={`grid grid-cols-[1.25rem_1fr_3rem_2.5rem_1.5rem] items-center gap-sm rounded-2xl px-sm py-xs ${p.n === "You" ? "bg-primary-fixed" : ""}`}>
                <span className="text-label-md font-bold text-on-surface-variant tabular-nums">{i + 1}</span>
                <span className="flex items-center gap-sm min-w-0">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-primary/80 text-on-primary flex items-center justify-center text-label-md font-bold">{p.n[0]}</span>
                  <span className="text-body-md font-semibold text-on-surface truncate">{p.n}</span>
                </span>
                <span className="text-right text-label-md font-bold tabular-nums text-on-surface">{p.pts}</span>
                <span className="text-right text-label-md tabular-nums text-on-surface">{p.ff ?? "–"}</span>
                <span className="flex justify-end">{p.reset && <CalendarDays size={16} className="text-primary" aria-label="Planned their week" />}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-surface-container-low p-sm flex items-center gap-sm text-label-md text-on-surface">
            <ListChecks size={16} className="text-primary" aria-hidden="true" />
            <span className="flex-1 min-w-0">
              <span className="font-semibold">Maya</span>{" "}put &ldquo;Organic mechanisms: 10 tricky ones&rdquo; on the shelf
            </span>
            <span className="rounded-lg bg-primary text-on-primary px-sm py-px font-semibold">Add</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProSection() {
  // Estimates, not measurements: keep them modest and labelled.
  const rows = [
    { task: "Planning your week", by: "30 min", pro: "1 tap" },
    { task: "Building a set on your weak topics", by: "10 min", pro: "20 sec" },
    { task: "Working out why you lost marks", by: "15 min", pro: "instant" },
    { task: "A full mocks timetable", by: "2 hours", pro: "2 min" },
  ];
  return (
    <section className="px-md py-20 bg-surface-container-low">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
        <div className="flex flex-col gap-md">
          <p className={eyebrow}>DiplomaPro · coming soon</p>
          <h2 className={h2}>The system is free. Pro will run it for you.</h2>
          <p className="text-body-lg text-on-surface-variant">
            DiplomaBro knows your subjects, your dates and every mark you&apos;ve lost. It plans your week, builds the sets, books the sessions
            and explains any question from its markscheme, so the time goes into studying, not organising it.
          </p>
          <div className="flex flex-wrap items-center gap-md">
            <div className="shrink-0 rounded-3xl bg-primary text-on-primary px-lg py-md">
              <p className="font-serif font-bold text-[3rem] leading-none tabular-nums whitespace-nowrap">~3&nbsp;h</p>
              <p className="text-label-md opacity-90 whitespace-nowrap">back every week</p>
            </div>
            <p className="flex-1 min-w-40 text-label-sm text-on-surface-variant">Estimate for a typical week with one test and a set most days.</p>
          </div>
          <WaitlistForm source="homepage" />
          <Link href="/pro" className="self-start text-label-lg font-semibold text-primary hover:underline">
            See everything in DiplomaPro →
          </Link>
        </div>
        <div className={`${card} p-lg flex flex-col gap-sm shadow-xl`}>
          <div className="flex items-center gap-sm pb-sm border-b border-outline-variant">
            <BroAvatar size={32} />
            <p className="flex-1 text-body-md font-semibold text-on-surface">What Bro takes off your plate</p>
            <span className={sample}>Estimates</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-lg gap-y-sm items-center">
            <span />
            <span className="text-label-sm text-on-surface-variant flex items-center gap-xs">
              <Clock size={12} aria-hidden="true" /> By hand
            </span>
            <span className="text-label-sm font-bold text-primary flex items-center gap-xs">
              <Sparkles size={12} aria-hidden="true" /> With Bro
            </span>
            {rows.map((r) => (
              <Fragment key={r.task}>
                <span className="text-body-md text-on-surface">{r.task}</span>
                <span className="text-body-md text-on-surface-variant line-through tabular-nums">{r.by}</span>
                <span className="text-body-md font-bold text-primary tabular-nums">{r.pro}</span>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-md py-24 text-center">
      <div className="max-w-180 mx-auto flex flex-col gap-lg items-center">
        <h2 className="font-serif font-bold text-on-surface text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05]">Run your IB like a system.</h2>
        <p className="text-body-lg text-on-surface-variant">Free for every subject. Takes a minute to set up.</p>
        <Link href="/signup" className="rounded-xl bg-primary text-on-primary px-xl py-md text-body-lg font-semibold hover:bg-primary/90">
          Start free
        </Link>
        <p className="text-label-sm text-on-surface-variant">Built by an IB student, for IB students.</p>
      </div>
    </section>
  );
}

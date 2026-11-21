import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Crosshair, Library, ListChecks, Sparkles, TrendingUp, Users } from "lucide-react";
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

// The signed-out homepage, led by practice: "Find your lost marks. Win them back." Everything here is
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
          <p className={eyebrow}>IB practice, marked like the markscheme</p>
          <h1 className="font-serif font-bold text-on-surface text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[1.02] tracking-tight">
            Find your lost marks.
            <br />
            <span className="text-primary">Win them back.</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-140 mx-auto lg:mx-0">
            IB-style questions marked like an examiner would. Add your tests to the Hub and practise the right topics before each one.
          </p>
          <div className="flex flex-wrap items-center gap-md justify-center lg:justify-start">
            <Link href="/signup" className="rounded-lg bg-primary text-on-primary px-lg py-sm text-body-lg font-semibold hover:bg-primary/90">
              Start practising free
            </Link>
            <a href="#try-it" className="text-body-md font-semibold text-primary hover:underline">
              or try 3 questions ↓
            </a>
          </div>
          <Link
            href="/forty-five"
            prefetch={false}
            className="self-center lg:self-start inline-flex items-center gap-sm rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md text-on-surface hover:border-primary"
          >
            <FortyFiveMark />
            <span>
              <span className="font-semibold">Forty-Five</span>{" "}· today&apos;s free IB puzzle →
            </span>
          </Link>
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
  const steps: { icon: ReactNode; name: string; body: string; link?: { href: string; label: string } }[] = [
    { icon: <CalendarDays size={20} />, name: "Plan", body: "Add your tests, mocks and IA deadlines to the Hub, with study sessions placed before each one." },
    { icon: <ListChecks size={20} />, name: "Practise", body: "Short sets on exactly the topics that test covers, not \"revise everything\". On screen or printed." },
    { icon: <Crosshair size={20} />, name: "Find", body: "Every marked set shows exactly where the marks went, and a strength map shows every topic." },
    {
      icon: <TrendingUp size={20} />,
      name: "Improve",
      body: "Log every test and mock, and watch each subject climb, with your grade and the boundaries beside it.",
      link: { href: "/progress", label: "See Progress" },
    },
  ];
  return (
    <section className="px-md py-20 bg-surface-container-low">
      <div className="max-w-[1300px] mx-auto flex flex-col gap-xl">
        <div className="text-center flex flex-col gap-sm">
          <p className={eyebrow}>How it works</p>
          <h2 className={h2}>Add a test. Practise before it. Watch the grade climb.</h2>
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
              {s.link && (
                <Link href={s.link.href} className="mt-auto self-start text-label-lg font-semibold text-primary hover:underline">
                  {s.link.label} →
                </Link>
              )}
            </li>
          ))}
        </ol>
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
          <h2 className={h2}>See where your marks go in 3 questions.</h2>
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
    <section className="px-md py-20">
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

/** Why come back next week: three habits, one line and one link each. */
export function StayOnTrack() {
  const items: { icon: ReactNode; iconBox?: string; name: string; body: string; href: string; cta: string }[] = [
    {
      icon: <span className="scale-[1.75]"><FortyFiveMark /></span>,
      iconBox: "bg-surface-container-high",
      name: "Forty-Five",
      body: "A free daily puzzle: 16 words from across the IB hide 4 groups of 4.",
      href: "/forty-five",
      cta: "Play today's puzzle",
    },
    {
      icon: <CalendarDays size={20} />,
      name: "Sunday Reset",
      body: "Ten minutes on Sunday: last week's lost marks, this week's dates, three sessions that count.",
      href: "/hub/reset",
      cta: "Plan your week",
    },
    {
      icon: <Users size={20} />,
      name: "Squads",
      body: "One code and your friends are in: a weekly board and a shared shelf. Never grades.",
      href: "/squads",
      cta: "Start a squad",
    },
  ];
  return (
    <section className="px-md py-20 bg-surface-container-low">
      <div className="max-w-[1300px] mx-auto flex flex-col gap-xl">
        <div className="text-center flex flex-col gap-sm">
          <p className={eyebrow}>Stay on track</p>
          <h2 className={h2}>Reasons to come back next week.</h2>
        </div>
        <ul className="grid md:grid-cols-3 gap-md">
          {items.map((x) => (
            <li key={x.name} className={`${card} p-lg flex flex-col gap-sm`}>
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${x.iconBox ?? "bg-primary text-on-primary"}`} aria-hidden="true">
                {x.icon}
              </span>
              <h3 className="font-serif font-bold text-headline-md text-on-surface">{x.name}</h3>
              <p className="text-body-md text-on-surface-variant flex-1">{x.body}</p>
              <Link href={x.href} prefetch={false} className="self-start text-label-lg font-semibold text-primary hover:underline">
                {x.cta} →
              </Link>
            </li>
          ))}
        </ul>
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
        <h2 className="font-serif font-bold text-on-surface text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05]">Your next test starts here.</h2>
        <p className="text-body-lg text-on-surface-variant">Free practice, a Hub for every subject, and a minute to set up.</p>
        <Link href="/signup" className="rounded-xl bg-primary text-on-primary px-xl py-md text-body-lg font-semibold hover:bg-primary/90">
          Start free
        </Link>
        <p className="text-label-sm text-on-surface-variant">Built by an IB student, for IB students.</p>
      </div>
    </section>
  );
}

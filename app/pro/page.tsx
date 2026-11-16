import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Brain, CalendarClock, Camera, FileText, ListChecks, Mic, MoonStar, Play, ScrollText, TrendingUp } from "lucide-react";
import { DiplomaBroMark } from "@/components/shared/bro/DiplomaBroIcon";
import { BroAvatar } from "@/components/shared/BroAvatar";
import { WaitlistForm } from "@/components/pro/WaitlistForm";
import { links } from "@/lib/practice/links";

export const metadata: Metadata = {
  title: "DiplomaPro",
  description:
    "DiplomaPro is coming soon: DiplomaBro on every page, help on the question in front of you, grounded in its markscheme, practice sets built for your weak spots and study plans around your tests. Join the waitlist.",
  alternates: { canonical: "/pro" },
};

// Static: no cookies or per-user data on the server (the form works out the
// sign-in on the client), like the signed-out homepage. Everything under
// "Ready on day one" is built; "After launch" is planned, not promised dates.

const READY = [
  {
    Icon: BookOpenCheck,
    title: "Help on the question in front of you",
    text: "Stuck mid-set? Bro sees the question, your working and its markscheme. Hints first, the full answer only when you ask, and a second, stronger model checks when it isn't sure.",
  },
  {
    Icon: ListChecks,
    title: "Practice built for you",
    text: "“10 integration questions, exam level.” Bro builds a real set from the topics you name, or your weakest ones, ready to start, print as a PDF or share with a friend.",
  },
  {
    Icon: CalendarClock,
    title: "Your weeks, planned",
    text: "Tell Bro your test dates and it puts study sessions on your Hub calendar, each one opening the right set. Whole mock timetables in one go.",
  },
  {
    Icon: Brain,
    title: "Remembers you",
    text: "What you find hard, how you like to study, what's coming up. You can see, edit or delete everything Bro remembers.",
  },
  {
    Icon: ScrollText,
    title: "A brief that knows your week",
    text: "Home and the Hub open with what to do first, written by Bro from your calendar, practice and results.",
  },
  {
    Icon: TrendingUp,
    title: "After every set",
    text: "Talk your results through with Bro, schedule a redo of the questions you missed, and tell it your test grades to track them on Progress.",
  },
];

const LATER = [
  { Icon: FileText, title: "Essay and IA feedback", text: "Feedback against the IB criteria, with the points that would move your mark." },
  { Icon: Camera, title: "Grade work from a photo", text: "Photograph a paper and confirm the marks Bro proposes." },
  { Icon: Mic, title: "Talk to Bro and practise orals", text: "Speak your questions, and run a practice oral with written feedback after." },
];

const FREE_NOW = [
  "Unlimited IB-style practice, marked point by point against the markscheme",
  "Print any set as a PDF, then mark your paper on screen with its code",
  "Strength maps, suggestions, and Progress with your grades and grade boundaries",
  "The Hub calendar, the resource library, Forty-Five and the leaderboard",
  "Share codes for sets and study plans, and every accent colour",
];

const bubble = "rounded-2xl px-md py-sm text-body-md max-w-[85%]";

/** A short, made-up exchange in the real chat style: what Bro does in one message. */
function SampleChat() {
  return (
    <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-md md:p-lg flex flex-col gap-sm" aria-label="Example conversation with DiplomaBro">
      <p className={`${bubble} self-end bg-primary text-on-primary`}>Chem test Thursday and I keep losing marks on rates 😬</p>
      <div className="flex items-start gap-sm">
        <BroAvatar size={28} className="shrink-0 mt-0.5" />
        <div className="flex flex-col gap-sm min-w-0 flex-1">
          <p className={`${bubble} bg-surface-container text-on-surface`}>
            Doable. Your last two sets lost most marks on rate expressions, not the graphs, so we start there. Here&apos;s 8 questions on exactly that:
          </p>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-sm flex items-center gap-sm max-w-[85%]">
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-semibold text-on-surface truncate">Chemistry · Rate expressions</p>
              <p className="text-label-sm text-on-surface-variant">8 questions · exam level · about 25 min</p>
            </div>
            <span className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-sm py-xs text-label-sm font-semibold">
              <Play size={12} aria-hidden="true" /> Start
            </span>
          </div>
          <p className={`${bubble} bg-surface-container text-on-surface`}>Want a 40-minute session on Tuesday and Wednesday evening before it?</p>
        </div>
      </div>
      <p className={`${bubble} self-end bg-primary text-on-primary`}>yes pls</p>
      <div className="flex items-start gap-sm">
        <BroAvatar size={28} className="shrink-0 mt-0.5" />
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-sm flex flex-col gap-xs max-w-[85%]">
          <p className="text-label-md font-semibold text-on-surface">Added to your Hub</p>
          <p className="text-label-sm text-on-surface-variant">Tue 18:00 · Rates practice (40 min)</p>
          <p className="text-label-sm text-on-surface-variant">Wed 18:00 · Rates practice, round 2 (40 min)</p>
        </div>
      </div>
    </div>
  );
}

function FeatureList({ items, muted = false }: { items: { Icon: typeof Brain; title: string; text: string }[]; muted?: boolean }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-md">
      {items.map(({ Icon, title, text }) => (
        <li key={title} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex gap-md">
          <span
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${muted ? "bg-surface-container text-on-surface-variant" : "bg-primary-fixed text-on-primary-fixed"}`}
            aria-hidden="true"
          >
            <Icon size={20} />
          </span>
          <div className="flex flex-col gap-xs">
            <h3 className="font-semibold text-on-surface">{title}</h3>
            <p className="text-body-md text-on-surface-variant">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ProPage() {
  return (
    <div className="max-w-[960px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl grid md:grid-cols-[1fr_auto] items-center gap-xl">
        <div className="flex flex-col gap-md">
          <span className="self-start inline-flex items-center gap-xs rounded-full bg-tertiary-container text-on-tertiary-container px-sm py-px text-label-sm font-bold uppercase tracking-wide">
            Coming soon
          </span>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">
            DiplomaPro
          </h1>
          <p className="text-headline-md font-serif text-on-surface">A study partner who knows the syllabus, your test dates and every mark you&apos;ve lost.</p>
          <p className="text-body-lg text-on-surface-variant max-w-140">
            Practice stays free. DiplomaPro adds DiplomaBro on every page: it helps with the question in front of you, builds practice from your weak spots and plans
            your weeks around your tests. Join the waitlist and we&apos;ll email you the day it opens.
          </p>
          <WaitlistForm />
        </div>
        <div className="order-first md:order-last justify-self-center md:justify-self-end" aria-hidden="true">
          <div className="md:hidden">
            <DiplomaBroMark size={96} state="idle" />
          </div>
          <div className="hidden md:block">
            <DiplomaBroMark size={176} state="idle" />
          </div>
        </div>
      </header>

      <section className="grid md:grid-cols-[1fr_1.1fr] gap-lg items-center" aria-labelledby="sample-heading">
        <div className="flex flex-col gap-sm">
          <h2 id="sample-heading" className="font-serif font-bold text-headline-md text-on-surface">
            One message, and it&apos;s handled
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Bro already knows your subjects, your calendar and how your practice went. So &ldquo;help, test on Thursday&rdquo; turns into the right questions and time to do
            them, not a lecture.
          </p>
        </div>
        <SampleChat />
      </section>

      <section className="flex flex-col gap-md" aria-labelledby="ready-heading">
        <div className="flex flex-col gap-xs">
          <h2 id="ready-heading" className="font-serif font-bold text-headline-md text-on-surface">
            Ready on day one
          </h2>
          <p className="text-body-md text-on-surface-variant">Built and being tested now. Bro works from each question&apos;s markscheme, gives hints before answers, and won&apos;t just do your work for you.</p>
        </div>
        <FeatureList items={READY} />
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex gap-md">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
            <MoonStar size={20} />
          </span>
          <div className="flex flex-col gap-xs">
            <h3 className="font-semibold text-on-surface">Midnight and backgrounds</h3>
            <p className="text-body-md text-on-surface-variant">
              The deep-navy Midnight theme, and the Dawn, Aurora and Dusk backgrounds. Free to try until launch, from the palette in the menu bar.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-md" aria-labelledby="later-heading">
        <div className="flex flex-col gap-xs">
          <h2 id="later-heading" className="font-serif font-bold text-headline-md text-on-surface">
            Coming after launch
          </h2>
          <p className="text-body-md text-on-surface-variant">Planned for DiplomaPro, included when they&apos;re ready.</p>
        </div>
        <FeatureList items={LATER} muted />
      </section>

      <section className="rounded-2xl bg-surface-container-low p-lg flex flex-col gap-sm" aria-labelledby="free-heading">
        <h2 id="free-heading" className="font-serif font-bold text-headline-md text-on-surface">
          Free, before and after launch
        </h2>
        <ul className="list-disc pl-lg text-body-md text-on-surface-variant flex flex-col gap-xs">
          {FREE_NOW.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Link href={links.practice()} className="self-start text-label-md font-semibold text-primary hover:underline">
          Start practising
        </Link>
      </section>
    </div>
  );
}

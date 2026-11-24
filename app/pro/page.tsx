import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Brain, CalendarClock, Camera, FileText, ListChecks, Mic, MoonStar, Play, ScrollText, TrendingUp } from "lucide-react";
import { DiplomaBroMark } from "@/components/shared/bro/DiplomaBroIcon";
import { BroAvatar } from "@/components/shared/BroAvatar";
import { WaitlistForm } from "@/components/pro/WaitlistForm";
import { links } from "@/lib/practice/links";
import { DAILY_CAPS } from "@/lib/plans";
import { REVIEWS_PER_MONTH } from "@/lib/review/labels";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getBroConversations, getProStatus } from "@/lib/data";
import { getTodayUsage } from "@/lib/data/supabase/usage";
import { getReviewAllowance, getReviewProjects } from "@/lib/data/supabase/reviews";
import { ProHub } from "@/components/pro/ProHub";
import { LaunchCounter } from "@/components/pro/LaunchCounter";
import { getCampaignJoined } from "@/lib/data/supabase/campaign";

export const metadata: Metadata = {
  title: "DiplomaPro",
  description:
    "DiplomaPro launches on 1 December: DiplomaBro on every page, IA, EE and TOK drafts reviewed against the official criteria, and a launch price that drops the more students join. Join the list.",
  alternates: { canonical: "/pro" },
};

// Students with DiplomaPro get the Pro hub (Bro, reviews, limits, plan; the
// menu's "Pro" item). Everyone else gets this page: the form works out the
// sign-in on the client. Everything under "Ready on day one" is built;
// "After launch" is planned, not promised dates.

const READY = [
  {
    Icon: FileText,
    title: "IA, EE and TOK reviews",
    text: "Upload a draft and Bro marks it against the official IB criteria like a moderator would, with comments pinned to your pages and your marks tracked from draft to draft. 6 reviews a month.",
  },
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

/** Bro on a practice question: the question is attached, hints first, then it checks the student's own working. */
function SampleQuestionChat() {
  return (
    <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-md md:p-lg flex flex-col gap-sm" aria-label="Example: DiplomaBro helping with a practice question">
      <div className="self-end max-w-[85%] rounded-xl border border-outline-variant bg-surface-container-low p-sm flex flex-col gap-0.5">
        <p className="text-label-sm font-semibold text-on-surface-variant">Maths AA · Question 4 · 6 marks</p>
        <p className="text-body-md text-on-surface">Find the coordinates of the stationary point of y = x·e⁻ˣ and show that it is a maximum.</p>
      </div>
      <p className={`${bubble} self-end bg-primary text-on-primary`}>I don&apos;t get how to start this one</p>
      <div className="flex items-start gap-sm">
        <BroAvatar size={28} className="shrink-0 mt-0.5" />
        <div className="flex flex-col gap-sm min-w-0 flex-1">
          <p className={`${bubble} bg-surface-container text-on-surface`}>
            Stationary point means dy/dx = 0. y is a product, x times e⁻ˣ, so which rule do you need first? Try differentiating and send me what you get.
          </p>
        </div>
      </div>
      <p className={`${bubble} self-end bg-primary text-on-primary`}>product rule? dy/dx = e⁻ˣ − x·e⁻ˣ so x = 1</p>
      <div className="flex items-start gap-sm">
        <BroAvatar size={28} className="shrink-0 mt-0.5" />
        <p className={`${bubble} bg-surface-container text-on-surface`}>
          Exactly, that&apos;s your first two marks. Now the y-coordinate, and for &ldquo;show it&apos;s a maximum&rdquo; the markscheme wants the second derivative (or a sign
          change) with a clear conclusion. What&apos;s d²y/dx² at x = 1?
        </p>
      </div>
    </div>
  );
}

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

export default async function ProPage() {
  const uid = await getCurrentUserId();
  const joinedReady = getCampaignJoined().catch(() => 0);
  if (uid) {
    const status = await getProStatus().catch(() => null);
    if (status?.isPro) {
      const [usage, allowance, projects, chats] = await Promise.all([
        getTodayUsage(),
        getReviewAllowance().catch(() => null), // null until the reviews migration has run
        getReviewProjects().catch(() => null),
        getBroConversations(3).catch(() => []),
      ]);
      return <ProHub status={status} usage={usage} allowance={allowance} projects={projects} chats={chats} />;
    }
  }
  const joined = await joinedReady;
  return (
    <div className="max-w-[960px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl grid md:grid-cols-[1fr_auto] items-center gap-xl">
        <div className="flex flex-col gap-md">
          <span className="self-start inline-flex items-center gap-xs rounded-full bg-tertiary-container text-on-tertiary-container px-sm py-px text-label-sm font-bold uppercase tracking-wide">
            Launching 1 December
          </span>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">
            DiplomaPro
          </h1>
          <p className="text-headline-md font-serif text-on-surface">A study partner who knows your syllabus and your tests, and an examiner for your coursework.</p>
          <p className="text-body-lg text-on-surface-variant max-w-140">
            Practice stays free. DiplomaPro adds DiplomaBro on every page, which helps with the question in front of you and plans your weeks around your tests, and
            reviews of your IA, EE and TOK drafts against the official IB criteria. Join the list to be first in on launch day and help bring the launch price down.
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

      <section className="grid md:grid-cols-[1.1fr_1fr] gap-lg items-center" aria-labelledby="question-heading">
        <SampleQuestionChat />
        <div className="flex flex-col gap-sm order-first md:order-last">
          <h2 id="question-heading" className="font-serif font-bold text-headline-md text-on-surface">
            Stuck on a question? Hints first
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Tap Ask Bro in the middle of a set and it sees the question, your working and the markscheme. It nudges you to the next step instead of handing over the answer,
            and tells you which marks your working has already earned.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-md" aria-labelledby="ready-heading">
        <div className="flex flex-col gap-xs">
          <h2 id="ready-heading" className="font-serif font-bold text-headline-md text-on-surface">
            Ready on day one
          </h2>
          <p className="text-body-md text-on-surface-variant">Built and in testing now. Bro works from the markscheme and the official criteria, gives hints before answers, and never writes your work for you.</p>
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

      <LaunchCounter initial={joined} />

      <section className="flex flex-col gap-md" aria-labelledby="limits-heading">
        <div className="flex flex-col gap-xs">
          <h2 id="limits-heading" className="font-serif font-bold text-headline-md text-on-surface">
            What you get
          </h2>
          <p className="text-body-md text-on-surface-variant">Generous enough for real use. Practice from the question bank never has a limit, with or without Pro.</p>
        </div>
        <ul className="grid gap-md sm:grid-cols-2">
          <Limit value={`${DAILY_CAPS.bro_message.pro}`} unit="Bro messages a day" />
          <Limit value={`${REVIEWS_PER_MONTH}`} unit="coursework reviews a month (any mix of IA, EE and TOK)" />
        </ul>
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

function Limit({ value, unit }: { value: string; unit: string }) {
  return (
    <li className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-xs">
      <span className="font-serif font-bold text-display-lg text-primary tabular-nums leading-none">{value}</span>
      <span className="text-body-md text-on-surface-variant">{unit}</span>
    </li>
  );
}

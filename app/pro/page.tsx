import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Camera, CalendarClock, FileText, MessageCircle, Sparkles, Wand2 } from "lucide-react";
import { DiplomaBroMark } from "@/components/shared/bro/DiplomaBroIcon";
import { WaitlistForm } from "@/components/pro/WaitlistForm";
import { links } from "@/lib/practice/links";

export const metadata: Metadata = {
  title: "DiplomaPro",
  description: "DiplomaPro is coming soon: DiplomaBro explanations, essay feedback, photo marking and study plans. Join the waitlist.",
  alternates: { canonical: "/pro" },
};

// Static: no cookies or per-user data on the server (the form works out the
// sign-in on the client), like the signed-out homepage.
const COMING = [
  { Icon: MessageCircle, title: "DiplomaBro", text: "Ask Bro anything about a question, a topic or your next test." },
  { Icon: BookOpenCheck, title: "Explanations and answer checks", text: "See why a mark was lost, and have your working checked." },
  { Icon: FileText, title: "Essay feedback", text: "Feedback against the IB criteria, with the points that matter most." },
  { Icon: Camera, title: "Grade your own work", text: "Photograph a paper you did and confirm the marks Bro proposes." },
  { Icon: Wand2, title: "Auto sets and Generate more", text: "Sets built around your weak spots, and fresh questions on demand." },
  { Icon: CalendarClock, title: "Study plans", text: "Practice sessions placed in your calendar before each test." },
];

const FREE_NOW = [
  "Practice questions with mark schemes, for Maths AA and Physics, with more subjects on the way",
  "Strength maps, suggestions and your countdowns",
  "The Hub, the resource library and the leaderboard",
  "The Midnight theme",
];

export default function ProPage() {
  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl grid md:grid-cols-[1fr_auto] items-center gap-xl">
        <div className="flex flex-col gap-md">
          <span className="self-start inline-flex items-center gap-xs rounded-full bg-tertiary-container text-on-tertiary-container px-sm py-px text-label-sm font-bold uppercase tracking-wide">
            <Sparkles size={12} aria-hidden="true" /> Coming soon
          </span>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">DiplomaPro</h1>
          <p className="text-body-lg text-on-surface-variant max-w-140">
            The next step after practice: help that understands your subjects and your test dates. Join the waitlist and we&apos;ll tell you the day it opens.
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

      <section className="flex flex-col gap-md" aria-labelledby="coming-heading">
        <h2 id="coming-heading" className="font-serif font-bold text-headline-md text-on-surface">
          What&apos;s coming
        </h2>
        <ul className="grid sm:grid-cols-2 gap-md">
          {COMING.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex gap-md">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
                <Icon size={20} />
              </span>
              <div className="flex flex-col gap-xs">
                <h3 className="font-semibold text-on-surface">{title}</h3>
                <p className="text-body-md text-on-surface-variant">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-surface-container-low p-lg flex flex-col gap-sm" aria-labelledby="free-heading">
        <h2 id="free-heading" className="font-serif font-bold text-headline-md text-on-surface">
          Free today
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

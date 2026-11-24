import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { type BankFile, type DbPrompt, toPayload } from "@/lib/deadline/bank";
import type { DeadlineAnalytics, ReportedMessage, ReviewPrompt } from "@/app/lib/admin-deadline-stats";
import { DeadlineEditor } from "@/components/admin/DeadlineEditor";
import { DeadlineBank } from "@/components/admin/DeadlineBank";
import { DeadlineAnalyticsView } from "@/components/admin/DeadlineAnalyticsView";
import { DeadlineReview } from "@/components/admin/DeadlineReview";
import { DeadlineReports } from "@/components/admin/DeadlineReports";

export const metadata: Metadata = { title: "Deadline admin (demo)", robots: { index: false } };

type Props = { searchParams: Promise<{ view?: string }> };
const VIEWS = ["prompts", "analytics", "review", "reports"] as const;

// Dev-only: Admin → Deadline without sign-in. Prompts come from content/deadline;
// analytics, missing answers and reports are made up. Buttons call the real
// actions, so they fail here ("Not authorised"). Not served in production.
export default async function DeadlineAdminDemo({ searchParams }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const v = (await searchParams).view;
  const view = (VIEWS as readonly string[]).includes(v ?? "") ? (v as (typeof VIEWS)[number]) : "prompts";
  // eslint-disable-next-line react-hooks/purity -- dev demo, rendered once
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

  return (
    <div className="max-w-[1400px] mx-auto px-md py-lg flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h1 className="font-serif font-bold text-headline-lg text-on-surface">Deadline admin (demo)</h1>
        <nav className="inline-flex rounded-full border border-outline-variant p-0.5">
          {VIEWS.map((x) => (
            <Link key={x} href={`/dev/deadline-admin?view=${x}`} aria-current={x === view ? "page" : undefined}
              className={`rounded-full px-md py-1 text-label-md font-semibold ${x === view ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}>{x}</Link>
          ))}
        </nav>
      </div>
      {view === "prompts" && <Prompts />}
      {view === "analytics" && <DeadlineAnalyticsView data={analytics(iso)} range={30} />}
      {view === "review" && <DeadlineReview prompts={review(iso)} />}
      {view === "reports" && <DeadlineReports reports={reports(iso)} />}
    </div>
  );
}

function Prompts() {
  const dir = path.join(process.cwd(), "content/deadline");
  const files: BankFile[] = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
      .map((f) => ({ file: f, prompts: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }))
    : [];
  const bank: DbPrompt[] = toPayload(files).map((p) => ({ ...p, active: true }));
  return (<><DeadlineEditor initial={bank} /><DeadlineBank /></>);
}

function analytics(iso: (m: number) => string): DeadlineAnalytics {
  const perDay = Array.from({ length: 30 }, (_, i) => ({ date: iso((29 - i) * 1440).slice(0, 10), count: Math.max(0, Math.round(3 + 2.5 * Math.sin(i / 3) + i / 4)) }));
  return {
    games: { started: 187, finished: 171, abandoned: 16, players: 64, avgPlayers: 4.3, avgMinutes: 7.8, overtimePct: 4, playAgainPct: 58, squadPct: 31, messagesPerGame: 11.2, reactionsPerGame: 23.5 },
    perDay,
    sizes: [2, 3, 4, 5, 6, 7, 8].map((n) => ({ label: `${n} players`, count: [31, 44, 52, 33, 15, 8, 4][n - 2] })),
    funnel: [{ label: "Opened Deadline", count: 412 }, { label: "Rooms created", count: 133 }, { label: "Invites copied", count: 120 }, { label: "Joined a room", count: 498 }, { label: "Games started", count: 187 }, { label: "Games finished", count: 171 }, { label: "Saved as a squad", count: 9 }],
    joinsVia: [{ label: "Invite link", count: 301 }, { label: "Typed the code", count: 142 }, { label: "From a squad", count: 55 }],
    endReasons: [{ label: "Back to the player who failed", count: 610 }, { label: "Second fail", count: 402 }, { label: "Cleared (3 circles, no fail)", count: 233 }, { label: "Game ended", count: 171 }, { label: "Every answer used", count: 18 }],
    matchedBy: [{ label: "Exact", count: 5120 }, { label: "Typo", count: 731 }, { label: "Sounds like", count: 66 }, { label: "First word", count: 41 }],
    points: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ label: `+${n}`, count: [1900, 1400, 1100, 760, 450, 230, 118][n - 1] })),
    answers: { total: 5958, avgSeconds: 5.6, rejects: 2210, appealed: 74 },
    prompts: [
      { slug: "demo-ice-cream", text: "Name an ice cream flavour", rounds: 41, avgAnswers: 6.6, exhausted: 19, cleared: 3 },
      { slug: "demo-fruit", text: "Name a fruit", rounds: 38, avgAnswers: 7.1, exhausted: 0, cleared: 12 },
      { slug: "demo-board-game", text: "Name a board game", rounds: 30, avgAnswers: 4.2, exhausted: 0, cleared: 2 },
    ],
  };
}

function review(iso: (m: number) => string): ReviewPrompt[] {
  // Made-up prompts, not the IB bank (content/ stays private).
  return [
    {
      slug: "demo-fruit", text: "Name a fruit", active: true,
      answers: ["Apple", "Banana", "Durian", "Kiwi", "Lychee", "Mango", "Orange"],
      missing: [
        { norm: "dragon fruit", raw: "dragon fruit", count: 6, players: 5, appealed: 3, reasons: ["wrong"], lastAt: iso(40), closest: ["Durian", "Orange", "Mango"] },
        { norm: "jackfruit", raw: "Jackfruit", count: 3, players: 3, appealed: 0, reasons: ["wrong"], lastAt: iso(300), closest: ["Kiwi", "Apple", "Mango"] },
        { norm: "fruit", raw: "fruit", count: 2, players: 2, appealed: 0, reasons: ["wrong"], lastAt: iso(2000), closest: ["Kiwi", "Apple", "Mango"] },
      ],
      typos: [{ raw: "mangoe", key: "mangoe", answer: "Mango", matchedBy: "typo", count: 4, lastAt: iso(90) }],
    },
    {
      slug: "demo-board-game", text: "Name a board game", active: true,
      answers: ["Catan", "Chess", "Cluedo", "Monopoly", "Risk", "Scrabble"],
      missing: [{ norm: "settlers of catan", raw: "settlers of catan", count: 4, players: 4, appealed: 1, reasons: ["wrong"], lastAt: iso(15), closest: ["Catan", "Chess", "Risk"] }],
      typos: [{ raw: "monopolly", key: "monopolly", answer: "Monopoly", matchedBy: "typo", count: 2, lastAt: iso(600) }],
    },
  ];
}

function reports(iso: (m: number) => string): ReportedMessage[] {
  return [
    { messageId: "r1", body: "this game is rigged lol, ur all bots", author: { id: "u1", name: "Leo", reportsTotal: 1 }, reporters: ["Maya"], reasons: [], firstAt: iso(25), hidden: false },
    { messageId: "r2", body: "[something rude]", author: { id: "u2", name: "Sam", reportsTotal: 3 }, reporters: ["Ana", "Ben", "Cai"], reasons: ["rude"], firstAt: iso(200), hidden: true },
    { messageId: "r3", body: "message from yesterday", author: { id: "u3", name: "Jo", reportsTotal: 1 }, reporters: ["Eli"], reasons: [], firstAt: iso(2000), hidden: null },
  ];
}

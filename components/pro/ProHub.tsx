import Link from "next/link";
import { Brain, CalendarClock, ChevronRight, FileCheck2, MessageCircle, MoonStar, Palette, Plus, ScrollText } from "lucide-react";
import { BroAvatar } from "@/components/shared/BroAvatar";
import type { BroConversation, ProStatus } from "@/lib/data";
import type { ReviewAllowance, ReviewProject } from "@/lib/data/supabase/reviews";
import { DAILY_CAPS, type UsageMetric } from "@/lib/plans";
import { KIND_LABELS } from "@/lib/review/labels";

// /pro for students who have DiplomaPro: one place for Bro, coursework
// reviews, today's limits and the plan. Everyone else gets the DiplomaPro page.

const PLAN_LABEL: Record<NonNullable<ProStatus["plan"]>, string> = {
  beta: "Beta",
  trial: "Trial",
  monthly: "Monthly",
  one_year: "One year",
  two_year: "Two years",
  unlimited: "Unlimited",
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function ProHub({
  status,
  usage,
  allowance,
  projects,
  chats,
}: {
  status: ProStatus;
  usage: Record<UsageMetric, number>;
  allowance: ReviewAllowance | null;
  projects: ReviewProject[] | null;
  chats: BroConversation[];
}) {
  const unlimited = status.plan === "unlimited";
  const cap = (m: UsageMetric) => (unlimited ? null : DAILY_CAPS[m].pro);

  return (
    <div className="max-w-[1100px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">DiplomaPro</h1>
        <p className="text-body-lg text-on-surface-variant">
          {status.plan ? `${PLAN_LABEL[status.plan]} plan` : "Pro"}
          {status.expiresAt ? ` · until ${fmtDate(status.expiresAt)}` : unlimited ? " · no end date" : ""}
        </p>
      </header>

      <div className="grid gap-md lg:grid-cols-2">
        {/* Bro */}
        <section className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="hub-bro">
          <div className="flex items-center gap-md">
            <BroAvatar size={44} />
            <div className="flex-1 min-w-0">
              <h2 id="hub-bro" className="font-serif font-bold text-headline-md text-on-surface">DiplomaBro</h2>
              <p className="text-label-md text-on-surface-variant">Your study partner, on every page.</p>
            </div>
          </div>
          {chats.length > 0 && (
            <ul className="flex flex-col">
              {chats.map((c) => (
                <li key={c.id}>
                  <Link href={`/bro?c=${c.id}`} className="flex items-center gap-sm rounded-lg px-sm py-xs hover:bg-surface-container-low">
                    <MessageCircle size={14} className="text-on-surface-variant shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-0 truncate text-body-md text-on-surface">{c.title || "Chat"}</span>
                    <span className="text-label-sm text-on-surface-variant shrink-0">{fmtDate(c.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex flex-wrap gap-sm">
            <Link href="/bro" className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:opacity-90">
              <MessageCircle size={16} aria-hidden="true" /> Open Bro
            </Link>
            <Link href="/bro/memory" className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary">
              <Brain size={16} aria-hidden="true" /> What Bro remembers
            </Link>
          </div>
        </section>

        {/* Coursework review */}
        <section className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="hub-review">
          <div className="flex items-center gap-md">
            <span className="w-11 h-11 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0" aria-hidden="true">
              <FileCheck2 size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <h2 id="hub-review" className="font-serif font-bold text-headline-md text-on-surface">Coursework review</h2>
              <p className="text-label-md text-on-surface-variant">IA, EE and TOK drafts, marked against the official criteria.</p>
            </div>
          </div>
          {projects && projects.length > 0 ? (
            <ul className="flex flex-col">
              {projects.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/review/${p.id}`} className="flex items-center gap-sm rounded-lg px-sm py-xs hover:bg-surface-container-low">
                    <span className="flex-1 min-w-0 truncate text-body-md text-on-surface">{p.title}</span>
                    <span className="text-label-sm text-on-surface-variant shrink-0">
                      {KIND_LABELS[p.kind]} · {p.drafts.length} draft{p.drafts.length === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-md text-on-surface-variant">Start a project for each piece of coursework and upload drafts as you go. Your marks are tracked draft to draft.</p>
          )}
          <div className="mt-auto flex flex-wrap gap-sm">
            <Link href="/review/new" className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:opacity-90">
              <Plus size={16} aria-hidden="true" /> New project
            </Link>
            <Link href="/review" className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary">
              All projects <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      {/* Limits */}
      <section className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="hub-limits">
        <div className="flex flex-col gap-xs">
          <h2 id="hub-limits" className="font-serif font-bold text-headline-md text-on-surface">Your limits</h2>
          <p className="text-label-md text-on-surface-variant">Practice from the question bank never has a limit.</p>
        </div>
        <div className="grid gap-md sm:grid-cols-2">
          <Meter label="Bro messages" used={usage.bro_message} cap={cap("bro_message")} resets="Today. Resets every day at midnight UTC." />
          <Meter
            label="Coursework reviews"
            used={allowance?.used ?? 0}
            cap={allowance ? allowance.cap : 6}
            resets={allowance ? `This month. Resets ${fmtDate(allowance.resetsAt)}.` : "This month."}
          />
        </div>
      </section>

      {/* The rest */}
      <section className="flex flex-col gap-sm" aria-labelledby="hub-more">
        <h2 id="hub-more" className="font-serif font-bold text-headline-md text-on-surface">Also with Pro</h2>
        <ul className="grid gap-sm sm:grid-cols-2">
          <Perk Icon={ScrollText} title="Bro's brief" text="Home and the Hub open with what to do first, written from your week." />
          <Perk Icon={CalendarClock} title="Schedule sets" text="Put a practice set on your Hub calendar from Build your set." />
          <Perk Icon={MoonStar} title="Midnight theme" text="In the theme picker in the menu bar." />
          <Perk Icon={Palette} title="Backgrounds" text="In the palette next to the theme picker." />
        </ul>
      </section>
    </div>
  );
}

function Meter({ label, used, cap, resets }: { label: string; used: number; cap: number | null; resets: string }) {
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div className="rounded-2xl bg-surface-container-low p-md flex flex-col gap-xs">
      <p className="text-label-md font-semibold text-on-surface">{label}</p>
      <p className="font-serif font-bold text-headline-md text-on-surface tabular-nums leading-none">
        {cap === null ? (
          "No limit"
        ) : (
          <>
            {Math.max(0, cap - used)} <span className="text-body-md text-on-surface-variant">of {cap} left</span>
          </>
        )}
      </p>
      {cap !== null && (
        <div className="h-1.5 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-error" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-label-sm text-on-surface-variant">{resets}</p>
    </div>
  );
}

function Perk({ Icon, title, text }: { Icon: typeof Brain; title: string; text: string }) {
  return (
    <li className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-md flex gap-sm">
      <Icon size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex flex-col">
        <span className="text-body-md font-semibold text-on-surface">{title}</span>
        <span className="text-label-md text-on-surface-variant">{text}</span>
      </span>
    </li>
  );
}

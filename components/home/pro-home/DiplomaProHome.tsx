import Link from "next/link";
import { CalendarDays, Dumbbell } from "lucide-react";
import type { HubItem } from "@/components/hub/mock-data";
import { getBroBrief, getDoneWeeks, getMySquads, getExamSession, getGettingStarted, getMyStanding, getNextTimedItem, getPendingHints, getSharingStats, getStrengthMaps, getSuggestions, getViewer } from "@/lib/data";
import { links } from "@/lib/practice/links";
import { Greeting } from "@/components/shared/Greeting";
import { Countdown } from "@/components/shared/Countdown";
import { SuggestionCard } from "@/components/shared/SuggestionCard";
import { suggestionGridCols } from "@/components/shared/suggestion-grid";
import { StrengthCarousel } from "@/components/shared/strength/StrengthCarousel";
import { BroButton } from "@/components/shared/bro/BroButton";
import DashboardNextDays from "@/components/home/dashboard-next-days";
import DashboardResources from "@/components/home/dashboard-resources";
import { GettingStartedCard } from "./GettingStartedCard";
import { ResetBanner } from "@/components/reset/ResetBanner";
import { SquadsCard } from "./SquadsCard";
import { DeadlineCard } from "./DeadlineCard";
import { RankCard } from "@/components/leaderboard/RankCard";
import { MidnightPromo } from "./MidnightPromo";
import { CodesCard } from "./CodesCard";
import { HomeNudge } from "./HomeNudge";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

/**
 * The DiplomaPro Home: what's coming and what to do about it, top to bottom.
 * "Next 3 days" and "Resources" are the existing dashboard sections, fed
 * the same data as before; everything else reads from lib/data.
 */
/**
 * Home's own data. SignedInHome starts this together with its own queries
 * and passes the promise down, so the two batches run at once rather than
 * one after the other.
 */
export function loadDiplomaProHome() {
  return Promise.all([
    getViewer(),
    getExamSession(),
    getNextTimedItem(),
    getSuggestions("home"),
    getStrengthMaps(),
    getGettingStarted(),
    getPendingHints(),
    getMyStanding("week").catch(() => null), // null until the leaderboard migration runs
    getSharingStats(), // null until migration 33 runs
    getBroBrief().catch(() => null), // Pro: Bro's line under the greeting (cached)
    getDoneWeeks(), // Sunday Reset: weeks already planned (none before migration 50)
    getMySquads(), // [] before migration 52
  ]);
}

export async function DiplomaProHome({
  nextDaysItems,
  hubSubjects,
  data,
}: {
  nextDaysItems: HubItem[];
  hubSubjects: string[] | null;
  data: ReturnType<typeof loadDiplomaProHome>;
}) {
  const [viewer, session, nextItem, suggestions, maps, gettingStarted, hints, standing, sharing, brief, doneWeeks, squads] = await data;
  const moreSuggestions = suggestions[0]?.headline ? suggestions.slice(1) : suggestions;

  return (
    <div className="dh-page-bg bg-surface-container-low">
      <div className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
        {/* 1. Greeting (with the top suggestion in a line) + countdown */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-lg">
          <div className="min-w-0">
            <Greeting firstName={viewer.firstName} />
            <HomeNudge suggestion={suggestions[0]} broLine={brief?.nudge ?? null} />
          </div>
          <Countdown nextItem={nextItem} session={session} />
        </header>

        {/* 2. Suggestions + the two ways in */}
        <section className="grid md:grid-cols-[1fr_auto] gap-md items-stretch" aria-label="Suggestions">
          {/* The first suggestion is the line under the greeting; the cards are the next ones. */}
          <div className={`grid gap-md items-stretch ${suggestionGridCols(moreSuggestions.length)}`}>
            {moreSuggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
          <div className="flex md:flex-col gap-sm md:w-48">
            <Link
              href={links.practice()}
              className="flex-1 inline-flex items-center justify-center gap-sm rounded-2xl bg-primary text-on-primary px-lg py-md font-semibold hover:bg-primary/90"
            >
              <Dumbbell size={18} aria-hidden="true" /> Practice
            </Link>
            <Link
              href={links.hub()}
              prefetch={false}
              className="flex-1 inline-flex items-center justify-center gap-sm rounded-2xl border-2 border-primary text-primary px-lg py-md font-semibold hover:bg-primary-fixed"
            >
              <CalendarDays size={18} aria-hidden="true" /> Hub
            </Link>
          </div>
        </section>

        <ResetBanner doneWeeks={doneWeeks} />

        <GettingStartedCard progress={gettingStarted} />

        {standing && <RankCard standing={standing} />}

        <SquadsCard squads={squads} />

        <DeadlineCard />

        <CodesCard stats={sharing} />

        <MidnightPromo isPro={viewer.isPro} />

        {/* 3. Next 3 days (existing) */}
        <DashboardNextDays items={nextDaysItems} />

        {/* 4. Strength maps */}
        <StrengthCarousel maps={maps} hintPending={hints.includes("strength-map")} />
      </div>

      {/* 5. Resources (existing) */}
      <div className="bg-surface-container-lowest px-md py-xl">
        <div className="max-w-[1200px] mx-auto w-full">
          <DashboardResources hubSubjects={hubSubjects} />
        </div>
      </div>

      <BroButton isPro={viewer.isPro} hintPending={hints.includes("bro-button")} />
      <OnboardingGate />
    </div>
  );
}

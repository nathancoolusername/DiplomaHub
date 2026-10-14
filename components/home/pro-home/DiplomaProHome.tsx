import Link from "next/link";
import { CalendarDays, Dumbbell } from "lucide-react";
import type { HubItem } from "@/components/hub/mock-data";
import { getExamSession, getGettingStarted, getMyStanding, getNextTimedItem, getPendingHints, getStrengthMaps, getSuggestions, getViewer } from "@/lib/data";
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
import { RankCard } from "@/components/leaderboard/RankCard";
import { MidnightPromo } from "./MidnightPromo";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

/**
 * The DiplomaPro Home: what's coming and what to do about it, top to bottom.
 * "Next 3 days" and "Resources" are the existing dashboard sections, fed
 * the same data as before; everything else reads from lib/data.
 */
export async function DiplomaProHome({ nextDaysItems, hubSubjects }: { nextDaysItems: HubItem[]; hubSubjects: string[] | null }) {
  const [viewer, session, nextItem, suggestions, maps, gettingStarted, hints, standing] = await Promise.all([
    getViewer(),
    getExamSession(),
    getNextTimedItem(),
    getSuggestions("home"),
    getStrengthMaps(),
    getGettingStarted(),
    getPendingHints(),
    getMyStanding("week").catch(() => null), // null until the leaderboard migration runs
  ]);

  return (
    <div className="bg-surface-container-low">
      <div className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
        {/* 1. Greeting + countdown */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-lg">
          <Greeting firstName={viewer.firstName} />
          <Countdown nextItem={nextItem} session={session} />
        </header>

        {/* 2. Suggestions + the two ways in */}
        <section className="grid md:grid-cols-[1fr_auto] gap-md items-stretch" aria-label="Suggestions">
          <div className={`grid gap-md items-stretch ${suggestionGridCols(suggestions.length)}`}>
            {suggestions.map((s) => (
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

        <GettingStartedCard progress={gettingStarted} />

        {standing && <RankCard standing={standing} />}

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

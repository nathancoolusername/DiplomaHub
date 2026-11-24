import { getFortyFiveAdminData } from "@/app/lib/actions/admin-forty-five";
import { FortyFiveReview, ScheduleButton } from "@/components/admin/FortyFiveReview";
import { FortyFiveTabs } from "@/components/admin/FortyFiveTabs";
import { PageHeader, StatCard, StatGrid, StatsError } from "@/components/admin/ui";

// Admin → Forty-Five: review the puzzle bank (migration 34) and fill the calendar.
export default async function AdminFortyFivePage() {
  const result = await getFortyFiveAdminData();
  if (!result.success) {
    return (
      <>
        <PageHeader title="Forty-Five" right={<FortyFiveTabs current="puzzles" />} />
        <StatsError error={result.error} />
      </>
    );
  }
  const { puzzles, counts, scheduledUntil, today, emptyDays, pastEmptyDays } = result.data;
  const daysLeft = scheduledUntil ? Math.max(0, Math.round((Date.parse(scheduledUntil) - Date.parse(today)) / 86_400_000) + 1) : 0;

  return (
    <>
      <PageHeader
        title="Forty-Five"
        description="Approve, reject or fix puzzles, then schedule: approved daily puzzles fill the next free days in order (2026-11-10 is #1). Played puzzles are locked."
        right={
          <div className="flex flex-wrap items-center gap-sm">
            <FortyFiveTabs current="puzzles" />
            <ScheduleButton ready={counts.readyToSchedule} emptyDays={emptyDays.length} />
          </div>
        }
      />
      <StatGrid>
        <StatCard accent label="Days scheduled ahead" value={daysLeft} hint={scheduledUntil ? `Until ${scheduledUntil}` : "Nothing scheduled"} />
        <StatCard label="Drafts to review" value={counts.draft} />
        <StatCard label="Approved, not scheduled" value={counts.readyToSchedule} />
        <StatCard label="Rejected" value={counts.rejected} />
      </StatGrid>
      {emptyDays.length > 0 && (
        <p role="alert" className="rounded-xl border border-error bg-error-container px-md py-sm text-body-md text-on-error-container">
          {emptyDays.includes(today) ? "Today has no puzzle. " : ""}
          Empty {emptyDays.length === 1 ? "day" : "days"}: {emptyDays.join(", ")}. Press &ldquo;{counts.readyToSchedule ? `Schedule ${counts.readyToSchedule} approved` : `Fill ${emptyDays.length} empty day${emptyDays.length === 1 ? "" : "s"}`}&rdquo;: approved puzzles fill them first, otherwise later puzzles move up a day.
        </p>
      )}
      {pastEmptyDays.length > 0 && (
        <p className="text-label-md text-on-surface-variant">Past days with no puzzle (gaps in the archive and in streaks): {pastEmptyDays.join(", ")}.</p>
      )}
      <FortyFiveReview puzzles={puzzles} />
    </>
  );
}

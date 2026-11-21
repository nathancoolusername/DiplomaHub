import Link from "next/link";
import { getOverviewStats, parseRange } from "@/app/lib/admin-stats";
import { getUsageStats, type UsageStats } from "@/app/lib/admin-usage";
import { LineChart } from "@/components/admin/charts/LineChart";
import { CHART_1, CHART_2, CHART_3, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

// Overview: who is using the site, what they use, and what brings them back
// (the user list is Users; library and moderation numbers are on their own tabs).
export default async function AdminOverviewPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const [overview, usage] = await Promise.all([getOverviewStats(range), getUsageStats(range)]);

  const o = overview.ok ? overview.data : null;
  const newInRange = o ? o.series.reduce((sum, d) => sum + d.new, 0) : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Who is using the site, what they use, and what brings them back."
        right={<RangeSelect basePath="/admin" range={range} />}
      />

      {!overview.ok && <StatsError error={overview.error} />}

      {o && (
        <>
          <StatGrid>
            <StatCard accent label="Total users" value={o.total_users} hint={`${o.pro_users.toLocaleString()} with Pro`} />
            <StatCard label={`New in ${range} days`} value={newInRange} hint={`${o.new_1d} today · ${o.new_7d} this week`} />
            <StatCard label="Active (7 days)" value={o.active_7d} hint={`${percent(o.active_7d, o.total_users)} of all users`} />
            <StatCard label="Returning (7 days)" value={o.returning_7d} hint="Active, and not just signed up" />
          </StatGrid>
          <StatGrid>
            <StatCard label="Active today" value={o.active_1d} />
            <StatCard label="Active (30 days)" value={o.active_30d} hint={`${percent(o.active_30d, o.total_users)} of all users`} />
            <StatCard label="Returning (30 days)" value={o.returning_30d} hint={`${percent(o.returning_30d, o.active_30d)} of the active`} />
            <StatCard label="Finished setup" value={percent(o.onboarded, o.total_users)} hint={`${o.onboarded.toLocaleString()} students`} />
          </StatGrid>

          <Panel
            title="Users over time"
            description={`New sign-ups, everyone active that day, and returning students (active on a day after they signed up). Last ${range} days.`}
          >
            <LineChart
              series={[
                { key: "new", label: "New", color: CHART_3, data: o.series.map((d) => ({ date: d.date, count: d.new })) },
                { key: "active", label: "Active", color: CHART_1, data: o.series.map((d) => ({ date: d.date, count: d.active })) },
                { key: "returning", label: "Returning", color: CHART_2, data: o.series.map((d) => ({ date: d.date, count: d.returning })) },
              ]}
            />
            <p className="text-label-sm text-on-surface-variant">
              Daily activity is recorded from the day this update went live. Before that, only each person&apos;s last visit is known, so earlier days show
              fewer active users than there really were.
            </p>
          </Panel>
        </>
      )}

      {!usage.ok && <StatsError error={usage.error} />}
      {usage.ok && <Usage u={usage.data} />}
    </>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** A thin bar for "share of" numbers inside tables. */
function Meter({ value }: { value: number }) {
  return (
    <span className="block h-2 w-full min-w-16 rounded-full bg-surface-container-high overflow-hidden" aria-hidden="true">
      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(value * 100))}%` }} />
    </span>
  );
}

const th = "text-left text-label-sm font-semibold text-on-surface-variant px-sm py-xs";
const td = "px-sm py-xs text-body-md text-on-surface tabular-nums";

function Usage({ u }: { u: UsageStats }) {
  const r = u.returnBy;
  return (
    <>
      <h2 className="font-serif font-bold text-headline-md text-on-surface pt-md">What people use</h2>
      {u.missing.length > 0 && <p className="text-label-md text-on-surface-variant">Not counted (table missing): {u.missing.join(", ")}</p>}

      <Panel
        title="Feature reach"
        description={`Students who used each feature. "Of active" is the share of this week's ${u.active7d.toLocaleString()} active students. Admins and Deadline guests are left out.`}
      >
        <div className="overflow-x-auto -mx-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className={th}>Feature</th>
                <th className={`${th} text-right`}>7 days</th>
                <th className={th}>Of active</th>
                <th className={`${th} text-right`}>{u.days} days</th>
                <th className={`${th} text-right`}>Times</th>
              </tr>
            </thead>
            <tbody>
              {u.features.map((f) => (
                <tr key={f.key} className="border-b border-outline-variant/50 last:border-0">
                  <td className="px-sm py-xs">
                    <Link href={f.href} className="text-body-md font-semibold text-on-surface hover:text-primary">
                      {f.label}
                    </Link>
                    {f.note && <span className="block text-label-sm text-on-surface-variant">{f.note}</span>}
                  </td>
                  <td className={`${td} text-right font-bold`}>{f.users7d.toLocaleString()}</td>
                  <td className="px-sm py-xs w-40">
                    <span className="flex items-center gap-xs">
                      <Meter value={f.shareOfActive} />
                      <span className="text-label-sm text-on-surface-variant tabular-nums w-9 text-right">{pct(f.shareOfActive)}</span>
                    </span>
                  </td>
                  <td className={`${td} text-right`}>{f.usersRange.toLocaleString()}</td>
                  <td className={`${td} text-right text-on-surface-variant`}>{f.eventsRange.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-md">
        <Panel
          title="What brings them back"
          description={`Students who signed up 8–45 days ago (${r.cohort.toLocaleString()}), active again a week or more after signing up, by what they did. Groups overlap; this shows a link, not a cause.`}
        >
          <p className="text-body-md text-on-surface">
            Overall: <span className="font-bold tabular-nums">{percent(r.cameBack, r.cohort)}</span> came back ({r.cameBack.toLocaleString()})
          </p>
          <ul className="flex flex-col gap-sm">
            {r.groups.map((g) => (
              <li key={g.label} className="flex flex-col gap-px">
                <span className="flex justify-between gap-sm text-label-md text-on-surface">
                  <span>{g.label}</span>
                  <span className="tabular-nums">
                    <span className="font-bold">{percent(g.back, g.users)}</span>{" "}
                    <span className="text-on-surface-variant">
                      ({g.back}/{g.users})
                    </span>
                  </span>
                </span>
                <Meter value={g.users ? g.back / g.users : 0} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Coming back week to week" description="Active students each week, and how many were active again the week after.">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className={th}>Week</th>
                <th className={`${th} text-right`}>Active</th>
                <th className={`${th} text-right`}>Back next week</th>
              </tr>
            </thead>
            <tbody>
              {u.weeks.map((w) => (
                <tr key={w.label} className="border-b border-outline-variant/50 last:border-0">
                  <td className={td}>{w.label}</td>
                  <td className={`${td} text-right font-bold`}>{w.active.toLocaleString()}</td>
                  <td className={`${td} text-right`}>{w.back === null ? "–" : `${w.back} (${percent(w.back, w.active)})`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="New students" description={`What the ${u.funnel.newUsers.toLocaleString()} students who signed up in the last ${u.days} days have done so far.`}>
          <ul className="flex flex-col gap-sm">
            {u.funnel.steps.map((s) => (
              <li key={s.label} className="flex flex-col gap-px">
                <span className="flex justify-between gap-sm text-label-md text-on-surface">
                  <span>{s.label}</span>
                  <span className="tabular-nums">
                    <span className="font-bold">{percent(s.users, u.funnel.newUsers)}</span> <span className="text-on-surface-variant">({s.users})</span>
                  </span>
                </span>
                <Meter value={u.funnel.newUsers ? s.users / u.funnel.newUsers : 0} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Do practice sets get finished?" description={`Attempts started in the last ${u.days} days.`}>
          <StatGrid>
            <StatCard label="Sets built" value={u.practice.setsCreated} />
            <StatCard label="Marked" value={u.practice.marked} hint={`${percent(u.practice.marked, u.practice.started)} of sets started`} />
            <StatCard label="Left unfinished" value={u.practice.leftOpen} />
            <StatCard label="Stuck marking" value={u.practice.stuckMarking} hint="Over an hour in marking" />
          </StatGrid>
        </Panel>
      </div>

      <Panel title="Most requested subjects" description={`Students asking for practice in a subject without questions yet, last ${u.days} days.`}>
        {u.requests.length === 0 ? (
          <Empty>No requests in this range.</Empty>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-lg gap-y-xs">
            {u.requests.map((q) => (
              <li key={q.label} className="flex justify-between gap-sm text-body-md text-on-surface border-b border-outline-variant/50 py-xs">
                <span className="truncate">{q.label}</span>
                <span className="font-bold tabular-nums">{q.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

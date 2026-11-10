import { getFortyFiveInsights } from "@/app/lib/actions/admin-forty-five";
import { BarChart } from "@/components/admin/charts/BarChart";
import { LineChart } from "@/components/admin/charts/LineChart";
import { FortyFiveTabs } from "@/components/admin/FortyFiveTabs";
import { CHART_1, CHART_2, Empty, PageHeader, Panel, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";
import { formatTime } from "@/lib/forty-five/dates";
import { TIERS } from "@/lib/forty-five/tiers";

const th = "px-sm py-sm text-label-sm font-semibold text-on-surface-variant uppercase whitespace-nowrap";
const td = "px-sm py-sm text-body-md text-on-surface tabular-nums whitespace-nowrap";
const pct = (r: number | null) => (r == null ? "–" : `${Math.round(r * 100)}%`);

// Admin → Forty-Five → Insights: who plays, how hard each puzzle was, and
// whether players liked it. Signed-in games from forty_five_plays; guest
// finishes and 👍/👎 from migration 36 (one per browser, so approximate).
export default async function AdminFortyFiveInsightsPage() {
  const result = await getFortyFiveInsights();
  const header = (
    <PageHeader
      title="Forty-Five"
      description="How players do on each puzzle and whether they liked it. Guests count once per browser; guest times aren't recorded."
      right={<FortyFiveTabs current="insights" />}
    />
  );
  if (!result.success) {
    return (
      <>
        {header}
        <StatsError error={result.error} />
      </>
    );
  }
  const { puzzles, totals, series, scoreDistribution, feedbackReady, today } = result.data;
  const todays = puzzles.find((p) => p.date === today);
  const rated = totals.likes + totals.dislikes;

  return (
    <>
      {header}
      {!feedbackReady && (
        <p role="status" className="rounded-2xl border border-outline-variant bg-surface-container p-md text-body-md text-on-surface">
          Run migration 36 (<code>20261115120000_forty_five_feedback.sql</code>) to count guests and likes. Until then, only signed-in games show here.
        </p>
      )}
      <StatGrid>
        <StatCard
          accent
          label={todays ? `Finished today (#${todays.number})` : "Finished today"}
          value={todays ? todays.finishedSigned + todays.finishedGuest : 0}
          hint={todays ? `${todays.finishedSigned} signed in · ${todays.finishedGuest} guests · ${todays.opened - todays.finishedSigned} signed-in still playing or gave up` : "No puzzle today"}
        />
        <StatCard label="Liked it" value={rated ? percent(totals.likes, rated) : "–"} hint={`${totals.likes} 👍 · ${totals.dislikes} 👎 all time`} />
        <StatCard label="Signed-in players" value={totals.signedPlayers} hint={`${totals.returningPlayers} played 2+ days`} />
        <StatCard label="Games finished" value={totals.finishes} hint={`Avg ${totals.averageScore ?? "–"}/45 · ${pct(totals.winRate)} solved`} />
      </StatGrid>

      <Panel title="Finished games per day" description="Signed-in and guest finishes for each day's puzzle.">
        {series.length ? (
          <LineChart
            series={[
              { key: "signed", label: "Signed in", color: CHART_1, data: series.map((d) => ({ date: d.date, count: d.signed })) },
              { key: "guest", label: "Guests", color: CHART_2, data: series.map((d) => ({ date: d.date, count: d.guest })) },
            ]}
          />
        ) : (
          <Empty>No puzzle has gone live yet.</Empty>
        )}
      </Panel>

      <Panel title="Each puzzle" description="Newest first. Group columns: share of finishers who found that group (lowest = hardest). One-aways: total “One away…” guesses.">
        {puzzles.length === 0 ? (
          <Empty>No puzzle has gone live yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>#</th>
                  <th className={th}>Finished</th>
                  <th className={th}>👍 / 👎</th>
                  <th className={th}>Solved</th>
                  <th className={th}>Flawless</th>
                  <th className={th}>Avg</th>
                  <th className={th}>Median time</th>
                  <th className={th}>Groups found</th>
                  <th className={th}>One-aways</th>
                </tr>
              </thead>
              <tbody>
                {puzzles.map((p) => {
                  const hardest = Math.min(...p.groups.map((g) => g.solveRate ?? 1));
                  return (
                    <tr key={p.slug} className="border-b border-outline-variant last:border-b-0 align-top">
                      <td className={td}>
                        <span className="font-semibold">#{p.number}</span>
                        <span className="block text-label-sm text-on-surface-variant">
                          {p.date} · {p.slug}
                        </span>
                      </td>
                      <td className={td}>
                        {p.finishedSigned + p.finishedGuest}
                        <span className="block text-label-sm text-on-surface-variant">
                          {p.finishedSigned} in · {p.finishedGuest} guest
                        </span>
                      </td>
                      <td className={td}>
                        {p.likes} / {p.dislikes}
                        <span className="block text-label-sm text-on-surface-variant">{p.likes + p.dislikes ? `${percent(p.likes, p.likes + p.dislikes)} liked` : "no votes"}</span>
                      </td>
                      <td className={td}>{pct(p.winRate)}</td>
                      <td className={td}>{pct(p.flawlessRate)}</td>
                      <td className={td}>{p.averageScore ?? "–"}</td>
                      <td className={td}>{p.medianSeconds == null ? "–" : formatTime(p.medianSeconds)}</td>
                      <td className="px-sm py-sm">
                        <ul className="flex flex-col gap-0.5 min-w-56">
                          {p.groups.map((g) => (
                            <li key={g.difficulty} className="flex items-center gap-xs text-label-md">
                              <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-sm ${TIERS[g.difficulty].bg}`} />
                              <span className={`flex-1 min-w-0 truncate ${g.solveRate != null && g.solveRate === hardest && p.groups.some((x) => x.solveRate !== hardest) ? "font-semibold text-error" : "text-on-surface"}`} title={g.label}>
                                {g.label}
                              </span>
                              <span className="tabular-nums text-on-surface-variant">{pct(g.solveRate)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className={td}>{p.oneAways}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Scores" description="Every finished game, signed in and guest.">
        {scoreDistribution.length ? <BarChart color={CHART_1} data={scoreDistribution.map((d) => ({ label: `${d.score}/45`, value: d.count }))} /> : <Empty>No finished games yet.</Empty>}
      </Panel>
    </>
  );
}

import { BarChart } from "@/components/admin/charts/BarChart";
import { LineChart } from "@/components/admin/charts/LineChart";
import { CHART_1, CHART_2, CHART_3, Empty, Panel, StatCard, StatGrid } from "@/components/admin/ui";
import type { DeadlineAnalytics } from "@/app/lib/admin-deadline-stats";

const bars = (rows: { label: string; count: number }[]) => rows.map((r) => ({ label: r.label, value: r.count }));
const show = (n: number | null, suffix = "") => (n === null ? "–" : `${n}${suffix}`);

/** Admin → Deadline → Analytics, given the numbers (the page loads them; the dev preview fakes them). */
export function DeadlineAnalyticsView({ data, range }: { data: DeadlineAnalytics; range: number }) {
  const { games: g, perDay, sizes, funnel, joinsVia, endReasons, matchedBy, points, answers, prompts } = data;
  const runningOut = prompts.filter((p) => p.rounds >= 3 && p.exhausted / p.rounds >= 0.3);

  return (
    <>
      <StatGrid>
        <StatCard accent label={`Games in ${range} days`} value={g.started} hint={`${g.finished} finished · ${g.abandoned} abandoned`} />
        <StatCard label="Players" value={g.players} hint={`${show(g.avgPlayers)} per game on average`} />
        <StatCard label="Game length" value={show(g.avgMinutes, " min")} hint="Finished games, on average" />
        <StatCard label="Play again" value={show(g.playAgainPct, "%")} hint={`Squad games ${show(g.squadPct, "%")} · Overtime ${show(g.overtimePct, "%")}`} />
      </StatGrid>

      <Panel title="Games per day" description="Started (any number of players)">
        {g.started ? <LineChart series={[{ key: "games", label: "Games", color: CHART_1, data: perDay }]} /> : <Empty>No games yet in this range.</Empty>}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-md">
        <Panel title="From opening Deadline to a finished game" description="Counted events in this range">
          {funnel.some((f) => f.count) ? <BarChart data={bars(funnel)} color={CHART_2} /> : <Empty>Nothing yet.</Empty>}
        </Panel>
        <Panel title="How players arrive" description="Joins by route">
          {joinsVia.length ? <BarChart data={bars(joinsVia)} color={CHART_3} /> : <Empty>No joins yet.</Empty>}
        </Panel>
        <Panel title="Players per game">
          {g.started ? <BarChart data={bars(sizes)} color={CHART_1} /> : <Empty>No games yet.</Empty>}
        </Panel>
        <Panel title="How prompts end" description="Every prompt played in a game">
          {endReasons.length ? <BarChart data={bars(endReasons)} color={CHART_2} /> : <Empty>No prompts played yet.</Empty>}
        </Panel>
        <Panel title="How answers were accepted" description={`${answers.total.toLocaleString()} right answers · ${show(answers.avgSeconds, " s")} to answer on average`}>
          {answers.total ? <BarChart data={bars(matchedBy)} color={CHART_3} /> : <Empty>No answers yet.</Empty>}
        </Panel>
        <Panel title="Points per answer" description={`${answers.rejects.toLocaleString()} wrong tries · ${answers.appealed.toLocaleString()} flagged “That's right!”`}>
          {answers.total ? <BarChart data={bars(points)} color={CHART_1} /> : <Empty>No answers yet.</Empty>}
        </Panel>
      </div>

      <Panel title="Chat" description="Per game, on average">
        <p className="text-body-md text-on-surface">{show(g.messagesPerGame)} messages · {show(g.reactionsPerGame)} reactions</p>
      </Panel>

      <Panel title="Prompts" description={runningOut.length ? `${runningOut.length} prompt${runningOut.length === 1 ? "" : "s"} often run out of answers: add more in Prompts.` : "Most played first"}>
        {prompts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-md min-w-[560px]">
              <thead>
                <tr className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant">
                  <th className="py-xs pr-sm font-semibold">Prompt</th>
                  <th className="py-xs pr-sm font-semibold text-right">Played</th>
                  <th className="py-xs pr-sm font-semibold text-right">Answers / round</th>
                  <th className="py-xs pr-sm font-semibold text-right">Ran out</th>
                  <th className="py-xs font-semibold text-right">Cleared</th>
                </tr>
              </thead>
              <tbody>
                {prompts.slice(0, 40).map((p) => (
                  <tr key={p.slug} className="border-b border-outline-variant/60">
                    <td className="py-xs pr-sm">{p.text} <span className="text-label-sm text-on-surface-variant">{p.slug}</span></td>
                    <td className="py-xs pr-sm text-right tabular-nums">{p.rounds}</td>
                    <td className="py-xs pr-sm text-right tabular-nums">{p.avgAnswers}</td>
                    <td className={`py-xs pr-sm text-right tabular-nums ${p.exhausted / p.rounds >= 0.3 && p.rounds >= 3 ? "text-error font-semibold" : ""}`}>{p.exhausted}</td>
                    <td className="py-xs text-right tabular-nums">{p.cleared}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No prompts played yet.</Empty>
        )}
      </Panel>
    </>
  );
}

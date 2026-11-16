import Link from "next/link";
import { getBroAdminData } from "@/app/lib/actions/admin-bro";
import { parseRange } from "@/app/lib/admin-stats";
import { estimateCost, formatDollars } from "@/lib/bro/pricing";
import { BRO_CHAT_MODEL } from "@/lib/bro/prompt";
import { DAILY_CAPS } from "@/lib/plans";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BroFlags } from "@/components/admin/BroFlags";
import { CHART_1, CHART_2, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string; reviewed?: string }> };

const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase";
const td = "px-md py-sm text-body-md text-on-surface tabular-nums";

const METRIC: Record<string, string> = { bro_message: "Bro messages", opus_escalation: "Opus escalations", generated_question: "Generated questions" };

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Admin → Bro: is DiplomaBro being used, what does it cost, who hits the
// caps, and the "This is wrong" flags to review each week.
export default async function AdminBroPage({ searchParams }: Props) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const showReviewed = sp.reviewed === "1";
  const result = await getBroAdminData(range, showReviewed);
  const header = (
    <PageHeader
      title="Bro"
      description="How much students use DiplomaBro, what it costs, who hits the daily caps, and the replies students flagged. Chats stay private: only flagged replies are shown."
      right={<RangeSelect basePath="/admin/bro" range={range} />}
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
  const { stats: s, flags, capHits, memory } = result.data;
  const costToday = estimateCost(s.tokens.today);
  const costMonth = estimateCost(s.tokens.month);
  const costWindow = estimateCost(s.tokens.window);
  const perReply = s.replies_window ? costWindow / s.replies_window : 0;

  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label="Open flags" value={s.flags_open} hint={`${s.flags_window.toLocaleString()} flagged in ${range} days`} />
        <StatCard label="Bro replies today" value={s.replies_today} hint={`${s.users_today.toLocaleString()} students · ${formatDollars(costToday)}`} />
        <StatCard label={`Replies (${range} days)`} value={s.replies_window} hint={`${s.replies_total.toLocaleString()} ever`} />
        <StatCard label="Cost this month (estimate)" value={formatDollars(costMonth)} hint={`${formatDollars(costWindow)} in ${range} days · ${formatDollars(perReply)} a reply`} />
      </StatGrid>
      <StatGrid>
        <StatCard label="Have Pro now" value={s.pro_now} hint={`${memory.students.toLocaleString()} have Bro memory (${memory.items.toLocaleString()} items)`} />
        <StatCard label="Used Bro (7 days)" value={s.users_7d} hint={`${percent(s.users_7d, s.pro_now)} of Pro students`} />
        <StatCard label={`Used Bro (${range} days)`} value={s.users_window} hint={s.users_window ? `${(s.replies_window / s.users_window).toFixed(1)} replies each` : undefined} />
        <StatCard label={`Days at a cap (${range} days)`} value={capHits.length} hint={`Bro cap: ${DAILY_CAPS.bro_message.pro} a day`} />
      </StatGrid>

      <Panel title="Flagged replies" description="Students tap “This is wrong” under a reply. Review them weekly: fix the prompt or the content, then mark each one.">
        <BroFlags flags={flags} showReviewed={showReviewed} />
      </Panel>

      <Panel title="Bro per day" description="Replies Bro sent and students who wrote to it (UTC days).">
        <LineChart
          series={[
            { key: "replies", label: "Replies", color: CHART_1, data: s.series.map((d) => ({ date: d.date, count: d.replies })) },
            { key: "users", label: "Students", color: CHART_2, data: s.series.map((d) => ({ date: d.date, count: d.users })) },
          ]}
        />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-lg">
        <Panel title="Heaviest users" description={`Most Bro replies in the last ${range} days. Watch for anyone hammering Bro.`}>
          {s.top_users.length === 0 ? (
            <Empty>Nobody has used Bro in this period.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className={th}>Student</th>
                    <th className={th}>Replies</th>
                    <th className={th}>Days</th>
                    <th className={th}>Last used</th>
                  </tr>
                </thead>
                <tbody>
                  {s.top_users.map((u) => (
                    <tr key={u.user_id} className="border-b border-outline-variant last:border-b-0">
                      <td className="px-md py-sm">
                        <Link href={`/admin/pro?user=${u.user_id}`} className="flex flex-col hover:underline w-fit">
                          <span className="font-semibold text-on-surface">{u.name}</span>
                          {u.email && <span className="text-label-sm text-on-surface-variant break-all">{u.email}</span>}
                        </Link>
                      </td>
                      <td className={td}>{u.replies}</td>
                      <td className={td}>{u.days}</td>
                      <td className="px-md py-sm text-body-md text-on-surface-variant whitespace-nowrap">{when(u.last_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Daily caps" description="Pro caps per student per UTC day (lib/plans.ts, DAILY_CAPS). Days a student reached one are listed below.">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>Limit</th>
                  <th className={th}>Free</th>
                  <th className={th}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DAILY_CAPS).map(([metric, cap]) => (
                  <tr key={metric} className="border-b border-outline-variant last:border-b-0">
                    <td className="px-md py-sm text-body-md text-on-surface">{METRIC[metric] ?? metric}</td>
                    <td className={td}>{cap.free ?? "No cap"}</td>
                    <td className={td}>{cap.pro ?? "No cap"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {capHits.length === 0 ? (
            <Empty>Nobody reached a cap in this period.</Empty>
          ) : (
            <ul className="flex flex-col gap-xs">
              {capHits.map((h) => (
                <li key={`${h.userId}-${h.metric}-${h.day}`} className="text-body-md text-on-surface">
                  <Link href={`/admin/pro?user=${h.userId}`} className="font-semibold hover:underline">
                    {h.name}
                  </Link>{" "}
                  <span className="text-on-surface-variant">
                    · {METRIC[h.metric] ?? h.metric} {h.count}/{h.cap} on {h.day}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-label-md text-on-surface-variant">
        Chat model: {BRO_CHAT_MODEL}. Costs are estimates from the saved token counts at list prices (lib/bro/pricing.ts), in US dollars; replies saved
        before migration 38 have no token counts. The real bill is in the Claude Console.
      </p>
    </>
  );
}

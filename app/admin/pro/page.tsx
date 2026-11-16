import Link from "next/link";
import { getProAdminData, getProCodes } from "@/app/lib/actions/admin-pro";
import { EntitlementsTable, GrantBeta, MakeProCodes, RefreshNow } from "@/components/admin/ProManager";
import { Empty, PageHeader, Panel, StatCard, StatGrid, StatsError } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ user?: string }> };

const PLAN_LABEL: Record<string, string> = { unlimited: "Unlimited", beta: "Beta", trial: "Trial", monthly: "Monthly", one_year: "1 year", two_year: "2 years" };
const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase";
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Admin → Pro: who has DiplomaPro, giving beta, ending it (public.entitlements).
export default async function AdminProPage({ searchParams }: Props) {
  const raw = (await searchParams).user;
  const userId = raw && UUID.test(raw) ? raw : undefined;
  const [result, codesResult] = await Promise.all([getProAdminData(userId), getProCodes()]);
  const header = (
    <PageHeader
      title="Pro"
      description="Who has DiplomaPro and until when. Give beta Pro, make codes or end Pro here; the hourly job (and Refresh now) switches off Pro that ran out. Bro's usage, cost and flags are in Admin → Bro."
      right={<RefreshNow />}
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
  const { stats, rows } = result.data;

  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label="Have Pro now" value={stats.activeUsers} />
        <StatCard label="Ending within 7 days" value={stats.expiringIn7Days} />
        <StatCard label="Scheduled to start" value={stats.scheduled} />
        <StatCard
          label="By plan"
          value={stats.byPlan.length ? stats.byPlan.map((p) => p.count).join(" · ") : "0"}
          hint={stats.byPlan.map((p) => PLAN_LABEL[p.plan] ?? p.plan).join(" · ") || "Nobody yet"}
        />
      </StatGrid>

      <Panel title="Give beta Pro" description="Starts now. If they already have Pro, whichever ends later wins (they don't add up).">
        <GrantBeta />
      </Panel>

      <Panel
        title="Make Pro codes"
        description="10-character trial codes for beta invites and prizes. Students redeem them on /codes; the days start when their current Pro ends."
      >
        <MakeProCodes />
      </Panel>

      <Panel title="Pro codes" description="Trial codes you made, how many times each was used and by whom. A code stops working at its expiry or when it's used up.">
        {!codesResult.success ? (
          <StatsError error={codesResult.error} />
        ) : codesResult.data.length === 0 ? (
          <Empty>No Pro codes yet. Make some above.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>Code</th>
                  <th className={th}>Gives</th>
                  <th className={th}>Used</th>
                  <th className={th}>Expires</th>
                  <th className={th}>Redeemed by</th>
                </tr>
              </thead>
              <tbody>
                {codesResult.data.map((c) => {
                  return (
                    <tr key={c.id} className={`border-b border-outline-variant last:border-b-0 align-top ${c.live ? "" : "opacity-60"}`}>
                      <td className="px-md py-sm">
                        <span className="font-mono font-semibold text-on-surface">{c.code}</span>
                        {c.note && <p className="text-label-sm text-on-surface-variant">{c.note}</p>}
                      </td>
                      <td className="px-md py-sm text-body-md text-on-surface whitespace-nowrap">
                        {c.days} days {PLAN_LABEL[c.plan] ?? c.plan}
                      </td>
                      <td className="px-md py-sm text-body-md text-on-surface tabular-nums">
                        {c.uses}
                        {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className="px-md py-sm text-body-md text-on-surface-variant whitespace-nowrap">{c.expiresAt ? shortDate(c.expiresAt) : "Never"}</td>
                      <td className="px-md py-sm text-body-md text-on-surface">
                        {c.redeemedBy.length === 0
                          ? <span className="text-on-surface-variant">Nobody yet</span>
                          : c.redeemedBy.map((r, i) => (
                              <span key={r.userId}>
                                {i > 0 && ", "}
                                <Link href={`/admin/pro?user=${r.userId}`} className="hover:underline">{r.name}</Link>
                              </span>
                            ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={userId ? "This student's entitlements" : "Entitlements"} description="Newest 200. Click a student to see only theirs.">
        <EntitlementsTable rows={rows} filteredUserId={userId} />
      </Panel>
    </>
  );
}

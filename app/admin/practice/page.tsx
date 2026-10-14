import Link from "next/link";
import { getPracticeStats, getRunningLow, parseRange } from "@/app/lib/admin-stats";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { CHART_1, CHART_2, CHART_3, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

const TYPE_LABELS: Record<string, string> = { mcq_short: "Questions", essay: "Essays", mock: "Mock exams", grade_own: "Grade your own" };

const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase";
const td = "px-md py-sm text-body-md text-on-surface tabular-nums";

export default async function AdminPracticePage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const [result, lowResult] = await Promise.all([getPracticeStats(range), getRunningLow()]);
  const header = (
    <PageHeader
      title="Practice"
      description="How much students practise, which subjects they use, and which subjects they ask for."
      right={<RangeSelect basePath="/admin/practice" range={range} />}
    />
  );
  if (!result.ok) {
    return (
      <>
        {header}
        <StatsError error={result.error} />
      </>
    );
  }
  const p = result.data;
  const requestedWithoutQuestions = p.requests.filter((r) => !r.has_questions);

  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label="Practised (30 days)" value={p.practisers_30d} hint={`${p.practisers_7d.toLocaleString()} in the last 7 days · ${p.practisers_all.toLocaleString()} ever`} />
        <StatCard label={`Attempts (${range} days)`} value={p.attempts_window} hint={`${p.attempts_total.toLocaleString()} in total`} />
        <StatCard label="Finished and marked" value={percent(p.attempts_marked, p.attempts_total)} hint={`${p.attempts_open.toLocaleString()} still open`} />
        <StatCard label="Subject requests" value={p.requests_total} hint={`from ${p.requesters.toLocaleString()} students`} />
      </StatGrid>
      <StatGrid>
        <StatCard label="Practice sets" value={p.sets_total} hint={`${p.sets_saved.toLocaleString()} saved`} />
        <StatCard label="Shared sets" value={p.sets_shared} hint={`${p.codes_redeemed.toLocaleString()} codes redeemed`} />
        <StatCard label="Answers marked" value={p.answers_marked} />
        <StatCard label="Points earned" value={p.points_total} hint={`${p.questions_in_bank.toLocaleString()} questions in the bank`} />
      </StatGrid>

      <Panel
        title="Running low on questions"
        description="Students who have seen 80% or more of the questions they can get in a subject, or have fewer than 50 left after seeing half. Questions and essays are counted separately. Only marked attempts count."
      >
        {!lowResult.ok ? (
          <StatsError error={lowResult.error} />
        ) : lowResult.data.students.length === 0 ? (
          <Empty>Nobody is close to running out. Students and subjects show up here once they have seen most of a subject.</Empty>
        ) : (
          <div className="flex flex-col gap-lg">
            <p className="text-body-md text-on-surface">
              <span className="font-serif font-bold text-headline-md tabular-nums">{lowResult.data.students_low.toLocaleString()}</span> student
              {lowResult.data.students_low === 1 ? "" : "s"} running low in {lowResult.data.low_count.toLocaleString()} subject
              {lowResult.data.low_count === 1 ? "" : "s"}
              {lowResult.data.low_count > lowResult.data.students.length ? ` (showing the ${lowResult.data.students.length} closest)` : ""}.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className={th}>Student</th>
                    <th className={th}>Subject</th>
                    <th className={th}>Seen</th>
                    <th className={th}>Left</th>
                    <th className={th}>Last practised</th>
                  </tr>
                </thead>
                <tbody>
                  {lowResult.data.students.map((s) => (
                    <tr key={`${s.user_id}-${s.subject}-${s.pool}`} className="border-b border-outline-variant last:border-b-0">
                      <td className={`${td} font-semibold`}>
                        <Link href={`/profile/${s.user_id}`} className="text-primary hover:underline">
                          {s.name}
                        </Link>
                      </td>
                      <td className={td}>
                        {s.subject}
                        {s.pool === "essays" && <span className="text-on-surface-variant"> · essays</span>}
                      </td>
                      <td className={td}>
                        {s.seen.toLocaleString()} / {s.total.toLocaleString()} <span className="text-on-surface-variant">({Math.round((s.seen / s.total) * 100)}%)</span>
                      </td>
                      <td className={td}>
                        <span
                          className={`rounded-full px-sm py-px text-label-sm font-semibold ${
                            s.left === 0 ? "bg-error-container text-on-error-container" : "bg-tertiary-container text-on-tertiary-container"
                          }`}
                        >
                          {s.left === 0 ? "None" : s.left.toLocaleString()}
                        </span>
                      </td>
                      <td className={`${td} text-on-surface-variant`}>{s.last_practised ? new Date(s.last_practised).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {lowResult.ok && lowResult.data.subjects.length > 0 && (
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-on-surface pb-xs">Which subjects need more questions</h4>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>Subject</th>
                  <th className={th}>Bank</th>
                  <th className={th}>Practising</th>
                  <th className={th}>Seen 50%+</th>
                  <th className={th}>Seen 80%+</th>
                  <th className={th}>Seen all</th>
                </tr>
              </thead>
              <tbody>
                {lowResult.data.subjects.map((s) => (
                  <tr key={`${s.subject}-${s.pool}`} className="border-b border-outline-variant last:border-b-0">
                    <td className={`${td} font-semibold`}>
                      {s.subject}
                      {s.pool === "essays" && <span className="font-normal text-on-surface-variant"> · essays</span>}
                    </td>
                    <td className={td}>{s.bank.toLocaleString()}</td>
                    <td className={td}>{s.students}</td>
                    <td className={td}>{s.over_50}</td>
                    <td className={td}>{s.over_80}</td>
                    <td className={td}>{s.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Practice over time" description={`Attempts started, sets built and students practising each day, last ${range} days`}>
        <LineChart
          series={[
            { key: "attempts", label: "Attempts", color: CHART_1, data: p.series.map((d) => ({ date: d.date, count: d.attempts })) },
            { key: "practisers", label: "Students", color: CHART_2, data: p.series.map((d) => ({ date: d.date, count: d.practisers })) },
            { key: "sets", label: "Sets built", color: CHART_3, data: p.series.map((d) => ({ date: d.date, count: d.sets })) },
          ]}
        />
      </Panel>

      <Panel
        title="Subject requests"
        description="Students asking for practice in a subject. Ranked by how many want it. Subjects with no questions yet come first."
      >
        {p.requests.length === 0 ? (
          <Empty>No requests yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>Subject</th>
                  <th className={th}>Students</th>
                  <th className={th}>Questions</th>
                  <th className={th}>Last request</th>
                </tr>
              </thead>
              <tbody>
                {[...requestedWithoutQuestions, ...p.requests.filter((r) => r.has_questions)].map((r) => (
                  <tr key={r.name} className="border-b border-outline-variant last:border-b-0">
                    <td className={`${td} font-semibold`}>{r.name}</td>
                    <td className={td}>{r.students}</td>
                    <td className={td}>
                      <span
                        className={`rounded-full px-sm py-px text-label-sm font-semibold ${
                          r.has_questions ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-container text-on-tertiary-container"
                        }`}
                      >
                        {r.has_questions ? "Has questions" : "None yet"}
                      </span>
                    </td>
                    <td className={`${td} text-on-surface-variant`}>{new Date(r.last).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Subjects" description="Students who take it, attempts so far, and questions available. Subjects with no activity and no questions are left out.">
        {p.subjects.length === 0 ? (
          <Empty>No subject data yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>Subject</th>
                  <th className={th}>Students</th>
                  <th className={th}>Attempts</th>
                  <th className={th}>Questions</th>
                </tr>
              </thead>
              <tbody>
                {p.subjects.map((s) => (
                  <tr key={s.subject_id} className="border-b border-outline-variant last:border-b-0">
                    <td className={`${td} font-semibold`}>{s.name}</td>
                    <td className={td}>{s.students}</td>
                    <td className={td}>{s.attempts}</td>
                    <td className={td}>{s.questions || <span className="text-on-surface-variant">None yet</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-md">
        <Panel title="Sets by type">
          {p.by_type.length ? <BarChart color={CHART_1} data={p.by_type.map((r) => ({ label: TYPE_LABELS[r.label] ?? r.label, value: r.count }))} /> : <Empty>No sets yet.</Empty>}
        </Panel>
        <Panel title="Top practisers" description="By points, all time">
          {p.top_practisers.length ? (
            <BarChart color={CHART_2} data={p.top_practisers.map((r) => ({ label: r.name, value: r.points }))} />
          ) : (
            <Empty>Nobody has earned points yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}

import { getDeadlineBank } from "@/app/lib/actions/admin-deadline";
import { DeadlineBank } from "@/components/admin/DeadlineBank";
import { DeadlineEditor } from "@/components/admin/DeadlineEditor";
import { PageHeader, StatCard, StatGrid, StatsError } from "@/components/admin/ui";
import { DeadlineTabs } from "@/components/admin/DeadlineTabs";
import { getDeadlineWaiting } from "@/app/lib/admin-deadline-stats";

// Admin → Deadline (migration 56): the party game's prompt bank, edited here.
// Missing answers, reports and game analytics come with the rest of the tab.
export default async function AdminDeadlinePage() {
  const [bank, waiting] = await Promise.all([getDeadlineBank(), getDeadlineWaiting()]);
  const header = (
    <PageHeader
      title="Deadline"
      description="The party game's prompts and answers. Edit them here: every save is live for the next prompt that comes up."
      right={<DeadlineTabs current="prompts" waiting={waiting} />}
    />
  );
  if (!bank.success) return (<>{header}<StatsError error={bank.error} /><DeadlineBank /></>);

  const on = bank.data.filter((p) => p.active);
  const answers = on.reduce((n, p) => n + p.answers.length, 0);
  const subjects = new Map<string, { prompts: number; answers: number }>();
  for (const p of on) {
    const s = subjects.get(p.subject) ?? { prompts: 0, answers: 0 };
    s.prompts++;
    s.answers += p.answers.length;
    subjects.set(p.subject, s);
  }
  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label="Prompts in play" value={on.length} hint={bank.data.length > on.length ? `${bank.data.length - on.length} switched off` : undefined} />
        <StatCard label="Answers" value={answers} hint={on.length ? `${Math.round(answers / on.length)} per prompt` : undefined} />
        <StatCard label="Subjects" value={subjects.size} />
        <StatCard label="Reviewed" value={`${on.filter((p) => p.extra?.reviewed === true).length} / ${on.length}`} />
      </StatGrid>
      {subjects.size > 0 && (
        <ul className="flex flex-wrap gap-xs" aria-label="Prompts per subject">
          {[...subjects.entries()].sort((a, b) => b[1].prompts - a[1].prompts).map(([subject, s]) => (
            <li key={subject} className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-1 text-label-md text-on-surface-variant">
              <span className="font-semibold text-on-surface">{subject}</span> {s.prompts} prompts · {s.answers.toLocaleString()} answers
            </li>
          ))}
        </ul>
      )}
      <DeadlineEditor initial={bank.data} />
      <DeadlineBank />
    </>
  );
}

import { CalendarDays, Gauge, ListChecks } from "lucide-react";
import { getSampleStrengthRows } from "@/lib/marketing/sample";
import { STRENGTH_LABELS } from "@/lib/practice/strength";
import { StrengthLegend } from "@/components/shared/strength/StrengthLegend";

function Step({
  n,
  icon,
  title,
  body,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        <span className="w-9 h-9 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
        <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wide">Step {n}</span>
      </div>
      <h3 className="font-serif font-bold text-headline-md text-on-surface">{title}</h3>
      <p className="text-body-md text-on-surface-variant">{body}</p>
      <div className="mt-auto pt-sm" aria-hidden="true">
        {children}
      </div>
    </li>
  );
}

const chip = "rounded-full px-sm py-px text-label-sm font-semibold";

export default function HowItWorksPro() {
  // A short landscape sample: one row of tiles per subject.
  const rows = getSampleStrengthRows().map((r) => ({ name: r.subject, tiles: r.tiles }));

  return (
    <section className="bg-surface-container-low px-md py-16" aria-labelledby="how-heading">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-xl">
        <h2 id="how-heading" className="font-serif font-bold text-headline-lg text-on-surface text-center">
          How it works
        </h2>
        <ol className="grid md:grid-cols-3 gap-lg">
          <Step
            n={1}
            icon={<ListChecks size={18} />}
            title="Practise by topic"
            body="Pick any of your subjects and topics, then answer on screen or on paper. Each question is marked against the markscheme's points."
          >
            <div className="flex flex-wrap gap-xs">
              <span className={`${chip} bg-primary text-on-primary`}>Physics · Waves</span>
              <span className={`${chip} bg-primary text-on-primary`}>Biology · Enzymes</span>
              <span className={`${chip} bg-primary text-on-primary`}>Economics · Elasticity</span>
              <span className={`${chip} bg-surface-container text-on-surface-variant`}>Exam level</span>
              <span className={`${chip} bg-surface-container text-on-surface-variant`}>10 questions</span>
            </div>
          </Step>
          <Step
            n={2}
            icon={<Gauge size={18} />}
            title="See your level"
            body="Every finished set updates your strength map, topic by topic, so you can see what's solid and what needs work."
          >
            <div className="flex flex-col gap-sm">
              <div className="flex flex-col gap-xs">
                {rows.map((row) => (
                  <div key={row.name} className="flex items-center gap-sm">
                    <span className="w-24 shrink-0 truncate text-label-sm text-on-surface-variant">{row.name}</span>
                    <div className="flex-1 flex gap-[3px]">
                      {row.tiles.map((s) => (
                        <span
                          key={s.id}
                          data-level={s.level}
                          title={`${s.shortName}: ${STRENGTH_LABELS[s.level]}`}
                          className="strength-tile flex-1 h-5 rounded-[4px]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <StrengthLegend />
            </div>
          </Step>
          <Step
            n={3}
            icon={<CalendarDays size={18} />}
            title="Plan around your tests"
            body="Add tests and deadlines to the free Hub. Home counts down to the next one and suggests what to practise before it."
          >
            <div className="rounded-xl bg-surface-container-low p-md flex flex-col gap-xs">
              <span className="font-serif font-bold text-headline-md text-primary leading-none">2 days</span>
              <span className="text-label-md text-on-surface">until Chemistry test: Rates</span>
              <span className="text-label-sm text-on-surface-variant">Suggested: a 10-question set on rates of reaction</span>
            </div>
          </Step>
        </ol>
      </div>
    </section>
  );
}

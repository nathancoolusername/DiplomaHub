import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { access, PRO_COMING_SOON, type FeatureKey } from "@/lib/plans";
import { MidnightPreviewButton } from "@/components/shared/MidnightPreview";

// Generated from lib/plans.ts so the table can't drift from the real
// limits. Exact numbers are still being decided, so caps are described,
// not counted.

// Rows with a key read from lib/plans.ts; "both" rows are free features
// without a plan entry; "soon" rows are planned for DiplomaPro after launch.
type Row = { label: string } & ({ key: FeatureKey; soon?: boolean } | { both: true });

const ROWS: Row[] = [
  { key: "written_questions", label: "Unlimited practice, marked point by point" },
  { both: true, label: "Print sets as PDFs, then mark your paper on screen" },
  { key: "rule_suggestions", label: "Strength maps, suggestions and Progress" },
  { both: true, label: "Share codes and accent colours" },
  { key: "bro_chat", label: "DiplomaBro on every page" },
  { key: "bro_explain", label: "Help on the question on screen, from its markscheme" },
  { key: "bro_auto_fill", label: "Practice sets built for you by Bro" },
  { key: "scheduling", label: "Study plans and sets scheduled on your calendar" },
  { key: "bro_suggestions", label: "Bro's brief: what to do first, every day" },
  { key: "midnight_theme", label: "Midnight theme" },
  { key: "backgrounds", label: "Backgrounds (Dawn, Aurora, Dusk)" },
  { key: "essay_review", label: "Essay and IA feedback", soon: true },
  { key: "photo_marking", label: "Grade work from a photo", soon: true },
];

function Cell({ allowed, limited, soon = false }: { allowed: boolean; limited: boolean; soon?: boolean }) {
  if (soon) return <span className="text-label-md text-on-surface-variant">Soon</span>;
  if (!allowed) return <Minus size={18} className="mx-auto text-outline" aria-label="Not included" />;
  if (limited) return <span className="text-label-md text-on-surface-variant">Weekly limit</span>;
  return <Check size={18} className="mx-auto text-secondary" aria-label="Included" />;
}

export default function FreeVsPro() {
  return (
    <section className="bg-surface-container-low px-md py-16" aria-labelledby="plans-heading">
      <div className="max-w-[900px] mx-auto flex flex-col gap-lg">
        <header className="text-center flex flex-col gap-xs">
          <h2 id="plans-heading" className="font-serif font-bold text-headline-lg text-on-surface">
            Free, or DiplomaPro
          </h2>
          <p className="text-body-lg text-on-surface-variant">Practice, the Hub and the resource library are free. DiplomaPro adds DiplomaBro{PRO_COMING_SOON ? ", and it's coming soon" : ""}.</p>
        </header>
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left">
                <th scope="col" className="px-lg py-md font-semibold text-on-surface-variant">
                  Feature
                </th>
                <th scope="col" className="px-md py-md text-center font-semibold text-on-surface w-32">
                  Free
                </th>
                <th scope="col" className="px-md py-md text-center font-semibold text-primary w-32">
                  DiplomaPro
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const { label } = row;
                const key = "key" in row ? row.key : null;
                const free = key ? access(key, false) : ({ allowed: true, limit: null } as const);
                const pro = key ? access(key, true) : ({ allowed: true, limit: null } as const);
                const soon = "soon" in row && !!row.soon;
                return (
                  <tr key={label} className="border-t border-outline-variant">
                    <th scope="row" className="px-lg py-sm text-left font-normal text-on-surface">
                      <span className="inline-flex flex-wrap items-center gap-x-sm gap-y-xs">
                        {label}
                        {key === "midnight_theme" && (
                          <MidnightPreviewButton
                            className="rounded-full border border-primary text-primary px-sm py-px text-label-sm font-semibold hover:bg-primary-fixed disabled:opacity-60 cursor-pointer"
                          />
                        )}
                      </span>
                    </th>
                    <td className="px-md py-sm text-center">
                      <Cell allowed={free.allowed} limited={free.allowed && free.limit !== null} />
                    </td>
                    <td className="px-md py-sm text-center">
                      <Cell allowed={pro.allowed} limited={false} soon={soon} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-center text-label-sm text-on-surface-variant">
          {PRO_COMING_SOON ? (
            <>
              DiplomaPro isn&apos;t open yet.{" "}
              <Link href="/pro" className="font-semibold text-primary hover:underline">
                Join the waitlist
              </Link>
            </>
          ) : (
            "Bro features have generous fair-use monthly caps."
          )}
        </p>
      </div>
    </section>
  );
}

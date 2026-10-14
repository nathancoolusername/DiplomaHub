import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { access, PRO_COMING_SOON, type FeatureKey } from "@/lib/plans";
import { MidnightPreviewButton } from "@/components/shared/MidnightPreview";

// Generated from lib/plans.ts so the table can't drift from the real
// limits. Exact numbers are still being decided, so caps are described,
// not counted.

const ROWS: { key: FeatureKey; label: string }[] = [
  { key: "mcq", label: "Multiple-choice practice" },
  { key: "written_questions", label: "Written questions, marked by markscheme" },
  { key: "rule_suggestions", label: "Strength maps and suggestions" },
  { key: "bro_explain", label: "Bro explanations" },
  { key: "short_answer_review", label: "Bro checks your working" },
  { key: "essay_review", label: "Essay feedback" },
  { key: "photo_marking", label: "Grade your own work from a photo" },
  { key: "scheduling", label: "Study plans and study blocks added to your calendar" },
  { key: "midnight_theme", label: "Midnight theme" },
];

function Cell({ allowed, limited }: { allowed: boolean; limited: boolean }) {
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
          <p className="text-body-lg text-on-surface-variant">The Hub and the resource library are always free. DiplomaPro is coming soon.</p>
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
              {ROWS.map(({ key, label }) => {
                const free = access(key, false);
                const pro = access(key, true);
                return (
                  <tr key={key} className="border-t border-outline-variant">
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
                      <Cell allowed={pro.allowed} limited={false} />
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

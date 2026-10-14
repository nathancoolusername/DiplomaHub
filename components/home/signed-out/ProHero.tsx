import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { getHomepageStats } from "@/app/lib/actions/site-stats";
import { getHeroSample } from "@/lib/marketing/sample";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { MarkPointList } from "@/components/practice/MarkPointList";

/**
 * Practice-first hero. The preview on the right is the real player and
 * markscheme UI with a sample question, so it stays sharp and follows the
 * theme, unlike a screenshot.
 */
export default async function ProHero() {
  const statsResult = await getHomepageStats();
  const stats = statsResult.success ? statsResult.data : null;
  const { question, markscheme } = getHeroSample();
  const part = question.parts[0];
  const partScheme = markscheme.parts[0];

  return (
    <div className="bg-surface-container-low px-md py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-2 items-center gap-xl">
        <div className="flex flex-col gap-lg text-center lg:text-left">
          <h1 className="text-display-lg font-serif font-bold text-on-surface">
            Practise like it&apos;s the exam. <span className="text-primary">Know where you stand.</span>
          </h1>
          <p className="text-on-surface-variant text-body-lg max-w-160 mx-auto lg:mx-0">
            IB-style questions across your subjects (from Maths and the sciences to Economics), marked point by point like a real
            markscheme. A strength map shows what to work on next, and the free Hub and resource library keep every deadline and exemplar
            beside it.
          </p>
          <div className="flex flex-col sm:flex-row gap-sm justify-center lg:justify-start">
            <a
              href="#try-a-question"
              className="inline-flex items-center justify-center gap-sm bg-primary text-on-primary rounded-lg px-lg py-sm text-body-lg font-semibold hover:bg-primary/90"
            >
              Try a question <ArrowDown size={18} aria-hidden="true" />
            </a>
            <Link
              href="/resources"
              className="inline-flex items-center justify-center bg-surface-container-lowest text-primary border-2 border-primary rounded-lg px-lg py-sm text-body-lg font-semibold hover:bg-primary-fixed"
            >
              Browse resources
            </Link>
          </div>
          {stats && stats.resourceCount > 0 && (
            <p className="text-primary text-body-md font-bold">
              {stats.resourceCount}+ resources across {stats.subjectCount} subject{stats.subjectCount === 1 ? "" : "s"} · used by{" "}
              {stats.userCount}+ IB students
            </p>
          )}
        </div>

        {/* Sample preview */}
        <div className="relative mx-auto w-full max-w-140 lg:max-w-none" aria-label="Sample of DiplomaPro practice">
          <span className="absolute -top-sm right-0 z-10 rounded-full bg-surface-container text-on-surface-variant px-sm py-px text-label-sm">Sample</span>
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xl p-lg flex flex-col gap-md">
            <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
              <span>Maths AA HL · Question 4 of 10</span>
              <span className="rounded-full bg-secondary-container text-on-secondary-container px-sm py-px font-semibold">On pace</span>
            </div>
            <div className="text-body-md text-on-surface">
              <MathMarkdown>{question.stemMd}</MathMarkdown>
            </div>
            <div className="flex items-start gap-md text-body-md text-on-surface">
              <span className="font-semibold">(a)</span>
              <div className="flex-1">
                <MathMarkdown>{part.textMd}</MathMarkdown>
              </div>
              <span className="font-semibold tabular-nums">[{part.marks}]</span>
            </div>
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-sm">
              <MarkPointList part={partScheme} ticked={partScheme.markPoints.map((_, i) => i)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

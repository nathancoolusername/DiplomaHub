"use client";

import Link from "next/link";
import type { BroBrief } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { BroAvatar } from "@/components/shared/BroAvatar";
import { ProBadge } from "@/components/shared/ProUpsell";
import { openBro } from "@/components/shared/bro/bro-visibility";

const STARTERS = ["Plan my week", "What should I practise first?", "Add my next test"];

/**
 * Pro: Bro's take on the week, with "Talk to Bro" carrying it into the bar.
 * New Pro student: Bro introduces itself with prompt chips. Free: a locked teaser.
 */
export function BroBriefCard({ brief, isPro }: { brief: BroBrief | null; isPro: boolean }) {
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="bro-brief">
      <h2 id="bro-brief" className="font-serif font-bold text-body-lg text-on-surface flex items-center gap-sm">
        <BroAvatar size={24} /> Bro&apos;s brief {!isPro && <ProBadge />}
      </h2>

      {!isPro ? (
        <>
          <div className="relative" aria-hidden="true">
            <div className="flex flex-col gap-xs blur-[3px] select-none">
              <p className="text-body-md text-on-surface">Busy week: your Maths test is on Tuesday and the Chemistry quiz is right after.</p>
              <p className="text-body-md text-on-surface">Start with integration tonight, then a short rates set tomorrow.</p>
            </div>
          </div>
          <p className="text-label-md text-on-surface-variant">
            Bro reads your calendar and strength maps and tells you what to do first. Coming with DiplomaPro.
          </p>
          <Link href={links.plans()} className="self-start text-label-md font-semibold text-primary hover:underline">
            Join the waitlist
          </Link>
        </>
      ) : brief ? (
        <>
          <p className="text-body-md text-on-surface">{brief.text}</p>
          <button
            type="button"
            onClick={() => openBro({ context: brief.text })}
            className="self-start mt-auto inline-flex items-center rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90 cursor-pointer"
          >
            Talk to Bro
          </button>
        </>
      ) : (
        <>
          <p className="text-body-md text-on-surface">
            Hey, I&apos;m Bro. I look at your calendar and practice and tell you what to focus on. Try one of these:
          </p>
          <div className="flex flex-wrap gap-xs">
            {STARTERS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => openBro({ prompt })}
                className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface hover:border-primary hover:text-primary cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

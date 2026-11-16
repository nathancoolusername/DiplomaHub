import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BroAvatar } from "@/components/shared/BroAvatar";

/** DiplomaBro, the Pro study partner. Copy only: no live chat for signed-out visitors. */
export default function MeetBro() {
  return (
    <section className="bg-surface-container-lowest px-md py-16" aria-labelledby="bro-heading">
      <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-xl items-center">
        <div className="flex flex-col gap-md">
          <span className="self-start inline-flex items-center gap-xs rounded-full bg-tertiary-container text-on-tertiary-container px-md py-xs text-label-md font-semibold">
            <Sparkles size={14} aria-hidden="true" /> Coming with DiplomaPro
          </span>
          <h2 id="bro-heading" className="font-serif font-bold text-headline-lg text-on-surface">
            Meet DiplomaBro, your study partner
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Bro knows your subjects, your test dates and how your practice went, and it&apos;s on every page. Ask about the question in front of
            you, or just say what&apos;s coming up: it builds the practice and puts the study sessions in your calendar.
          </p>
          <ul className="flex flex-col gap-xs text-body-md text-on-surface">
            <li>· Help on the question on screen, from its markscheme: hints first, the answer when you ask</li>
            <li>· Practice sets built from the topics you name or your weakest ones</li>
            <li>· Study plans and whole revision timetables added to your calendar</li>
            <li>· A daily brief on what to do first, and it remembers what you find hard</li>
          </ul>
          <Link href="/pro" prefetch={false} className="self-start text-label-lg font-semibold text-primary hover:underline">
            See everything in DiplomaPro →
          </Link>
        </div>

        {/* Illustration of the Bro bar (static sample). */}
        <div className="flex flex-col gap-sm" aria-label="Sample conversation with Bro">
          <div className="flex items-center gap-sm rounded-2xl bg-surface-raised border border-outline-variant shadow-lg px-md py-sm">
            <BroAvatar size={32} />
            <span className="text-body-md text-on-surface">What should I focus on this week?</span>
          </div>
          <div className="rounded-2xl bg-surface-container-low border border-outline-variant p-md flex flex-col gap-sm">
            <p className="text-body-md text-on-surface">
              Your Economics mock is on Thursday and elasticity is your shakiest topic, so start there tonight. Your Physics waves are
              slipping too: 20 minutes on Wednesday would help. Want me to block both into your calendar?
            </p>
            <div className="flex flex-wrap gap-xs">
              <span className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold">Yes, add them</span>
              <span className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface">Build the Economics set</span>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant">Sample conversation</p>
        </div>
      </div>
    </section>
  );
}

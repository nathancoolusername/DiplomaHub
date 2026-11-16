import Link from "next/link";
import { Ticket } from "lucide-react";
import { formatCode } from "@/lib/codes";
import { ShareableTypes } from "./ShareableTypes";

/**
 * /codes for signed-out visitors: usually a friend who opened a shared link.
 * Says what they've been sent and gets them signed up with the code kept.
 * It never looks the code up (a guessed code reveals nothing).
 */
export function CodesLanding({ code }: { code: string }) {
  const back = code ? `/codes?c=${code}` : "/codes";
  const signup = `/signup?next=${encodeURIComponent(back)}`;
  const login = `/login?next=${encodeURIComponent(back)}`;

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-xl">
      <section className="flex flex-col items-start gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl">
        <span className="inline-flex items-center gap-xs rounded-full bg-primary-fixed text-primary px-md py-1 text-label-md font-semibold">
          <Ticket size={14} aria-hidden="true" />
          {code ? "You've been sent a code" : "Codes"}
        </span>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">
          {code ? "Someone shared something with you" : "Share sets and study plans with one code"}
        </h1>
        {code && (
          <p className="font-mono font-bold tracking-[0.2em] text-headline-lg text-primary break-all" aria-label={`Code ${code.split("").join(" ")}`}>
            {formatCode(code)}
          </p>
        )}
        <p className="text-body-lg text-on-surface-variant max-w-[60ch]">
          {code
            ? "It could be a practice set, a Hub deadline or a whole revision plan. Make a free DiplomaHub account (or log in) and it's added to yours. The code stays filled in."
            : "Students share practice sets, Hub items and whole revision plans with a short code. Sign in to redeem one or share your own."}
        </p>
        <div className="flex flex-wrap gap-sm pt-xs">
          <Link href={signup} className="rounded-lg bg-primary text-on-primary px-lg py-sm text-label-lg font-semibold hover:bg-primary/90">
            {code ? "Sign up free to add it" : "Sign up free"}
          </Link>
          <Link href={login} className="rounded-lg border border-outline-variant px-lg py-sm text-label-lg font-semibold text-on-surface hover:bg-surface-container">
            I have an account
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-md" aria-labelledby="shareable">
        <h2 id="shareable" className="font-serif font-bold text-headline-md text-on-surface">
          What can be shared
        </h2>
        <ShareableTypes />
      </section>
    </div>
  );
}

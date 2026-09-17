import Link from "next/link";

export default function FinalCta() {
  return (
    <div className="px-md py-xl bg-surface-container-low">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center text-center gap-md py-lg">
        <h2 className="text-headline-lg font-serif font-bold text-on-surface">
          Everything you need for the diploma is here
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-140">
          Browse the resource library, or pick your subjects and let the Hub plan your deadlines.
        </p>
        {/* Same equal-weight pairing as the hero: one bordered, one solid,
            same size — so neither button reads as secondary. */}
        <div className="flex flex-col sm:flex-row gap-sm">
          <Link
            href="/resources"
            className="w-full sm:w-auto text-center bg-surface-container-lowest text-primary border-2 border-primary px-lg py-sm rounded-lg text-body-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Browse resources
          </Link>
          <Link
            href="/hub"
            className="w-full sm:w-auto text-center bg-primary text-on-primary px-lg py-sm rounded-lg text-body-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Start planning
          </Link>
        </div>
      </div>
    </div>
  );
}

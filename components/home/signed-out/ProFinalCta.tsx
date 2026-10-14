import Link from "next/link";

export default function ProFinalCta() {
  return (
    <div className="px-md py-xl bg-surface-container-low">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col items-center text-center gap-md py-lg">
        <h2 className="text-headline-lg font-serif font-bold text-on-surface">Start practising for free</h2>
        <p className="text-body-lg text-on-surface-variant max-w-140">
          Pick your subjects, try a set, and watch your strength map fill in. The Hub and resources come with it.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm">
          <Link href="/signup" className="w-full sm:w-auto text-center bg-primary text-on-primary px-lg py-sm rounded-lg text-body-lg font-semibold hover:bg-primary/90">
            Start practising
          </Link>
          <Link
            href="/resources"
            className="w-full sm:w-auto text-center bg-surface-container-lowest text-primary border-2 border-primary px-lg py-sm rounded-lg text-body-lg font-semibold hover:bg-primary-fixed"
          >
            Browse resources
          </Link>
        </div>
      </div>
    </div>
  );
}

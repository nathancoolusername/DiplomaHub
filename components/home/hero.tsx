import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarRange } from "lucide-react";
import { getHomepageStats } from "@/app/lib/actions/site-stats";

const RESOURCES_PREVIEW_PATH = "images/resources-preview.png";
const HUB_PREVIEW_PATH = "images/hub-preview.png";

function hasRealScreenshot(relativePath: string) {
  // Checked at request time, not build time, so dropping the real file into
  // public/images/ later just starts working — no code change needed.
  return fs.existsSync(path.join(process.cwd(), "public", relativePath));
}

function PreviewPanel({
  src,
  alt,
  placeholderIcon: Icon,
  placeholderLabel,
}: {
  src: string;
  alt: string;
  placeholderIcon: typeof BookOpen;
  placeholderLabel: string;
}) {
  return hasRealScreenshot(src) ? (
    <Image
      src={`/${src}`}
      alt={alt}
      width={700}
      height={560}
      className="w-full h-full object-cover rounded-xl border border-outline-variant shadow-lg"
    />
  ) : (
    <div
      className="w-full h-full aspect-[4/5] sm:aspect-square rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg flex flex-col items-center justify-center gap-sm text-on-surface-variant"
      aria-label={`${placeholderLabel} placeholder`}
    >
      <Icon size={36} className="text-outline" aria-hidden="true" />
      <span className="text-label-md font-medium">{placeholderLabel}</span>
    </div>
  );
}

export default async function Hero() {
  const statsResult = await getHomepageStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="bg-surface-container-low px-md py-20 md:py-24">
      {/* Highlighter-style sweep under "Everything"/"one place" — a colored
          bar animates in behind the text via a ::after pseudo-element
          rather than an animated background-color, so the dark headline
          text stays fully readable the whole time. */}
      <style>{`
        .hero-highlight {
          position: relative;
          display: inline-block;
          isolation: isolate;
        }
        .hero-highlight::after {
          content: "";
          position: absolute;
          left: -0.1em;
          right: -0.1em;
          bottom: 0.05em;
          height: 0.34em;
          background: var(--color-secondary-container);
          z-index: -1;
          border-radius: 0.15em;
          transform: scaleX(0);
          transform-origin: left;
          animation: heroHighlightSweep 0.7s ease-out forwards;
        }
        .hero-highlight:nth-of-type(2)::after {
          animation-delay: 0.6s;
        }
        @keyframes heroHighlightSweep {
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row items-center gap-xl">
        <div className="flex flex-col gap-lg text-center lg:text-left lg:basis-1/2">
          <h1 className="text-display-lg font-serif font-bold text-on-surface">
            <span className="hero-highlight">Everything</span> you need for the IB Diploma, in{" "}
            <span className="hero-highlight">one place</span>
          </h1>
          <p className="text-on-surface-variant text-body-lg">
            Browse top-scoring IA and EE exemplars, guides and notes for your subjects, and plan
            every deadline with the right resources beside it.
          </p>
          <div className="flex flex-col sm:flex-row gap-sm justify-center lg:justify-start">
            <Link href="/resources" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-sm bg-surface-container-lowest text-primary border-2 border-primary rounded-lg px-lg py-sm text-body-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                Browse resources
              </button>
            </Link>
            <Link href="/hub" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-sm bg-primary text-on-primary rounded-lg px-lg py-sm text-body-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                Start planning
              </button>
            </Link>
          </div>
          {stats && stats.resourceCount > 0 && (
            <p className="text-primary text-body-md font-bold">
              {stats.resourceCount}+ resources across {stats.subjectCount} subject
              {stats.subjectCount === 1 ? "" : "s"} · used by {stats.userCount}+ IB students
            </p>
          )}
        </div>

        <div className="lg:basis-1/2 w-full grid grid-cols-2 gap-sm sm:gap-md">
          <div className="translate-y-[2.5rem]">
            <PreviewPanel
              src={RESOURCES_PREVIEW_PATH}
              alt="A resource card from DiplomaHub's library of exemplars, guides, and notes"
              placeholderIcon={BookOpen}
              placeholderLabel="Resources preview coming soon"
            />
          </div>
          <div className="-translate-y-[2.5rem]">
            <PreviewPanel
              src={HUB_PREVIEW_PATH}
              alt="The Hub's week view, showing a calendar of IB deadlines and study blocks"
              placeholderIcon={CalendarRange}
              placeholderLabel="Hub preview coming soon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  Check,
  WandSparkles,
  Clock,
  Medal,
  Podium,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getRoadmapItems } from "@/app/lib/actions/roadmap";
import type { RoadmapItem, RoadmapStatus } from "@/app/lib/types";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "See what we're building next for DiplomaHub and share your own ideas for the platform.",
};

// Description/tags/release-label copy stays static here — only status and
// completion_percentage are admin-editable (see /admin/roadmap), since those
// are the two fields that actually go stale as work progresses.
const ROADMAP_CONTENT: Record<
  string,
  {
    releaseLabel: string;
    description: string;
    tags: { label: string; icon: LucideIcon }[];
  }
> = {
  "ib-pro-status": {
    releaseLabel: "Released Sept 2026",
    description: `Developed a robust reputation system where users earn "Scholarly Cred" for likes, views, or downloads on their comments, discussions, or resources`,
    tags: [
      { label: "IB Pro badges", icon: Medal },
      { label: "XP Leaderboards", icon: Podium },
    ],
  },
  "ib-news": {
    releaseLabel: "Active development",
    description:
      "Launching the integrated news portal sourcing official updates from the IB organization.",
    tags: [
      { label: "Verifed Sources", icon: BadgeCheck },
      { label: "Quickly Updated", icon: Clock },
    ],
  },
  "university-section": {
    releaseLabel: "Estimated Jan 2027",
    description:
      "Brand new page for university resources, discussions and much more, tailored to IB students around the world.",
    tags: [],
  },
};

const STATUS_META: Record<
  RoadmapStatus,
  {
    icon: LucideIcon;
    railIconClass: string;
    labelClass: string;
    medalClass: string;
    cardClass: string;
    gapClass: string;
    titleClass: string;
    descriptionClass: string;
  }
> = {
  completed: {
    icon: Check,
    railIconClass: "p-1 bg-secondary rounded-xl text-on-primary",
    labelClass: "text-headline-md text-secondary uppercase rounded-xl",
    medalClass: "text-secondary ml-auto",
    cardClass:
      "bg-surface-container-lowest border-1 border-outline-variant hover:border-primary hover:drop-shadow-xl/10",
    gapClass: "gap-md",
    titleClass: "text-headline-lg font-serif font-bold",
    descriptionClass: "text-on-surface-container text-body-lg",
  },
  in_progress: {
    icon: WandSparkles,
    railIconClass: "p-1 bg-primary rounded-xl text-on-primary",
    labelClass: "text-headline-md text-primary uppercase rounded-xl",
    medalClass: "text-primary ml-auto",
    cardClass:
      "bg-surface-container-lowest border-1 border-outline-variant border-l-5 border-l-primary hover:border-primary hover:drop-shadow-xl/10",
    gapClass: "gap-gutter",
    titleClass: "text-headline-lg font-serif font-bold",
    descriptionClass: "text-on-surface-container text-body-lg",
  },
  planned: {
    icon: Clock,
    railIconClass: "p-1 bg-inverse-on-surface rounded-xl text-on-surface-variant",
    labelClass: "text-headline-md text-on-surface-variant uppercase rounded-xl",
    medalClass: "text-on-surface-variant ml-auto",
    cardClass:
      "bg-inverse-on-surface border-1 border-outline-variant hover:bg-surface-container-lowest hover:drop-shadow-xl/10",
    gapClass: "gap-md",
    titleClass: "text-headline-lg font-serif text-on-surface-variant font-bold",
    descriptionClass: "text-on-surface-variant text-body-lg",
  },
};

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const content = ROADMAP_CONTENT[item.id];
  const meta = STATUS_META[item.status];
  if (!content) return null;

  return (
    <div
      className={`flex flex-col w-full p-lg rounded-xl ${meta.gapClass} transition ${meta.cardClass}`}
    >
      <div className="justify-between flex flex-row items-center">
        <h1 className={meta.labelClass}>{content.releaseLabel}</h1>
        <Medal size={30} className={meta.medalClass} />
      </div>
      <h1 className={meta.titleClass}>{item.title}</h1>
      <h1 className={meta.descriptionClass}>{content.description}</h1>

      {item.status === "in_progress" && item.completion_percentage !== null && (
        <div className="flex flex-col gap-sm">
          <div className="flex flex-row justify-between text-body-lg">
            <h1 className="font-bold">Project Completion</h1>
            <h1 className="text-primary font-bold">
              {item.completion_percentage}%
            </h1>
          </div>
          <div className="bg-surface-container-low h-3 rounded-xl">
            <div
              className="h-full rounded-l-xl bg-primary"
              style={{ width: `${item.completion_percentage}%` }}
            />
          </div>
        </div>
      )}

      {content.tags.length > 0 && (
        <div className="gap-md flex flex-row flex-wrap items-center">
          {content.tags.map((tag) => (
            <div
              key={tag.label}
              className="rounded-xl p-md bg-surface-container-low flex flex-row gap-sm items-center"
            >
              <h1 className="text-primary text-body-lg">{tag.label}</h1>
              <tag.icon size={30} className="text-primary" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function Roadmap() {
  const result = await getRoadmapItems();
  const items = result.success ? result.data : [];

  return (
    <div className="flex flex-col px-md lg:px-[60px] py-margin bg-surface-container-low gap-gutter">
      <div className="pb-20 border-b-1 border-outline-variant flex flex-col gap-gutter">
        <h1 className="text-display-lg font-serif text-primary font-bold">
          Our Direction
        </h1>
        <h1 className="text-on-surface-variant text-body-lg w-full lg:w-170">
          Transparency and shared purpose drive DiplomaHub. Explore our public
          roadmap to see how we are evolving the platform for the international
          community.{" "}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-margin">
        <div className="w-full lg:w-90 flex flex-col gap-margin">
          <div className="flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-lg rounded-xl gap-5">
            <h1 className="font-serif text-headline-md font-bold border-b-1 border-outline-variant pb-5">
              Milestone Keys
            </h1>
            <div className="flex flex-row gap-sm items-center">
              <Check
                size={30}
                className="p-1 bg-secondary rounded-xl text-on-primary"
              />
              <h1 className="text-body-lg text-on-surface-variant">
                Completed
              </h1>
            </div>
            <div className="flex flex-row gap-sm items-center">
              <WandSparkles
                size={30}
                className="p-1 bg-primary rounded-xl text-on-primary"
              />
              <h1 className="text-body-lg text-on-surface-variant">
                In Progress
              </h1>
            </div>
            <div className="flex flex-row gap-sm items-center">
              <Clock
                size={30}
                className="p-1 bg-surface-container-low rounded-xl text-on-surface-variant"
              />
              <h1 className="text-body-lg text-on-surface-variant">Planned</h1>
            </div>
          </div>
          <div className="flex flex-col bg-primary p-lg rounded-xl gap-5">
            <h1 className="font-serif text-on-primary text-headline-lg">
              Help us shape the future
            </h1>
            <h1 className="text-on-primary text-body-lg">
              DiplomaHub is built by the community. Share your ideas for new
              features or tools you&apos;d love to see.
            </h1>
            <Link href="/feedback">
              <button className="py-sm px-lg bg-surface-container-lowest text-primary rounded-xl text-body-lg cursor-pointer hover:border-primary">
                Submit Feedback
              </button>
            </Link>
          </div>
        </div>
        <div className="flex flex-row gap-margin grow">
          <div className="hidden lg:flex flex-col gap-[300px]">
            {items.map((item, i) => {
              const meta = STATUS_META[item.status];
              return (
                <meta.icon
                  key={item.id}
                  size={30}
                  className={`${meta.railIconClass}${i === 1 ? " mb-12" : ""}`}
                />
              );
            })}
          </div>
          <div className="hidden lg:block w-0 border-l-5 border-outline-variant border-dotted h-240 " />
          <div className="flex flex-col gap-margin grow">
            {items.map((item) => (
              <RoadmapCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

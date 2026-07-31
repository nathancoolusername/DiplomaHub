import { Check, WandSparkles, Clock, Medal, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getRoadmapItems } from "@/app/lib/actions/roadmap";
import { ROADMAP_TAG_ICONS } from "@/components/roadmap/icons";
import type { RoadmapItem, RoadmapStatus } from "@/app/lib/types";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "See what we're building next for DiplomaHub and share your own ideas for the platform.",
  alternates: { canonical: "/roadmap" },
};

// Only the first 3 items (after sorting) are shown, so the page always
// reads as "what's done, what's active, what's next" rather than a long
// scrolling list.
const VISIBLE_COUNT = 3;
const STATUS_PRIORITY: Record<RoadmapStatus, number> = {
  completed: 0,
  in_progress: 1,
  planned: 2,
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
    railIconClass:
      "p-1 bg-inverse-on-surface rounded-xl text-on-surface-variant",
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
  const meta = STATUS_META[item.status];

  return (
    <div
      className={`flex flex-col w-full p-lg rounded-xl ${meta.gapClass} transition ${meta.cardClass}`}
    >
      <div className="justify-between flex flex-row items-center">
        <p className={meta.labelClass}>{item.release_label}</p>
        <Medal size={30} className={meta.medalClass} />
      </div>
      <h3 className={meta.titleClass}>{item.title}</h3>
      {item.description && (
        <p className={meta.descriptionClass}>{item.description}</p>
      )}

      {item.status === "in_progress" && item.completion_percentage !== null && (
        <div className="flex flex-col gap-sm">
          <div className="flex flex-row justify-between text-body-lg">
            <p className="font-bold">Project Completion</p>
            <p className="text-primary font-bold">
              {item.completion_percentage}%
            </p>
          </div>
          <div className="bg-surface-container-low h-3 rounded-xl">
            <div
              className="h-full rounded-l-xl bg-primary"
              style={{ width: `${item.completion_percentage}%` }}
            />
          </div>
        </div>
      )}

      {item.tags.length > 0 && (
        <div className="gap-md flex flex-row flex-wrap items-center">
          {item.tags.map((tag) => {
            const Icon = ROADMAP_TAG_ICONS[tag.icon];
            return (
              <div
                key={tag.label}
                className="rounded-xl p-md bg-surface-container-low flex flex-row gap-sm items-center"
              >
                <p className="text-primary text-body-lg">{tag.label}</p>
                {Icon && <Icon size={30} className="text-primary" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function Roadmap() {
  const result = await getRoadmapItems();
  const allItems = result.success ? result.data : [];

  // Completed first, then in-progress, then planned/"coming" — ties within
  // a status broken by the admin-set sort_order.
  const items = [...allItems]
    .sort((a, b) => {
      const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      return statusDiff !== 0 ? statusDiff : a.sort_order - b.sort_order;
    })
    .slice(0, VISIBLE_COUNT);

  return (
    <div className="flex flex-col px-md lg:px-[60px] py-margin bg-surface-container-low gap-gutter">
      <div className="pb-20 border-b-1 border-outline-variant flex flex-col gap-gutter">
        <h1 className="text-display-lg font-serif text-primary font-bold">
          Our Direction
        </h1>
        <p className="text-on-surface-variant text-body-lg w-full lg:w-170">
          Transparency and shared purpose drive DiplomaHub. Explore our public
          roadmap to see how we are evolving the platform for the international
          community.{" "}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-margin">
        <div className="w-full lg:w-90 flex flex-col gap-margin">
          <div className="flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-lg rounded-xl gap-5">
            <h2 className="font-serif text-headline-md font-bold border-b-1 border-outline-variant pb-5">
              Milestone Keys
            </h2>
            <div className="flex flex-row gap-sm items-center">
              <Check
                size={30}
                className="p-1 bg-secondary rounded-xl text-on-primary"
              />
              <p className="text-body-lg text-on-surface-variant">Completed</p>
            </div>
            <div className="flex flex-row gap-sm items-center">
              <WandSparkles
                size={30}
                className="p-1 bg-primary rounded-xl text-on-primary"
              />
              <p className="text-body-lg text-on-surface-variant">
                In Progress
              </p>
            </div>
            <div className="flex flex-row gap-sm items-center">
              <Clock
                size={30}
                className="p-1 bg-surface-container-low rounded-xl text-on-surface-variant"
              />
              <p className="text-body-lg text-on-surface-variant">Planned</p>
            </div>
          </div>
          <div className="flex flex-col bg-primary p-lg rounded-xl gap-5">
            <h2 className="font-serif text-on-primary text-headline-lg">
              Help us shape the future
            </h2>
            <p className="text-on-primary text-body-lg">
              DiplomaHub is built by the community. Share your ideas for new
              features or tools you&apos;d love to see.
            </p>
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

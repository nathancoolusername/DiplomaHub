import Link from "next/link";
import { MoveUpRight } from "lucide-react";
import type { TopContributor } from "@/app/lib/actions/profile";
import { Avatar } from "@/components/avatar";

export default function TopContributorsHome({
  contributors,
}: {
  contributors: TopContributor[];
}) {
  if (contributors.length === 0) return null;

  return (
    <div className="bg-surface-container-low min-h-fit flex flex-col px-md lg:px-30 py-lg gap-gutter">
      <div className="bg-primary text-on-primary px-sm py-sm rounded text-label-md w-fit">
        <p>Community Leaders</p>
      </div>
      <div className="flex flex-col gap-sm lg:w-150">
        <h2 className="text-headline-lg font-serif font-bold">
          Top Contributors
        </h2>
        <p className="text-on-surface-variant text-body-lg">
          The most active members earning points for resources, articles, and
          discussions shared with the community.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-margin">
        {contributors.map((contributor, i) => (
          <Link
            key={contributor.id}
            href={`/profile/${contributor.id}`}
            className="flex flex-col items-center text-center gap-sm bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-lg hover:border-primary hover:drop-shadow-xl/10 transition"
          >
            <div className="relative">
              <Avatar
                src={contributor.avatar_url}
                name={contributor.display_name}
                size={72}
              />
              <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-on-primary text-label-md font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <p className="font-bold text-body-lg">
              {contributor.display_name}
            </p>
            <p className="text-on-surface-variant text-label-md">
              {contributor.points.toLocaleString()} XP
            </p>
            {contributor.is_pro && (
              <span className="text-label-sm bg-primary-container text-on-primary px-sm py-1 rounded-md font-semibold">
                Diploma Pro
              </span>
            )}
          </Link>
        ))}
      </div>

      <Link
        href="/leaderboard"
        className="flex flex-row items-center gap-sm self-start hover:border-b-1 border-primary transition w-fit"
      >
        <span className="text-primary font-bold">View Full Leaderboard</span>
        <MoveUpRight />
      </Link>
    </div>
  );
}

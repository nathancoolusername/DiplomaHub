import Link from "next/link";
import { ChevronRight, Flag, Timer } from "lucide-react";
import { FortyFiveMark } from "@/components/forty-five/FortyFiveMark";

const GAMES = [
  { href: "/forty-five", name: "Forty-Five", note: "Daily puzzle", icon: <FortyFiveMark />, box: "bg-surface-container-high" },
  { href: "/flags", name: "Flags", note: "Daily sprint", icon: <Flag size={16} />, box: "bg-secondary-container text-on-secondary-container" },
  { href: "/play/deadline", name: "Deadline", note: "With friends", icon: <Timer size={16} />, box: "bg-error-container text-on-error-container" },
];

/** Games on Home: one tap to each of them. */
export function GamesCard() {
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex flex-col gap-sm" aria-labelledby="home-games">
      <div className="flex items-center justify-between gap-md">
        <h2 id="home-games" className="font-semibold text-on-surface">
          Games
        </h2>
        <Link href="/games" className="inline-flex items-center gap-0.5 text-label-md font-semibold text-primary hover:underline">
          All games <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
        {GAMES.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className="group h-full rounded-xl border border-outline-variant px-md py-sm flex items-center gap-sm hover:border-primary">
              <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${g.box}`} aria-hidden="true">
                {g.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-on-surface group-hover:text-primary">{g.name}</span>
                <span className="block text-label-md text-on-surface-variant">{g.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { Timer, Trophy } from "lucide-react";
import type { SquadDeadline } from "@/lib/data";
import { SquadGameButton } from "./PlayStart";

/** On a squad's page: its open Deadline games (one tap to join), wins, and Start a game. */
export function SquadDeadlineCard({ squadId, deadline, members }: {
  squadId: string;
  deadline: SquadDeadline;
  members: { userId: string; displayName: string; isMe: boolean }[];
}) {
  const ranked = members
    .map((m) => ({ ...m, ...(deadline.wins.get(m.userId) ?? { week: 0, all: 0 }) }))
    .filter((m) => m.all > 0)
    .sort((a, b) => b.week - a.week || b.all - a.all);
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex flex-col gap-md" aria-labelledby="sq-deadline">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 id="sq-deadline" className="inline-flex items-center gap-xs font-serif font-bold text-headline-md text-on-surface">
          <Timer size={20} className="text-primary" aria-hidden="true" />Deadline
        </h2>
        <SquadGameButton squadId={squadId} />
      </div>

      {deadline.rooms.length > 0 && (
        <ul className="flex flex-col gap-xs" aria-label="Games open now">
          {deadline.rooms.map((r) => (
            <li key={r.code} className="flex flex-wrap items-center justify-between gap-sm rounded-xl bg-primary/10 px-md py-sm">
              <span className="text-body-md text-on-surface">
                <span className="mr-xs inline-block h-2 w-2 rounded-full bg-secondary align-middle" aria-hidden="true" />
                <strong>{r.host ?? "Someone"}</strong>&apos;s game · {r.players} in · {r.status === "playing" ? "playing now" : "in the lobby"}
              </span>
              <Link href={`/play/deadline/${r.code}?via=squad`} className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold">
                {r.inRoom ? "Back to the game" : r.status === "playing" ? "Join (next game)" : "Join"}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ranked.length > 0 ? (
        <ol className="flex flex-col divide-y divide-outline-variant" aria-label="Deadline wins">
          {ranked.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-sm py-xs text-body-md">
              <span className={`font-semibold ${m.isMe ? "text-primary" : "text-on-surface"}`}>{m.isMe ? "You" : m.displayName}</span>
              <span className="inline-flex items-center gap-sm text-on-surface-variant tabular-nums">
                <span title="Wins this week"><Trophy size={13} className="inline -mt-0.5 text-tertiary" aria-hidden="true" /> {m.week} this week</span>
                <span className="text-label-md">{m.all} all time</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-body-md text-on-surface-variant">Nobody here has won a Deadline game yet.</p>
      )}
    </section>
  );
}

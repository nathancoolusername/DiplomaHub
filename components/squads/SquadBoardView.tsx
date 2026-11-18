"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check, Crown, Link2, LogOut, PenLine, RefreshCw, UserMinus, X } from "lucide-react";
import type { SquadBoard } from "@/lib/data";
import { leaveSquadAction, newSquadCodeAction, removeSquadMemberAction, renameSquadAction } from "@/app/squads/actions";
import { Avatar } from "@/components/avatar";
import { Spinner } from "@/components/spinner";
import { links } from "@/lib/practice/links";
import { formatTime } from "@/lib/forty-five/dates";
import { FortyFiveMark } from "@/components/forty-five/FortyFiveMark";

const ghost = "inline-flex items-center gap-xs rounded-lg px-md py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer disabled:opacity-50";

/** A squad's weekly board: rank by practice points, plus marks won back, Sunday Reset and topics practised. */
export function SquadBoardView({ board }: { board: SquadBoard }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const top = Math.max(1, ...board.members.map((m) => m.points));
  const week = board.period === "week";
  const joinUrl = typeof window === "undefined" ? `/squads/join/${board.code}` : `${window.location.origin}/squads/join/${board.code}`;

  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    start(async () => {
      setError(null);
      try {
        await fn();
        after?.();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });

  // Just the invite link, copied: paste it anywhere (it opens the join form with the code filled in).
  const share = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the invite link:", joinUrl);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        {renaming !== null ? (
          <form
            className="flex items-center gap-sm"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => renameSquadAction(board.id, renaming), () => setRenaming(null));
            }}
          >
            <input
              autoFocus
              value={renaming}
              maxLength={40}
              onChange={(e) => setRenaming(e.target.value)}
              aria-label="Squad name"
              className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface px-md py-sm font-serif font-bold text-headline-md text-on-surface"
            />
            <button type="submit" disabled={busy} aria-label="Save name" className="p-sm rounded-lg text-primary hover:bg-primary/10 cursor-pointer">
              {busy ? <Spinner size={16} /> : <Check size={18} />}
            </button>
            <button type="button" onClick={() => setRenaming(null)} aria-label="Cancel" className="p-sm rounded-lg text-on-surface-variant cursor-pointer">
              <X size={18} />
            </button>
          </form>
        ) : (
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface flex items-center gap-sm">
            {board.name}
            {board.isOwner && (
              <button type="button" onClick={() => setRenaming(board.name)} aria-label="Rename the squad" title="Rename" className="p-xs rounded-lg text-on-surface-variant hover:text-primary cursor-pointer">
                <PenLine size={18} />
              </button>
            )}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-sm">
          <span className="rounded-xl bg-surface-container-lowest border border-outline-variant px-md py-xs font-mono text-body-lg tracking-[0.25em] text-on-surface">{board.code}</span>
          <button type="button" onClick={share} className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer">
            {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />} {copied ? "Link copied" : "Copy invite link"}
          </button>
          <span className="text-label-md text-on-surface-variant">
            {board.members.length} of 15 members
          </span>
        </div>
      </header>

      {/* The board */}
      <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-sm" aria-label={week ? "This week's board" : "All-time board"}>
        <div className="flex items-center justify-between gap-sm pb-xs">
          <div role="tablist" aria-label="Period" className="inline-flex rounded-full border border-outline-variant p-0.5">
            {(["week", "all"] as const).map((p) => (
              <Link
                key={p}
                role="tab"
                aria-selected={board.period === p}
                href={p === "week" ? `/squads/${board.id}` : `/squads/${board.id}?period=all`}
                scroll={false}
                className={`whitespace-nowrap rounded-full px-md py-xs text-label-md font-semibold ${board.period === p ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
              >
                {p === "week" ? "This week" : "All time"}
              </Link>
            ))}
          </div>
          <Link href="/forty-five" className="inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline">
            <FortyFiveMark /> <span className="whitespace-nowrap"><span className="hidden sm:inline">Today&apos;s </span>Forty-Five</span>
          </Link>
        </div>
        <div className="hidden sm:grid grid-cols-[1.5rem_1fr_7rem_4rem_4.5rem_3.5rem] gap-sm px-sm text-label-sm text-on-surface-variant">
          <span />
          <span>Member</span>
          <span>Points</span>
          <span className="text-right">Won back</span>
          <span className="text-right" title={week ? "Forty-Five: today's score" : "Forty-Five: all-time total"}>
            {week ? "45 today" : "45 total"}
          </span>
          <span className="text-right">{week ? "Reset" : "Weeks"}</span>
        </div>
        <ol className="flex flex-col gap-xs">
          {board.members.map((m, i) => (
            <li key={m.userId} className={`rounded-2xl px-sm py-sm flex flex-col gap-xs ${m.isMe ? "bg-primary-fixed" : ""}`}>
              <div className="grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_7rem_4rem_4.5rem_3.5rem] items-center gap-sm">
                <span className="text-label-md font-bold text-on-surface-variant tabular-nums">{i + 1}</span>
                <span className="flex items-center gap-sm min-w-0">
                  <Avatar src={m.avatarUrl} name={m.displayName} size={32} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-xs text-body-md font-semibold text-on-surface truncate">
                      {m.isMe ? "You" : m.displayName}
                      {m.isOwner && <Crown size={12} className="text-primary shrink-0" aria-label="Made the squad" />}
                    </span>
                    {/* Phones: the numbers sit under the name. */}
                    <span className="sm:hidden block text-label-sm text-on-surface-variant tabular-nums">
                      {m.points} pts · {m.wonBack} won back · {week ? (m.ffToday ? `45: ${m.ffToday.score} today` : "45: not yet") : `45: ${m.ffTotal}`}
                      {week ? (m.resetDone ? " · week planned" : "") : ` · ${m.resets} weeks planned`}
                    </span>
                  </span>
                </span>
                <span className="hidden sm:flex items-center gap-xs">
                  <span className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(m.points / top) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right text-label-md font-bold tabular-nums text-on-surface">{m.points}</span>
                </span>
                <span className="hidden sm:block text-right text-label-md font-bold tabular-nums text-on-surface">{m.wonBack}</span>
                <span className="hidden sm:block text-right text-label-md tabular-nums text-on-surface" title={week && m.ffToday ? `in ${formatTime(m.ffToday.seconds)}` : undefined}>
                  {week ? (m.ffToday ? <span className="font-bold">{m.ffToday.score}</span> : <span className="text-on-surface-variant">–</span>) : <span className="font-bold">{m.ffTotal}</span>}
                </span>
                <span className="hidden sm:flex justify-end text-label-md tabular-nums">
                  {week ? (
                    m.resetDone ? <CalendarCheck size={18} className="text-primary" aria-label="Planned their week" /> : <span className="text-on-surface-variant">–</span>
                  ) : (
                    <span className="font-bold text-on-surface">{m.resets}</span>
                  )}
                </span>
                {board.isOwner && !m.isMe && (
                  <button
                    type="button"
                    onClick={() => confirm(`Remove ${m.displayName} from ${board.name}?`) && run(() => removeSquadMemberAction(board.id, m.userId))}
                    aria-label={`Remove ${m.displayName}`}
                    title="Remove from squad"
                    className="sm:hidden p-xs rounded-lg text-on-surface-variant hover:text-error cursor-pointer"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
              {(m.practised.length > 0 || (board.isOwner && !m.isMe)) && (
                <div className="flex flex-wrap items-center gap-xs pl-[2.25rem]">
                  {m.practised.map((p) =>
                    m.isMe ? (
                      <span key={`${p.subjectId}:${p.subtopicCode}`} className="rounded-full bg-surface-container px-sm py-px text-label-sm text-on-surface-variant">
                        {p.topic} · {p.subjectName}
                      </span>
                    ) : (
                      // A friend's topic: one tap to practise it too.
                      <Link
                        key={`${p.subjectId}:${p.subtopicCode}`}
                        href={links.build(p.subjectId, "mcq_short", [p.subtopicCode])}
                        title={`Practise ${p.topic} too`}
                        className="rounded-full bg-surface-container px-sm py-px text-label-sm text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed"
                      >
                        {p.topic} · {p.subjectName}
                      </Link>
                    ),
                  )}
                  {board.isOwner && !m.isMe && (
                    <button
                      type="button"
                      onClick={() => confirm(`Remove ${m.displayName} from ${board.name}?`) && run(() => removeSquadMemberAction(board.id, m.userId))}
                      className="hidden sm:inline-flex ml-auto items-center gap-xs text-label-sm text-on-surface-variant hover:text-error cursor-pointer"
                    >
                      <UserMinus size={12} aria-hidden="true" /> Remove
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
        {board.members.length === 1 && (
          <p className="text-body-md text-on-surface-variant px-sm">Just you so far. Send the code to a few friends and the board fills up.</p>
        )}
        <p className="text-label-sm text-on-surface-variant px-sm pt-xs">
          Points: 1 per mark plus time practised. Won back: lost marks you later got right on a different question. 45: the daily Forty-Five.
          {week ? " Tap a friend's topic to practise it too. The week resets on Monday." : ""}
        </p>
      </section>

      {error && <p className="text-label-md text-error">{error}</p>}
      <div className="flex flex-wrap gap-sm">
        {board.isOwner && (
          <button
            type="button"
            disabled={busy}
            onClick={() => confirm("Make a new code? The old code and link stop working.") && run(() => newSquadCodeAction(board.id))}
            className={ghost}
          >
            <RefreshCw size={14} aria-hidden="true" /> New code
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            confirm(board.members.length === 1 ? "Leave and delete this squad?" : `Leave ${board.name}?`) &&
            start(async () => {
              try {
                await leaveSquadAction(board.id);
                router.push("/squads");
              } catch {
                setError("Couldn't leave just now");
              }
            })
          }
          className={ghost}
        >
          <LogOut size={14} aria-hidden="true" /> Leave squad
        </button>
      </div>
    </div>
  );
}

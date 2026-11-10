"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Shuffle, ThumbsDown, ThumbsUp, Trophy, X } from "lucide-react";
import { FORTY_FIVE } from "@/lib/forty-five/config";
import { TIERS, type Tier } from "@/lib/forty-five/tiers";
import type { BoardRow, GuessResponse, MyStats, PlayView, PublicGroup, TodayPuzzle } from "@/lib/forty-five/types";
import type { GuessRecord } from "@/lib/forty-five/engine";
import { formatTime } from "@/lib/forty-five/dates";

type Reaction = "like" | "dislike" | null;

type Summary = {
  board: { total: number; rows: BoardRow[] };
  standing: { rank: number | null; hidden: boolean } | null;
  stats: MyStats | null;
  reaction?: Reaction;
  likes?: number;
};

type GuestSave = { log: string[][]; play: PlayView; startedAt: number; finishedAt: number | null };

const EMPTY: PlayView = { guesses: [], mistakes: 0, solved: [], finished: false, won: false, score: null, seconds: null, reveal: null };
const norm = (w: string) => w.trim().toLowerCase();

/** A random id this browser keeps, so a guest's finish and 👍/👎 count once (insights only; never shown). */
function guestId(): string | undefined {
  try {
    let id = localStorage.getItem("forty-five:guest-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("forty-five:guest-id", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Phone tile font: long single words shrink a little so they fit a quarter of the screen. */
function tileFont(word: string): string {
  const longest = Math.max(...word.split(/[\s-]+/).map((t) => t.length));
  return longest <= 6 ? "15px" : longest <= 8 ? "13.5px" : longest <= 9 ? "12.5px" : "11.5px";
}

/** A soft hyphen near the middle of long words, so a forced break reads "Nucleo-synthesis". */
function softHyphens(word: string): string {
  return word
    .split(" ")
    .map((t) => {
      if (t.length < 10 || t.includes("-")) return t;
      const mid = Math.floor(t.length / 2);
      const v = (c: string | undefined) => !!c && /[aeiouy]/i.test(c);
      // Prefer vowel | consonant-vowel ("Extra-version"), nearest the middle, at least 3 letters each side.
      for (let d = 0; d <= mid; d++)
        for (const i of [mid + d, mid - d])
          if (i >= 3 && i <= t.length - 3 && v(t[i - 1]) && !v(t[i]) && v(t[i + 1])) return `${t.slice(0, i)}\u00AD${t.slice(i)}`;
      return `${t.slice(0, mid)}\u00AD${t.slice(mid)}`;
    })
    .join(" ");
}

function liveScore(play: PlayView): number {
  return play.finished && play.score != null ? play.score : Math.max(0, FORTY_FIVE.startScore - FORTY_FIVE.mistakePenalty * play.mistakes);
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shareText(number: number, play: PlayView, seconds: number | null, url: string): string {
  const tier = new Map((play.reveal ?? []).flatMap((g) => g.words.map((w) => [norm(w), g.difficulty as Tier] as const)));
  const rows = play.guesses.map((g: GuessRecord) => g.words.map((w) => TIERS[tier.get(norm(w)) ?? 1].square).join("")).join("\n");
  return `Forty-Five #${number} — ${play.score ?? 0}/${FORTY_FIVE.startScore} in ${formatTime(seconds)}\n${rows}\n${url}`;
}

export function Game({ puzzle, signedIn, api = "/api/forty-five" }: { puzzle: TodayPuzzle; signedIn: boolean; api?: string }) {
  const storageKey = `forty-five:${puzzle.puzzleId}`;
  const [order, setOrder] = useState<string[]>(puzzle.words);
  const [selected, setSelected] = useState<string[]>([]);
  const [play, setPlay] = useState<PlayView>(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [guestTimes, setGuestTimes] = useState<{ startedAt: number; finishedAt: number | null } | null>(null);
  const [fresh, setFresh] = useState<number | null>(null); // difficulty just solved, to animate
  const [loadError, setLoadError] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Load: signed in → the server play (first open starts the clock); guest → localStorage.
  useEffect(() => {
    let cancelled = false;
    if (signedIn) {
      fetch(`${api}/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(async (r) => {
          if (cancelled) return;
          if (r.status === 401) return setLoadError("Your session has ended. Log in again to play.");
          if (!r.ok) return setLoadError("Couldn't load your game. Refresh to try again.");
          const data = (await r.json()) as { play: PlayView; puzzle: TodayPuzzle };
          if (data.puzzle.puzzleId !== puzzle.puzzleId) return setLoadError("A new puzzle is out. Refresh to play it.");
          setPlay(data.play);
          setReady(true);
        })
        .catch(() => !cancelled && setLoadError("Couldn't reach DiplomaHub. Check your connection and refresh."));
    } else {
      let save: GuestSave | null = null;
      try {
        save = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      } catch {}
      const s = save ?? { log: [], play: EMPTY, startedAt: Date.now(), finishedAt: null };
      if (!save) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(s));
        } catch {}
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring saved state on mount
      setPlay(s.play);
      setGuestTimes({ startedAt: s.startedAt, finishedAt: s.finishedAt });
      setReady(true);
    }
    return () => {
      cancelled = true;
    };
  }, [signedIn, storageKey, puzzle.puzzleId, api]);

  const solvedWords = useMemo(() => new Set(play.solved.flatMap((g) => g.words.map(norm))), [play.solved]);
  const remaining = order.filter((w) => !solvedWords.has(norm(w)));
  const unsolved: PublicGroup[] = play.finished ? (play.reveal ?? []).filter((g) => !play.solved.some((s) => s.difficulty === g.difficulty)) : [];
  const seconds = signedIn ? play.seconds : guestTimes?.finishedAt ? Math.round((guestTimes.finishedAt - guestTimes.startedAt) / 1000) : null;

  const toggle = (w: string) => {
    if (play.finished || !ready) return;
    setSelected((s) => (s.includes(w) ? s.filter((x) => x !== w) : s.length < 4 ? [...s, w] : s));
  };

  const submit = async () => {
    if (selected.length !== 4 || busy || play.finished) return;
    setBusy(true);
    let save: GuestSave | null = null;
    if (!signedIn) {
      try {
        save = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      } catch {}
    }
    const body = signedIn
      ? { puzzleId: puzzle.puzzleId, words: selected, expected: play.guesses.length }
      : { puzzleId: puzzle.puzzleId, words: selected, log: save?.log ?? play.guesses.map((g) => g.words), guestId: guestId() };
    try {
      const res = await fetch(`${api}/guess`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const r = (await res.json()) as GuessResponse;
      if (!r.ok) {
        if (r.play) setPlay(r.play);
        const msg: Record<string, string> = {
          repeat: "You've already tried those four.",
          stale: "Your game was updated in another tab. Synced.",
          finished: "This game is already over.",
          no_puzzle: "A new puzzle is out. Refresh to play it.",
          rate_limited: "Slow down a little and try again.",
          invalid: "Pick four words from the grid.",
          error: "Something went wrong. Try again.",
        };
        flash(msg[r.reason] ?? msg.error);
        if (r.reason === "stale" || r.reason === "finished") setSelected([]);
        return;
      }
      if (r.result === "correct" && r.group) {
        setFresh(r.group.difficulty);
        setSelected([]);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        flash(r.result === "one_away" ? "One away…" : `Not a group. −${FORTY_FIVE.mistakePenalty} points`);
      }
      setPlay(r.play);
      if (!signedIn) {
        const finishedAt = r.play.finished ? Date.now() : null;
        const next: GuestSave = {
          log: [...(save?.log ?? []), selected],
          play: r.play,
          startedAt: save?.startedAt ?? guestTimes?.startedAt ?? Date.now(),
          finishedAt,
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        setGuestTimes({ startedAt: next.startedAt, finishedAt });
      }
    } catch {
      flash("Couldn't reach DiplomaHub. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <p role="alert" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg text-body-md text-on-surface">
        {loadError}{" "}
        {loadError.includes("Log in") && (
          <Link href="/login?next=/forty-five" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        )}
      </p>
    );
  }

  const lives = FORTY_FIVE.maxMistakes - play.mistakes;

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between gap-md text-body-md">
        <p className="tabular-nums">
          <span className="font-serif font-bold text-headline-md text-on-surface">{liveScore(play)}</span>
          <span className="text-on-surface-variant"> / {FORTY_FIVE.startScore}</span>
        </p>
        <p className="flex items-center gap-xs text-on-surface-variant" aria-label={`${lives} wrong guesses left`}>
          <span className="text-label-md">Lives</span>
          {Array.from({ length: FORTY_FIVE.maxMistakes }, (_, i) => (
            <span key={i} aria-hidden="true" className={`h-3 w-3 rounded-[3px] rotate-45 ${i < lives ? "bg-primary" : "bg-outline-variant"}`} />
          ))}
        </p>
      </div>

      <div className="flex flex-col gap-xs" aria-live="polite">
        {play.solved.map((g) => (
          <SolvedRow key={g.difficulty} group={g} animate={fresh === g.difficulty} />
        ))}
        {unsolved.map((g) => (
          <SolvedRow key={g.difficulty} group={g} animate missed />
        ))}
      </div>

      {!play.finished && (
        <>
          <div className={`grid grid-cols-4 gap-1.5 sm:gap-sm ${shake ? "ff-shake" : ""}`} role="group" aria-label="Words">
            {remaining.map((w) => {
              const on = selected.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggle(w)}
                  aria-pressed={on}
                  disabled={!ready}
                  style={{ "--tile-fs": tileFont(w) } as React.CSSProperties}
                  className={`min-h-20 sm:min-h-24 rounded-xl px-1.5 py-sm text-(length:--tile-fs) sm:text-body-lg font-bold leading-snug break-words transition-colors cursor-pointer select-none disabled:opacity-60 ${
                    on ? "bg-primary text-on-primary scale-[0.97]" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  lang="en"
                  aria-label={w}
                >
                  {softHyphens(w)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-sm">
            <button type="button" onClick={() => setOrder((o) => shuffle(o))} disabled={!ready} className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface cursor-pointer disabled:opacity-50">
              <Shuffle size={16} aria-hidden="true" /> Shuffle
            </button>
            <button type="button" onClick={() => setSelected([])} disabled={!selected.length} className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface cursor-pointer disabled:opacity-50">
              <X size={16} aria-hidden="true" /> Clear
            </button>
            <button type="button" onClick={submit} disabled={selected.length !== 4 || busy || !ready} className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-lg py-sm text-label-md font-semibold cursor-pointer disabled:opacity-50">
              <Check size={16} aria-hidden="true" /> {busy ? "Checking…" : "Check"}
            </button>
          </div>
        </>
      )}

      <div aria-live="assertive" className="h-6 text-center">
        {toast && <span className="inline-block rounded-full bg-on-surface text-surface px-md py-0.5 text-label-md font-semibold">{toast}</span>}
      </div>

      {play.finished && <EndScreen puzzleId={puzzle.puzzleId} number={puzzle.number} play={play} seconds={seconds} signedIn={signedIn} nextResetAt={puzzle.nextResetAt} api={api} />}
    </div>
  );
}

function SolvedRow({ group, animate, missed = false }: { group: PublicGroup; animate?: boolean; missed?: boolean }) {
  const t = TIERS[group.difficulty];
  return (
    <div className={`rounded-xl px-md py-sm text-center ${t.bg} ${t.text} ${animate ? "ff-solve" : ""}`}>
      <p className="text-label-sm font-semibold uppercase tracking-wide opacity-90">
        {t.name}
        {missed ? " · missed" : ""}
      </p>
      <p className="font-serif font-bold text-body-lg">{group.label}</p>
      <p className="text-body-md font-semibold">{group.words.join(", ")}</p>
      <p className="text-label-md opacity-90 mt-0.5">{group.explanation}</p>
    </div>
  );
}

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock only after mount (no hydration mismatch)
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now == null) return <span className="tabular-nums">–:–:–</span>;
  const left = Math.max(0, Math.round((Date.parse(to) - now) / 1000));
  if (left === 0) return <span>now. Refresh!</span>;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return <span className="tabular-nums">{`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`}</span>;
}

function EndScreen({ puzzleId, number, play, seconds, signedIn, nextResetAt, api }: { puzzleId: string; number: number; play: PlayView; seconds: number | null; signedIn: boolean; nextResetAt: string; api: string }) {
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${api}/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && d && setSummary(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api]);

  const share = async () => {
    const text = shareText(number, play, seconds, `${window.location.origin}/forty-five`);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your result:", text);
    }
  };

  return (
    <section aria-label="Result" className="flex flex-col gap-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg ff-solve">
      <div className="text-center flex flex-col gap-xs">
        <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">{play.won ? (play.mistakes === 0 ? "Flawless" : "Solved") : "Out of lives"}</p>
        <p className="font-serif font-bold text-display-lg text-on-surface tabular-nums">
          {play.score}
          <span className="text-headline-md text-on-surface-variant">/{FORTY_FIVE.startScore}</span>
        </p>
        <p className="text-body-md text-on-surface-variant tabular-nums">
          {seconds != null ? `in ${formatTime(seconds)}` : ""}
          {signedIn && summary?.standing?.rank ? ` · #${summary.standing.rank} today` : ""}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-sm">
        <button type="button" onClick={share} className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-lg py-sm text-label-md font-semibold cursor-pointer">
          <Copy size={16} aria-hidden="true" /> {copied ? "Copied!" : "Share result"}
        </button>
      </div>
      <LikeButtons puzzleId={puzzleId} signedIn={signedIn} api={api} fromServer={summary ? (summary.reaction ?? null) : undefined} likes={summary?.likes} />
      <p className="text-center text-body-md text-on-surface-variant">
        Next puzzle in <Countdown to={nextResetAt} />
      </p>

      {!signedIn && (
        <div className="rounded-xl bg-primary-fixed/50 border border-primary/30 p-md text-center flex flex-col gap-sm items-center">
          <p className="text-body-md font-semibold text-on-surface">Sign in to keep your stats, build your streak and get on the leaderboard.</p>
          <div className="flex gap-sm">
            <Link href="/signup?next=/forty-five" className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold">
              Create a free account
            </Link>
            <Link href="/login?next=/forty-five" className="rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface">
              Log in
            </Link>
          </div>
          <p className="text-label-sm text-on-surface-variant">Today&apos;s game stays a guest game; your next one counts.</p>
        </div>
      )}

      {signedIn && summary?.stats && <Stats stats={summary.stats} today={play.score} />}

      <div className="flex flex-col gap-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-body-lg text-on-surface flex items-center gap-xs">
            <Trophy size={18} aria-hidden="true" /> Today&apos;s top 10
          </h2>
          <Link href="/leaderboard?period=forty-five" className="text-label-md font-semibold text-primary hover:underline">
            Full leaderboard →
          </Link>
        </div>
        {!summary ? (
          <p className="text-label-md text-on-surface-variant">Loading…</p>
        ) : summary.board.rows.length === 0 ? (
          <p className="text-label-md text-on-surface-variant">Nobody&apos;s on today&apos;s board yet.</p>
        ) : (
          <ol className="divide-y divide-outline-variant rounded-xl border border-outline-variant overflow-hidden">
            {summary.board.rows.map((r) => (
              <li key={`${r.rank}-${r.name}`} className={`flex items-center gap-sm px-md py-xs text-body-md ${r.isMe ? "bg-primary-fixed/40" : ""}`}>
                <span className="w-6 text-on-surface-variant tabular-nums">{r.rank}</span>
                <span className="flex-1 min-w-0 truncate font-semibold text-on-surface">
                  {r.name}
                  {r.isMe && <span className="ml-xs font-normal text-label-sm text-on-surface-variant">(you)</span>}
                </span>
                <span className="tabular-nums font-semibold text-on-surface">{r.score}</span>
                <span className="w-14 text-right tabular-nums text-on-surface-variant">{formatTime(r.seconds)}</span>
              </li>
            ))}
          </ol>
        )}
        {signedIn && summary?.standing?.hidden && <p className="text-label-sm text-on-surface-variant">You&apos;re hidden from leaderboards (change it on the leaderboard page).</p>}
      </div>
    </section>
  );
}

function guestLog(puzzleId: string): string[][] {
  try {
    return (JSON.parse(localStorage.getItem(`forty-five:${puzzleId}`) ?? "null") as GuestSave | null)?.log ?? [];
  } catch {
    return [];
  }
}

/** 👍 / 👎 on today's puzzle. Signed in: the server remembers; guests: this browser does. Tap again to take it back. */
function LikeButtons({ puzzleId, signedIn, api, fromServer, likes }: { puzzleId: string; signedIn: boolean; api: string; fromServer: Reaction | undefined; likes: number | undefined }) {
  const key = `forty-five:reaction:${puzzleId}`;
  const [mine, setMine] = useState<Reaction>(null);
  // The summary's count already includes the player's saved like; adjust it as they change their mind.
  const [saved, setSaved] = useState<Reaction | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (signedIn) {
      if (fromServer !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the summary fetch
        setMine(fromServer);
        setSaved(fromServer);
      }
      return;
    }
    try {
      const s = localStorage.getItem(key);
      const r: Reaction = s === "like" || s === "dislike" ? s : null;
      setMine(r);
      setSaved(r);
    } catch {}
  }, [signedIn, fromServer, key]);

  const choose = async (r: "like" | "dislike") => {
    const before = mine;
    const next: Reaction = mine === r ? null : r;
    setMine(next);
    setFailed(false);
    try {
      const res = await fetch(`${api}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, reaction: next, ...(signedIn ? {} : { guestId: guestId(), log: guestLog(puzzleId) }) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      if (!signedIn) {
        try {
          if (next) localStorage.setItem(key, next);
          else localStorage.removeItem(key);
        } catch {}
      }
    } catch {
      setMine(before);
      setFailed(true);
    }
  };

  const btn = (r: "like" | "dislike", on: boolean) =>
    `inline-flex items-center gap-xs rounded-full border px-md py-xs text-label-md font-semibold cursor-pointer transition-colors ${
      on ? (r === "like" ? "bg-ff-1 text-on-ff-1 border-transparent" : "bg-ff-4 text-on-ff-4 border-transparent") : "border-outline-variant text-on-surface hover:bg-surface-container"
    }`;

  return (
    <div className="flex flex-col items-center gap-xs">
      <p className="text-body-md font-semibold text-on-surface" id="ff-like-q">
        {mine === "like" ? "Glad you liked it!" : mine === "dislike" ? "Thanks, we'll use that." : "Did you like today's puzzle?"}
      </p>
      <div className="flex gap-sm" role="group" aria-labelledby="ff-like-q">
        <button type="button" onClick={() => choose("like")} aria-pressed={mine === "like"} className={btn("like", mine === "like")}>
          <ThumbsUp size={16} aria-hidden="true" /> Liked it
        </button>
        <button type="button" onClick={() => choose("dislike")} aria-pressed={mine === "dislike"} className={btn("dislike", mine === "dislike")}>
          <ThumbsDown size={16} aria-hidden="true" /> Not for me
        </button>
      </div>
      {likes !== undefined && saved !== undefined && (() => {
        const total = Math.max(0, likes - (saved === "like" ? 1 : 0) + (mine === "like" ? 1 : 0));
        return (
          <p className="text-label-md text-on-surface-variant tabular-nums">
            {total === 0 ? "Be the first to like today's puzzle." : `${total.toLocaleString()} ${total === 1 ? "player likes" : "players like"} today's puzzle`}
          </p>
        );
      })()}
      {failed && <p className="text-label-sm text-on-surface-variant">Couldn&apos;t save that. Try again.</p>}
    </div>
  );
}

function Stats({ stats, today }: { stats: MyStats; today: number | null }) {
  const max = Math.max(1, ...stats.distribution.map((d) => d.count));
  return (
    <div className="flex flex-col gap-sm">
      <dl className="grid grid-cols-4 gap-xs text-center">
        {[
          ["Played", stats.played],
          ["Average", stats.average ?? "–"],
          ["Streak", stats.streak],
          ["Best streak", stats.maxStreak],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-surface-container p-xs">
            <dd className="font-serif font-bold text-headline-md text-on-surface tabular-nums">{v}</dd>
            <dt className="text-label-sm text-on-surface-variant">{k}</dt>
          </div>
        ))}
      </dl>
      {stats.distribution.length > 0 && (
        <div className="flex flex-col gap-0.5" aria-label="Score distribution">
          {stats.distribution.map((d) => (
            <div key={d.score} className="flex items-center gap-xs text-label-sm">
              <span className="w-6 text-right tabular-nums text-on-surface-variant">{d.score}</span>
              <span
                className={`h-4 rounded-sm text-right pr-1 tabular-nums font-semibold ${d.score === today ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface"}`}
                style={{ width: `${Math.max(8, (d.count / max) * 100)}%` }}
              >
                {d.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

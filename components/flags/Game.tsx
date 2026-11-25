"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Flag, Play, RotateCcw, Timer, Trophy } from "lucide-react";
import { BY_CODE, flagSrc } from "@/lib/flags/countries";
import { FLAGS, type Mode } from "@/lib/flags/config";
import { match } from "@/lib/flags/match";
import { formatTime, type Answer } from "@/lib/flags/engine";
import type { BoardRow, FlagBoard, RunResult, RunStart } from "@/lib/flags/types";

// The flag game. Type a country and its flag fills in, anywhere on the grid.
// Guests play entirely in the browser. Signed in, the server starts the run
// (database clock) and re-checks the answers when it ends; the browser keeps
// the answers so far in localStorage so a refresh carries on.

type Phase = "intro" | "loading" | "playing" | "done";
type Local = { correct: number; total: number; seconds: number };
/** A run in progress (or a finished guest sprint), as this browser remembers it. */
/** `order`: the grid order for an all-flags run (shuffled per run, kept across a refresh). */
type Saved = { runId: string | null; startedAt: string; offset: number; answers: Answer[]; done?: Local; order?: string[] };

function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const read = (key: string): Saved | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};
const write = (key: string, v: Saved | null) => {
  try {
    if (v) localStorage.setItem(key, JSON.stringify(v));
    else localStorage.removeItem(key);
  } catch {}
};

async function post<T>(url: string, body: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("offline");
  }
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? `http_${r.status}`);
  return (await r.json()) as T;
}

/** Why a run didn't save, in words (the server's reason, so a player can say what they saw). */
const SAVE_ERRORS: Record<string, string> = {
  signed_out: "You've been signed out, so your run couldn't be saved. Log in again (in a new tab), then press Try again.",
  offline: "No connection: your run couldn't be sent. Check your internet, then press Try again.",
  rate_limited: "Too many tries in a minute. Wait a moment, then press Try again.",
  forbidden: "Your browser blocked the save. Reload the page and your run will be sent again.",
  bad_request: "Your run couldn't be read by the server. Reload the page and it will be sent again.",
};

function shareText(board: FlagBoard, named: Set<string>, local: Local, url: string): string {
  const squares = board.codes.map((c) => (named.has(c) ? "🟩" : "⬛"));
  const rows = [squares.slice(0, 10).join(""), squares.slice(10).join("")].filter(Boolean).join("\n");
  return `Flags #${board.number} · ${local.correct}/${local.total} in ${formatTime(local.seconds)}\n${rows}\n${url}`;
}

/** The next flag after `from` (wrapping round) that isn't named yet, or null when all are. */
function nextOpen(codes: readonly string[], from: string | null, named: ReadonlySet<string>, step = 1): string | null {
  const i = from ? codes.indexOf(from) : -1;
  for (let k = 1; k <= codes.length; k++) {
    const c = codes[(((i + step * k) % codes.length) + codes.length) % codes.length];
    if (!named.has(c)) return c;
  }
  return null;
}

function untilReset(iso: string | null): string {
  if (!iso) return "";
  const ms = Math.max(0, Date.parse(iso) - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function Game({ board, userId }: { board: FlagBoard; userId: string | null }) {
  const signedIn = !!userId;
  const mode: Mode = board.mode;
  const capMs = FLAGS.capSeconds[mode] * 1000;
  const total = board.codes.length;
  // The sprint is the same board for everyone; all flags comes in a new random order every run.
  const [order, setOrder] = useState<string[]>(board.codes);
  /** A saved run's order if it's a real shuffle of this board, else a fresh one. */
  const orderFor = useCallback(
    (saved: Saved | null): string[] => {
      if (mode === "daily") return board.codes;
      const o = saved?.order;
      const same = o && o.length === board.codes.length && new Set(o).size === o.length && o.every((c) => BY_CODE.has(c));
      return same ? o : shuffle(board.codes);
    },
    [mode, board.codes],
  );
  // Where this browser keeps the run: one per sprint day; one live all-flags run.
  // Per account, so two people sharing a browser never see each other's run.
  const who = userId ?? "guest";
  const key = mode === "daily" ? `flags:daily:${board.day}:${who}` : `flags:${mode}:${who}`;

  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [input, setInput] = useState("");
  const [last, setLast] = useState<string | null>(null);
  /** The flag with the ring: the one to name next. Typing any other name still fills that one in. */
  const [focus, setFocus] = useState<string | null>(null);
  const [leftMs, setLeftMs] = useState(0);
  const [local, setLocal] = useState<Local | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [top, setTop] = useState<BoardRow[] | null>(null);
  /** Why the last save failed (the server's reason), or null. */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = useRef<Saved | null>(null);
  const answersRef = useRef<Answer[]>([]);
  const finishing = useRef(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const elapsed = useCallback(() => (run.current ? Date.now() + run.current.offset - Date.parse(run.current.startedAt) : 0), []);

  const named = useMemo(() => new Set(answers.map((a) => a.code)), [answers]);
  const current = focus && !named.has(focus) ? focus : nextOpen(order, null, named);
  const currentRef = useRef<string | null>(null);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  const open = useMemo(() => new Set(board.codes.filter((c) => !named.has(c))), [board.codes, named]);

  // ── Ending a run ──────────────────────────────────────────────────────
  const saveResult = useCallback(
    async (r: Saved) => {
      if (!signedIn || !r.runId) {
        fetch(`/api/flags/summary?mode=${mode}`)
          .then((x) => (x.ok ? x.json() : null))
          .then((b: { rows: BoardRow[] } | null) => b && setTop(b.rows))
          .catch(() => {});
        return;
      }
      setSaveError(null);
      try {
        const res = await post<RunResult>("/api/flags/finish", { runId: r.runId, answers: r.answers });
        setResult(res);
        setTop(res.top);
        setLocal({ correct: res.correct, total: res.total, seconds: res.seconds });
        if (mode !== "daily") write(key, null);
        else write(key, { ...r, done: { correct: res.correct, total: res.total, seconds: res.seconds } });
      } catch (e) {
        if ((e as Error).message === "no_run") {
          // The server doesn't have this run (cleared, or another account's): start over.
          write(key, null);
          run.current = null;
          answersRef.current = [];
          setAnswers([]);
          setLocal(null);
          setPhase("intro");
          return;
        }
        console.error("flags: run not saved", (e as Error).message);
        setSaveError((e as Error).message || "error");
      }
    },
    [signedIn, mode, key],
  );

  const finish = useCallback(() => {
    if (finishing.current || !run.current) return;
    finishing.current = true;
    if (pending.current) clearTimeout(pending.current);
    const r = { ...run.current, answers: answersRef.current };
    const done: Local = { correct: r.answers.length, total, seconds: Math.min(FLAGS.capSeconds[mode], Math.round(elapsed() / 1000)) };
    setLocal(done);
    setPhase("done");
    setConfirmGiveUp(false);
    // A guest all-flags run isn't kept once it's over; a sprint is (one a day).
    write(key, mode !== "daily" && !signedIn ? null : { ...r, done });
    void saveResult(r);
  }, [elapsed, key, mode, saveResult, signedIn, total]);

  // ── Starting / resuming ───────────────────────────────────────────────
  const begin = useCallback(
    (saved: Saved) => {
      const o = orderFor(saved);
      saved = { ...saved, order: mode !== "daily" ? o : undefined };
      write(key, saved);
      setOrder(o);
      setFocus(null);
      run.current = saved;
      answersRef.current = saved.answers;
      setAnswers(saved.answers);
      finishing.current = false;
      setResult(null);
      setTop(null);
      setLocal(null);
      setSaveError(null);
      if (saved.done) {
        finishing.current = true;
        setLocal(saved.done);
        setPhase("done");
        void saveResult(saved);
        return;
      }
      if (Date.now() + saved.offset - Date.parse(saved.startedAt) >= capMs) {
        setPhase("playing");
        // Ran out while away: end it with what was named.
        setTimeout(() => finish(), 0);
        return;
      }
      setPhase("playing");
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [capMs, finish, saveResult, orderFor, mode, key],
  );

  const start = useCallback(async () => {
    setError(null);
    if (!signedIn) {
      const saved: Saved = { runId: null, startedAt: new Date().toISOString(), offset: 0, answers: [] };
      write(key, saved);
      begin(saved);
      return;
    }
    setPhase("loading");
    try {
      const r = await post<RunStart>("/api/flags/start", { mode });
      const offset = Date.parse(r.serverNow) - Date.now();
      const mine = read(key);
      const answers = mine?.runId === r.runId ? mine.answers : r.result ? r.result.named.map((code) => ({ code, ms: 0 })) : [];
      const saved: Saved = { runId: r.runId, startedAt: r.startedAt, offset, answers, order: mine?.runId === r.runId ? mine.order : undefined };
      if (r.result) {
        // Already finished (today's sprint on another device, or a double tab).
        setOrder(orderFor(saved));
        run.current = saved;
        answersRef.current = answers;
        setAnswers(answers);
        finishing.current = true;
        setResult(r.result);
        setTop(r.result.top);
        setLocal({ correct: r.result.correct, total: r.result.total, seconds: r.result.seconds });
        setPhase("done");
        write(key, { ...saved, done: { correct: r.result.correct, total: r.result.total, seconds: r.result.seconds } });
        return;
      }
      write(key, saved);
      begin(saved);
    } catch (e) {
      setPhase("intro");
      setError((e as Error).message === "signed_out" ? "Your session ended. Log in again to play for the leaderboard." : "Couldn't start the run. Try again in a moment.");
    }
  }, [begin, key, mode, orderFor, signedIn]);

  // Pick up where this browser left off (a refresh, or today's sprint already played).
  useEffect(() => {
    const saved = read(key);
    if (!saved) return;
    const t = setTimeout(() => {
      const live = Date.now() + saved.offset - Date.parse(saved.startedAt) < capMs + FLAGS.graceMs;
      if (saved.done || live) {
        // Signed in, ask the server, which may have finished it already.
        if (signedIn && saved.runId && !saved.done) void start();
        else begin(saved);
      } else if (mode !== "daily") write(key, null);
      else begin(saved); // a sprint past its cap: end it with what was named
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The clock.
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = () => {
      setLeftMs(Math.max(0, capMs - elapsed()));
      if (elapsed() >= capMs) finish();
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [phase, elapsed, capMs, finish]);

  // ── Typing ────────────────────────────────────────────────────────────
  const accept = useCallback(
    (code: string) => {
      if (!run.current || finishing.current || answersRef.current.some((a) => a.code === code)) return;
      const next = [...answersRef.current, { code, ms: Math.max(0, Math.round(elapsed())) }];
      answersRef.current = next;
      setAnswers(next);
      setInput("");
      setLast(code);
      // Naming the ringed flag moves the ring on to the next one still to name.
      if (code === currentRef.current) setFocus(nextOpen(order, code, new Set(next.map((a) => a.code))));
      write(key, { ...run.current, answers: next });
      if (next.length === total) finish();
    },
    [order, elapsed, finish, key, total],
  );

  /** Skip: move the ring to the next (or previous) flag still to name. */
  const move = (step: 1 | -1) => {
    setFocus(nextOpen(order, current, named, step));
    inputRef.current?.focus();
  };

  // Keep the ringed flag on screen (below the sticky bar) as it moves.
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    document.getElementById(`flag-${current}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current, phase]);

  const onType = (value: string) => {
    setInput(value);
    if (pending.current) clearTimeout(pending.current);
    const m = match(value, open);
    if (!m.code) return;
    if (!m.wait) accept(m.code);
    else pending.current = setTimeout(() => accept(m.code!), FLAGS.prefixWaitMs);
  };

  const onEnter = () => {
    const m = match(input, open);
    if (m.code) {
      if (pending.current) clearTimeout(pending.current);
      accept(m.code);
    }
  };

  // ── Bits of UI ────────────────────────────────────────────────────────
  const lastName = last ? BY_CODE.get(last)?.name : null;

  const share = async () => {
    if (!local) return;
    try {
      await navigator.clipboard.writeText(shareText(board, named, local, `${window.location.origin}/flags`));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const playAgain = () => {
    write(key, null);
    run.current = null;
    setAnswers([]);
    answersRef.current = [];
    setLast(null);
    setFocus(null);
    setInput("");
    void start();
  };

  if (phase === "intro" || phase === "loading")
    return (
      <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl flex flex-col items-center gap-md text-center">
        <span className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center" aria-hidden="true">
          <Flag size={26} />
        </span>
        <h2 className="font-serif font-bold text-headline-md text-on-surface">{mode === "daily"
            ? `${total} flags, ${FLAGS.capSeconds.daily / 60} minutes`
            : mode === "hard"
              ? `Hard mode: ${total} flags, ${FLAGS.capSeconds.hard / 60} minutes`
              : `All ${total} flags, ${FLAGS.capSeconds.all / 60} minutes`}</h2>
        <p className="max-w-[46ch] text-body-md text-on-surface-variant">
          Type a country&apos;s name and its flag fills in, in any order. Spelling counts, accents don&apos;t.{" "}
          {mode === "daily"
            ? "Everyone gets the same flags today. Fastest full board wins."
            : mode === "hard"
              ? "Every country plus territories like Greenland, Hong Kong and Scotland. Most flags wins; the faster run breaks a tie."
              : "Most flags wins; the faster run breaks a tie."}
        </p>
        {mode === "daily" && <p className="text-label-md text-on-surface-variant">One go a day. The clock starts when you press Start.</p>}
        <button
          type="button"
          onClick={start}
          disabled={phase === "loading"}
          className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-xl py-sm text-body-md font-semibold cursor-pointer disabled:opacity-60"
        >
          <Play size={16} aria-hidden="true" /> {phase === "loading" ? "Starting…" : "Start"}
        </button>
        {error && <p className="text-label-md text-error">{error}</p>}
        {!signedIn && (
          <p className="text-label-md text-on-surface-variant">
            Playing as a guest.{" "}
            <Link href="/login?next=/flags" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            to get on the leaderboard.
          </p>
        )}
      </section>
    );

  const done = phase === "done";

  return (
    <div className="flex flex-col gap-lg">
      {done && local ? (
        <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl flex flex-col items-center gap-sm text-center" aria-live="polite">
          <p className="text-label-md font-semibold text-primary uppercase tracking-wide">{mode === "daily" ? `Flags #${board.number}` : mode === "hard" ? "Hard mode" : "All flags"}</p>
          <p className="font-serif font-bold text-display-lg text-on-surface tabular-nums">
            {local.correct}/{local.total}
          </p>
          <p className="text-body-lg text-on-surface-variant tabular-nums">
            {local.correct === local.total ? `Every flag in ${formatTime(local.seconds)}` : `in ${formatTime(local.seconds)}`}
          </p>
          {result?.rank && (
            <p className="inline-flex items-center gap-xs text-body-md font-semibold text-on-surface">
              <Trophy size={16} className="text-tertiary" aria-hidden="true" /> #{result.rank} {mode === "daily" ? "today" : "all time"}
            </p>
          )}
          {result && !result.counted && result.correct > 0 && <p className="text-label-md text-on-surface-variant">This run doesn&apos;t count for the leaderboard: it was faster than anyone can type.</p>}
          {saveError && (
            <p className="text-label-md text-error">
              {SAVE_ERRORS[saveError] ?? `Couldn't save your run (server error: ${saveError}).`}{" "}
              {saveError === "signed_out" && (
                <a href={`/login?next=/flags${mode === "daily" ? "" : `?mode=${mode}`}`} target="_blank" rel="noopener" className="font-semibold underline mr-xs">
                  Log in
                </a>
              )}
              <button type="button" onClick={() => run.current && saveResult({ ...run.current, answers: answersRef.current })} className="font-semibold underline cursor-pointer">
                Try again
              </button>
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-sm mt-xs">
            {mode === "daily" ? (
              <button type="button" onClick={share} className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-lg py-sm text-label-md font-semibold cursor-pointer">
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? "Copied" : "Share"}
              </button>
            ) : (
              <button type="button" onClick={playAgain} className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-lg py-sm text-label-md font-semibold cursor-pointer">
                <RotateCcw size={16} aria-hidden="true" /> Play again
              </button>
            )}
            <Link
              href={mode === "daily" ? "/flags?mode=all" : "/flags"}
              className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-lg py-sm text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary"
            >
              {mode === "daily" ? "Try all flags" : "Today's sprint"}
            </Link>
          </div>
          {mode === "daily" && <p className="text-label-md text-on-surface-variant">Next sprint in {untilReset(board.nextResetAt)}.</p>}
          {!signedIn && (
            <p className="text-label-md text-on-surface-variant">
              <Link href="/login?next=/flags" className="font-semibold text-primary hover:underline">
                Log in
              </Link>{" "}
              to save your runs and get on the leaderboard.
            </p>
          )}
          {top && top.length > 0 && (
            <div className="w-full max-w-[420px] mt-sm text-left">
              <p className="text-label-md font-semibold text-on-surface mb-xs">{mode === "daily" ? "Today's top 10" : mode === "hard" ? "Best hard-mode runs" : "Best all-flags runs"}</p>
              <ol className="rounded-2xl border border-outline-variant divide-y divide-outline-variant overflow-hidden">
                {top.map((r) => (
                  <li key={`${r.rank}-${r.name}`} className={`flex items-center gap-sm px-md py-xs text-body-md ${r.isMe ? "bg-primary-fixed/40" : ""}`}>
                    <span className="w-6 text-label-md font-bold text-on-surface-variant tabular-nums">{r.rank}</span>
                    <span className="flex-1 min-w-0 truncate font-semibold text-on-surface">{r.name}</span>
                    <span className="tabular-nums text-on-surface">
                      {r.correct}/{r.total}
                    </span>
                    <span className="w-12 text-right tabular-nums text-on-surface-variant">{formatTime(r.seconds)}</span>
                  </li>
                ))}
              </ol>
              <Link href={`/leaderboard?period=${mode === "daily" ? "flags" : `flags-${mode}`}`} className="mt-xs inline-block text-label-md font-semibold text-primary hover:underline">
                Full leaderboard →
              </Link>
            </div>
          )}
        </section>
      ) : (
        <div className="sticky top-16 z-30 -mx-sm sm:mx-0 px-sm sm:px-md py-sm bg-surface/95 backdrop-blur border-b sm:border sm:rounded-2xl border-outline-variant flex flex-col gap-xs">
          <div className="flex items-center gap-sm">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEnter();
                else if (e.key === "Tab") {
                  e.preventDefault();
                  move(e.shiftKey ? -1 : 1);
                }
              }}
              placeholder="Type a country…"
              aria-label="Country name"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              className="flex-1 min-w-0 rounded-xl border border-outline bg-surface-container-lowest px-md py-sm text-body-lg text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <span className={`inline-flex items-center gap-1 tabular-nums text-body-md font-semibold ${leftMs < 30_000 ? "text-error" : "text-on-surface"}`} aria-label="Time left">
              <Timer size={16} aria-hidden="true" /> {formatTime(Math.ceil(leftMs / 1000))}
            </span>
          </div>
          <div className="flex items-center justify-between gap-sm text-label-md">
            <span className="text-on-surface-variant tabular-nums" aria-live="polite">
              <span className="font-semibold text-on-surface">
                {answers.length}/{total}
              </span>
              {lastName && <span className="ml-sm text-secondary">✓ {lastName}</span>}
            </span>
            <span className="flex items-center gap-md">
            <button type="button" onClick={() => move(1)} className="font-semibold text-on-surface-variant hover:text-primary cursor-pointer" title="Skip to the next flag (Tab)">
              Skip →
            </button>
            {confirmGiveUp ? (
              <span className="flex items-center gap-sm">
                <button type="button" onClick={finish} className="font-semibold text-error cursor-pointer">
                  Yes, end it
                </button>
                <button type="button" onClick={() => setConfirmGiveUp(false)} className="text-on-surface-variant cursor-pointer">
                  Keep going
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmGiveUp(true)} className="font-semibold text-on-surface-variant hover:text-error cursor-pointer">
                Give up
              </button>
            )}
            </span>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-sm" aria-label="Flags">
          <ul className={`grid gap-sm ${mode === "daily" ? "grid-cols-4 md:grid-cols-5" : "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"}`}>
            {order.map((code) => {
              const got = named.has(code);
              const show = got || done;
              const ringed = !done && code === current;
              const name = BY_CODE.get(code)?.name ?? code;
              return (
                <li key={code} id={`flag-${code}`} className="flex flex-col gap-1 min-w-0 scroll-mt-48 scroll-mb-4">
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={done || got}
                    onClick={() => {
                      setFocus(code);
                      inputRef.current?.focus();
                    }}
                    aria-label={ringed ? "Current flag" : got ? `Flag of ${name}` : "Choose this flag"}
                    className={`block w-full aspect-[4/3] rounded-lg overflow-hidden border bg-surface-container transition-all duration-200 enabled:cursor-pointer ${
                      ringed
                        ? "border-primary ring-4 ring-primary scale-[1.06] relative z-10 shadow-lg"
                        : got
                          ? "border-outline-variant opacity-60"
                          : done
                            ? "border-error/60 opacity-80"
                            : "border-outline-variant hover:border-primary"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- static SVGs, no optimisation needed */}
                    <img src={flagSrc(code)} alt={show ? `Flag of ${name}` : "A flag"} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                  <span
                    className={`min-h-[2lh] text-center text-label-sm leading-tight break-words ${got ? `font-semibold ${last === code && !done ? "text-secondary" : "text-on-surface-variant"}` : done ? "font-semibold text-error" : "text-transparent select-none"}`}
                    aria-hidden={!show}
                  >
                    {show ? (got ? `✓ ${name}` : name) : "·"}
                  </span>
                </li>
              );
            })}
          </ul>
      </section>
    </div>
  );
}

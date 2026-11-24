"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Crown, PenLine, ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { TIERS } from "@/lib/deadline/config";
import { sfx } from "@/lib/deadline/sound";
import { turnProgress } from "@/lib/deadline/clock";
import type { Reaction, RoomActions, RoomEvent, RoomPlayer, RoomRound, SubmitResult, TypingStore } from "@/lib/deadline/types";
import { Extensions, nameOf, Points, WinsBadge } from "./bits";
import { Bubbles } from "./Reactions";
import { playerColors, seatAvatarClass } from "./fx";

/** The prompt, inside the clock: the border closes in and the tint deepens. No number. */
const NO_TYPING: TypingStore = { subscribe: () => () => {}, get: () => ({}) };

/** The holder's answer as they type it (others see it live; the holder has their own box). */
function HolderTyping({ store, holderId, holderName }: { store: TypingStore; holderId: string; holderName: string }) {
  const text = useSyncExternalStore(store.subscribe, () => store.get()[holderId] ?? "", () => "");
  return (
    <p className="min-h-7 text-body-lg font-mono text-on-surface" aria-live="off">
      {text ? (
        <>
          <span className="sr-only">{holderName} is typing: </span>
          {text}<span className="inline-block w-0.5 h-5 align-middle bg-on-surface animate-pulse ml-0.5" aria-hidden="true" />
        </>
      ) : (
        <span className="text-on-surface-variant/60 font-sans text-body-md">…</span>
      )}
    </p>
  );
}

export function PromptClock({ round, offset, mine, holderName, typing = NO_TYPING, className = "" }: {
  round: RoomRound; offset: number; mine: boolean; holderName: string; typing?: TypingStore; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const el = ref.current;
      if (el) {
        const p = turnProgress(round, offset);
        el.style.setProperty("--dl-p", p.toFixed(3));
        const hot = p > 1 - 3000 / round.turn_ms && p < 1 ? "true" : "false";
        if (el.dataset.hot !== hot) el.dataset.hot = hot;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [round, offset]);

  return (
    <div ref={ref} data-mine={mine} className={`dl-clock px-lg py-lg md:py-xl flex flex-col items-center text-center gap-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-xs text-label-sm uppercase tracking-wide text-on-surface-variant">
        <span>{round.subject === "mixed" ? "Mixed" : round.subject}</span>
        <span aria-hidden="true">·</span>
        <span>Prompt {round.prompt_no}</span>
        {round.overtime && <span className="rounded-full bg-error text-on-error px-sm py-0.5 font-bold normal-case tracking-normal">Overtime</span>}
      </div>
      <h2 className="font-serif font-bold text-headline-md md:text-[2rem] md:leading-tight text-on-surface text-balance">{round.prompt}</h2>
      <p className={`text-body-md font-semibold ${mine ? "text-error" : "text-on-surface-variant"}`} aria-live="polite">
        {mine ? "Your turn!" : `${holderName} has the draft`}
        {round.fail_count > 0 && <span className="font-normal text-on-surface-variant"> · one more miss and the prompt changes</span>}
      </p>
      {!mine && <HolderTyping store={typing} holderId={round.holder_id} holderName={holderName} />}
    </div>
  );
}

type Fx = { key: string; kind: "points" | "boom" | "out" | "bonus"; points?: number; bonus?: number };

/** One seat: avatar, name, extensions, points, wins, plus pops and reactions. */
function Seat({ p, me, isHolder, isHost, fx, reactions, color, style }: {
  p: RoomPlayer; me: string; isHolder: boolean; isHost: boolean; fx: Fx | null; reactions: Reaction[]; color: string; style?: React.CSSProperties;
}) {
  const mine = p.user_id === me;
  return (
    <li style={{ ...style, "--seat": color } as React.CSSProperties} data-holder={isHolder || undefined}
      className={`relative shrink-0 w-20 lg:w-24 flex flex-col items-center gap-0.5 text-center lg:absolute lg:left-(--x) lg:top-(--y) lg:-translate-x-1/2 lg:-translate-y-1/2 transition-[opacity,scale] duration-300 ${isHolder ? "scale-110" : ""} ${p.is_out ? "opacity-40 grayscale" : ""}`}
      aria-label={`${nameOf(p)}${mine ? " (you)" : ""}${isHolder ? ", has the draft" : ""}${p.is_out ? ", out" : ""}, ${p.points} points`}>
      <span className={`relative rounded-full ${isHolder ? "dl-holder" : ""}`}>
        <Avatar src={p.avatar_url} name={nameOf(p)} size={44}
          className={`${seatAvatarClass} ${isHolder ? "ring-4 ring-error ring-offset-2 ring-offset-surface-container-lowest" : `ring-2 ring-(--seat) ${mine ? "ring-offset-2 ring-offset-surface-container-lowest" : ""}`}`} />
        {isHolder && <span className="lg:hidden absolute -right-1 -bottom-1 rounded-full bg-error text-on-error p-0.5"><PenLine size={11} aria-hidden="true" /></span>}
        {isHost && <span className="absolute -left-1 -top-1 rounded-full bg-tertiary-container text-on-tertiary-container p-0.5" title="Host"><Crown size={10} aria-hidden="true" /></span>}
        {fx?.kind === "boom" && <span key={fx.key} className="dl-boom absolute inset-0 rounded-full bg-error" aria-hidden="true" />}
        <Bubbles reactions={reactions} />
        {fx && (fx.kind === "points" || fx.kind === "bonus") && (
          <span className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center" aria-hidden="true">
            <span key={fx.key} className="dl-pop text-headline-md font-black drop-shadow-sm" style={{ color: TIERS[fx.points ?? 1]?.color }}>
              +{fx.points}
              {fx.points === 7 && <span className="block text-label-md whitespace-nowrap">{TIERS[7].label}!</span>}
              {fx.bonus ? <span className="block text-label-sm text-primary">+1 extension</span> : null}
            </span>
          </span>
        )}
      </span>
      <span className="max-w-full truncate text-label-md font-semibold text-on-surface">
        <span className="inline-block w-2 h-2 rounded-full bg-(--seat) mr-1 align-middle" aria-hidden="true" />{mine ? "You" : nameOf(p)}
      </span>
      {p.guest && <span className="-mt-0.5 text-label-sm text-on-surface-variant">guest</span>}
      <span className="flex items-center gap-xs">
        {p.is_out ? <span className="text-label-sm font-bold text-error">Out</span> : <Extensions n={p.extensions} />}
        <span className="text-label-sm tabular-nums text-on-surface-variant">{p.points}</span>
      </span>
      <WinsBadge wins={p.wins} />
    </li>
  );
}

/**
 * Seats round the prompt on a laptop (an ellipse with your own seat at the
 * bottom, nearest your answer bar; watchers see the first seat at the top),
 * a scrolling row above it on a phone. The prompt card is the ring's centre.
 */
export function SeatRing({ players, me, round, hostId, event, reactions, children }: {
  players: RoomPlayer[]; me: string; round: RoomRound; hostId: string; event: RoomEvent | null; reactions: Reaction[]; children: React.ReactNode;
}) {
  const seated = players.filter((p) => p.seat !== null).sort((a, b) => a.seat! - b.seat!);
  const fxFor = (uid: string): Fx | null => {
    if (!event || !("user_id" in event) || event.user_id !== uid) return null;
    if (event.type === "answer") return { key: event.at, kind: "points", points: event.points, bonus: event.bonus };
    if (event.type === "timeout") return { key: event.at, kind: "boom" };
    return null;
  };
  const n = seated.length;
  const colors = playerColors(players.map((p) => p.user_id));
  // Turned so your seat sits at the bottom; play order still runs clockwise.
  const mine = seated.findIndex((p) => p.user_id === me);
  const angle = (i: number) => (mine >= 0 ? 90 + (360 * (i - mine)) / n : -90 + (360 * i) / n) * (Math.PI / 180);
  const hi = seated.findIndex((p) => p.user_id === round.holder_id);

  // Phone: keep the holder's seat in view in the scrolling row.
  const row = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = row.current;
    const li = ol?.querySelector<HTMLElement>("[data-holder]");
    if (!ol || !li || ol.scrollWidth <= ol.clientWidth) return;
    ol.scrollTo({ left: li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2, behavior: "smooth" });
  }, [round.holder_id]);

  return (
    <div className="relative flex flex-col gap-md lg:block lg:aspect-[16/10] lg:min-h-[430px]">
      <ol ref={row} className="flex gap-xs overflow-x-auto pt-md pb-xs -mx-md px-md lg:contents" aria-label="Players">
        {seated.map((p, i) => (
          <Seat key={p.user_id} p={p} me={me} isHolder={p.user_id === round.holder_id} isHost={p.user_id === hostId}
            fx={fxFor(p.user_id)} reactions={reactions.filter((r) => r.user_id === p.user_id)} color={colors.get(p.user_id)!}
            style={{ "--x": `${50 + 44 * Math.cos(angle(i))}%`, "--y": `${52 + 38 * Math.sin(angle(i))}%` } as React.CSSProperties} />
        ))}
      </ol>
      {/* Laptop: the draft itself, sliding from seat to seat. */}
      {hi >= 0 && (
        <span aria-hidden="true" className="dl-token hidden lg:flex absolute z-10 -translate-x-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-error text-on-error shadow-lg"
          style={{ left: `${50 + 33 * Math.cos(angle(hi))}%`, top: `${52 + 27 * Math.sin(angle(hi))}%` }}>
          <PenLine size={16} />
        </span>
      )}
      <div className="lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[58%]">{children}</div>
    </div>
  );
}

/** The answers already taken on this prompt, newest first, in tier colours. */
export function AnswerChips({ round, players }: { round: RoomRound; players: RoomPlayer[] }) {
  if (!round.answers.length) return <p className="text-label-md text-on-surface-variant text-center">No answers yet on this prompt.</p>;
  const byId = new Map(players.map((p) => [p.user_id, p]));
  return (
    <ul className="flex flex-wrap justify-center gap-xs" aria-label="Answers so far">
      {[...round.answers].reverse().map((a, i) => (
        <li key={`${a.answer}-${i}`} title={`${nameOf(byId.get(a.user_id))}: +${a.points}`}
          className="dl-chip inline-flex items-center gap-xs rounded-full border-2 bg-surface-container-lowest px-sm py-0.5 text-label-md font-semibold text-on-surface"
          style={{ borderColor: TIERS[a.points]?.color }}>
          {a.answer} <Points n={a.points} className="text-label-sm" />
        </li>
      ))}
    </ul>
  );
}

const SAY: Partial<Record<SubmitResult["result"], string>> = {
  wrong: "Not on the list.",
  ambiguous: "Too close to two answers. Be more specific.",
  denied: "Not this one.",
  not_your_turn: "Not your turn yet.",
  too_late: "Too late!",
  rate_limited: "Slow down.",
  error: "Didn't send. Check your connection and try again.",
};

/**
 * The answer bar: anyone can type, only the holder can submit (Enter or the
 * button). It is never re-mounted (not for a new prompt, not for a wrong
 * answer), so the keyboard and focus stay put. Wrong → shake, text kept and
 * focused for a quick fix; a rejected answer can be flagged "That's right!".
 * While it's your turn, what you type is shared live (onTyping).
 */
export function AnswerBar({ roundId, myTurn, canPlay, actions, holderName, onTyping }: {
  roundId: string; myTurn: boolean; canPlay: boolean; actions: Pick<RoomActions, "submit" | "appeal">; holderName: string;
  onTyping?: (text: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [appeal, setAppeal] = useState<{ id: number; text: string; sent: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  // A new prompt: start fresh (same input element, so focus stays).
  const [seenRound, setSeenRound] = useState(roundId);
  if (seenRound !== roundId) {
    setSeenRound(roundId);
    setText("");
    setMsg(null);
    setAppeal(null);
  }

  // The turn arrives: an old "Not your turn yet." / "Too late!" no longer applies.
  const [seenTurn, setSeenTurn] = useState(myTurn);
  if (seenTurn !== myTurn) {
    setSeenTurn(myTurn);
    if (myTurn) setMsg(null);
  }

  // Your turn: the answer bar gets the keyboard and shares what's already
  // typed. Turn over: share nothing (only the holder's typing is ever shown).
  useEffect(() => {
    if (myTurn) input.current?.focus({ preventScroll: true });
    onTyping?.(myTurn ? input.current?.value ?? "" : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the turn arrives
  }, [myTurn]);

  function shake() {
    const el = row.current;
    if (!el) return;
    el.classList.remove("dl-shake");
    void el.offsetWidth; // restart the animation without re-mounting anything
    el.classList.add("dl-shake");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    input.current?.focus({ preventScroll: true });
    // Out of turn: no message, the answer stays typed so Enter sends it once the draft arrives.
    if (!t || !myTurn || busy) return;
    setBusy(true);
    const r = await actions.submit(t);
    setBusy(false);
    if (r.result === "ok") {
      setText("");
      setMsg(null);
      setAppeal(null);
      onTyping?.("");
      return;
    }
    if (r.result === "taken") setMsg(`${r.answer} is already taken.`);
    else setMsg(SAY[r.result] ?? null);
    if (r.result === "wrong" || r.result === "ambiguous" || r.result === "denied" || r.result === "taken") {
      shake();
      sfx.wrong();
      if (r.result !== "taken" && r.reject_id) setAppeal({ id: r.reject_id, text: t, sent: false });
      // Stay in the box with the text, caret at the end, ready to fix and press Enter again.
      const el = input.current;
      if (el) { el.focus({ preventScroll: true }); el.setSelectionRange(el.value.length, el.value.length); }
    }
  }

  if (!canPlay) {
    return <p className="text-center text-body-md text-on-surface-variant py-sm">You&apos;re out this game. Cheer them on 👀</p>;
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-xs">
      {/* Whose turn, right where you type: loud when it's yours. */}
      <p className="text-center" aria-hidden="true">
        {myTurn ? (
          <span className="inline-block rounded-full bg-error text-on-error px-md py-0.5 text-body-md font-black uppercase tracking-wide animate-pulse">Your turn, answer now!</span>
        ) : (
          <span className="text-label-md text-on-surface-variant">{holderName}&apos;s turn{text.trim() ? " · press Enter when it's yours" : ""}</span>
        )}
      </p>
      <div ref={row} className="flex items-center gap-xs">
        <label className="flex-1">
          <span className="sr-only">Your answer</span>
          <input ref={input} value={text} onChange={(e) => { const v = e.target.value.slice(0, 120); setText(v); setMsg(null); if (myTurn) onTyping?.(v); }}
            placeholder={myTurn ? "Type an answer…" : `Get one ready while ${holderName} thinks…`}
            autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="send"
            className={`w-full rounded-2xl border-2 bg-surface-container-lowest px-md py-sm text-body-lg text-on-surface outline-none transition-colors ${
              myTurn ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"}`} />
        </label>
        {/* Pressing Go doesn't take focus from the box (the phone keyboard stays open). */}
        <button type="submit" disabled={!myTurn || !text.trim() || busy} onPointerDown={(e) => e.preventDefault()}
          className="rounded-2xl bg-error text-on-error px-lg py-sm text-body-lg font-bold disabled:bg-surface-container-high disabled:text-on-surface-variant cursor-pointer">
          Go
        </button>
      </div>
      <div className="min-h-6 flex flex-wrap items-center justify-center gap-sm text-label-md">
        {msg && <span className="text-error font-semibold" role="status">{msg}</span>}
        {appeal && !appeal.sent && (
          <button type="button" onClick={() => { void actions.appeal(appeal.id); setAppeal({ ...appeal, sent: true }); }}
            className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-sm py-0.5 text-on-surface-variant hover:text-primary cursor-pointer"
            title={`Flag “${appeal.text}” as a real answer we're missing`}>
            <ThumbsUp size={12} aria-hidden="true" />“{appeal.text}” is right!
          </button>
        )}
        {appeal?.sent && <span className="text-on-surface-variant">Thanks, we&apos;ll check “{appeal.text}”.</span>}
      </div>
    </form>
  );
}

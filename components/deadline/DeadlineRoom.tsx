"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS } from "@/lib/deadline/config";
import { sfx } from "@/lib/deadline/sound";
import { LogOut } from "lucide-react";
import type { ChatMessage, Reaction, RoomActions, RoomState, TypingStore } from "@/lib/deadline/types";
import { nameOf } from "./bits";
import { ChatButton, ChatPanel, ChatSheet } from "./Chat";
import { EndScreen } from "./EndScreen";
import { Confetti, SoundToggle, useUnlockAudio } from "./fx";
import { AnswerBar, AnswerChips, PromptClock, SeatRing } from "./Game";
import { Lobby } from "./Lobby";
import { ReactionBar } from "./Reactions";

/** On a phone, the visible height (it shrinks when the keyboard opens), so the answer bar stays above it. */
function usePhoneViewportHeight(): number | null {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setH(mq.matches ? Math.round(vv?.height ?? window.innerHeight) : null);
    update();
    vv?.addEventListener("resize", update);
    mq.addEventListener("change", update);
    return () => { vv?.removeEventListener("resize", update); mq.removeEventListener("change", update); };
  }, []);
  return h;
}

/**
 * A Deadline room: lobby → game → end, with chat in every phase.
 * Laptop (≥ 1024 px): the room in the middle, chat as a panel on the right.
 * Phone: in a game, full screen with the answer bar at the bottom and chat
 * behind a button (it closes itself when your turn starts); in the lobby and
 * end screen, chat sits below.
 */
export function DeadlineRoom({ state, offset, messages, reactions, actions, onEvent, typing, onTyping }: {
  state: RoomState;
  /** ms to add to Date.now() for server time. */
  offset: number;
  messages: ChatMessage[];
  reactions: Reaction[];
  actions: RoomActions;
  /** Funnel analytics (log_deadline_event). */
  onEvent?: (kind: "invite_copied" | "chat_opened") => void;
  /** The holder's live typing (others see it under the prompt). */
  typing?: TypingStore;
  /** Share what you type while it's your turn. */
  onTyping?: (text: string) => void;
}) {
  const { room, players, me, round } = state;
  const meP = players.find((p) => p.user_id === me);
  const isHost = room.host_id === me;
  const playing = room.status === "playing" && !!round;
  const myTurn = playing && round!.holder_id === me;
  const holder = playing ? players.find((p) => p.user_id === round!.holder_id) : undefined;
  const vh = usePhoneViewportHeight();

  // A flash when the game starts, the prompt changes, and when the draft
  // reaches you (the new prompt's flash says "Your turn!" too).
  const [seenRound, setSeenRound] = useState(round?.id ?? null);
  const [flash, setFlash] = useState<{ key: string; text: string } | null>(null);
  if ((round?.id ?? null) !== seenRound) {
    setSeenRound(round?.id ?? null);
    if (round) setFlash({ key: round.id, text: !seenRound ? "Go!" : myTurn ? "Your turn!" : round.subject === "flags" ? "New flag" : "New prompt" });
  }

  // Phone chat sheet: closed by default, closes itself when your turn starts.
  const [sheet, setSheet] = useState(false);
  const [seenTurn, setSeenTurn] = useState(myTurn);
  if (seenTurn !== myTurn) {
    setSeenTurn(myTurn);
    if (myTurn) {
      setSheet(false);
      // Same prompt, the draft reached you (a new prompt's flash already says so).
      if (round && round.id === seenRound) setFlash({ key: `${round.id}:${round.turn_started_at}`, text: "Your turn!" });
    }
  }
  // Unread: messages from others that arrived while the sheet was closed.
  const [readCount, setReadCount] = useState(messages.length);
  if (sheet && readCount !== messages.length) setReadCount(messages.length);
  const unread = messages.slice(readCount).filter((m) => m.user_id !== me).length;


  // What just happened at the table: a right answer bursts out, a miss shakes
  // the prompt and flashes red. Only events seen live (not on page load).
  const ev = room.last_event;
  const evKey = ev ? `${ev.type}:${ev.at}:${"user_id" in ev ? ev.user_id : ""}` : null;
  const [seenEv, setSeenEv] = useState(evKey);
  const [moment, setMoment] = useState<
    | { key: string; kind: "answer"; answer: string; points: number; bonus: number; who: string; mine: boolean }
    | { key: string; kind: "miss"; out: boolean; who: string; mine: boolean }
    | null>(null);
  if (evKey !== seenEv) {
    setSeenEv(evKey);
    if (ev && evKey && playing) {
      const who = players.find((p) => p.user_id === ("user_id" in ev ? ev.user_id : ""));
      const mine = "user_id" in ev && ev.user_id === me;
      if (ev.type === "answer") setMoment({ key: evKey, kind: "answer", answer: ev.answer, points: ev.points, bonus: ev.bonus, who: nameOf(who), mine });
      else if (ev.type === "timeout") setMoment({ key: evKey, kind: "miss", out: ev.out, who: nameOf(who), mine });
    }
  }

  // Sounds for those moments (the audio opens on the first tap anywhere).
  useUnlockAudio();
  useEffect(() => {
    if (!moment) return;
    if (moment.kind === "miss") return sfx.miss(moment.out);
    if (moment.points >= 5) sfx.rare(moment.points); else sfx.pass();
    if (moment.bonus) { const t = setTimeout(sfx.extension, 350); return () => clearTimeout(t); }
  }, [moment]);

  // A new prompt (or the game starting): a chime, just after the pass/miss
  // sound, so a switch is heard as well as seen. Not on page load.
  const lastRound = useRef(round?.id ?? null);
  const promptAt = useRef(0);
  useEffect(() => {
    const id = round?.id ?? null;
    if (id === lastRound.current) return;
    lastRound.current = id;
    if (!id) return;
    promptAt.current = Date.now();
    const t = setTimeout(sfx.newPrompt, 180);
    return () => clearTimeout(t);
  }, [round?.id]);

  // The draft reaches you: shown as a flash, plus a buzz (Android) and the tab title.
  useEffect(() => {
    if (!myTurn) return;
    try { navigator.vibrate?.(150); } catch {}
    // After the pass/miss sound that handed you the draft (and the new-prompt
    // chime, when there is one), so each is heard.
    const t = setTimeout(sfx.yourTurn, Date.now() - promptAt.current < 400 ? 620 : 250);
    const before = document.title;
    document.title = `🔴 Your turn! · ${before}`;
    return () => { clearTimeout(t); document.title = before; };
  }, [myTurn, round?.turn_started_at]);

  const chat = (
    <ChatPanel messages={messages} players={players} me={me} isHost={isHost} actions={actions} className="h-full" />
  );
  const react = (e: string) => void actions.react(e);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-lg lg:items-start">
      {/* ── The room ── */}
      <div
        style={playing && vh ? { height: vh } : undefined}
        data-myturn={myTurn || undefined}
        className={playing
          ? "max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[60] max-lg:bg-surface-container-low flex flex-col max-lg:px-md lg:gap-md"
          : "flex flex-col gap-lg"}
      >
        {playing && round ? (
          <>
            {/* Phone top bar: room, leave, chat */}
            <div className="flex items-center justify-between gap-sm py-sm lg:hidden">
              <button type="button" onClick={() => void actions.leave()} aria-label="Leave the game" className="p-sm -ml-sm text-on-surface-variant cursor-pointer"><LogOut size={18} /></button>
              <span className="flex items-center gap-xs">
                <span className="font-mono font-bold tracking-widest text-on-surface-variant">{room.code}</span>
                <SoundToggle />
              </span>
              <ChatButton unread={unread} onClick={() => { setSheet(true); onEvent?.("chat_opened"); }} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col lg:overflow-visible">
              {/* m-auto: centred on a tall phone, still scrolls on a short one */}
              <div className="m-auto w-full flex flex-col gap-md py-sm lg:m-0 lg:py-0">
              <div className="relative">
                <SeatRing players={players} me={me} round={round} hostId={room.host_id} event={room.last_event} reactions={reactions} actions={actions}>
                  <div className="relative">
                    <div key={moment?.kind === "miss" ? moment.key : "clock"} className={moment?.kind === "miss" ? "dl-shake" : ""}>
                      {/* A new prompt pops and glows at once, so the switch is seen even mid-typing. */}
                      <div key={round.id} className="dl-newprompt rounded-[1.25rem]">
                        <PromptClock round={round} offset={offset} mine={myTurn} holderName={nameOf(holder)} typing={typing} />
                      </div>
                    </div>
                    {/* On the clock's edges, so the prompt itself stays readable. */}
                    {flash && (
                      <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap" aria-hidden="true">
                        <span key={flash.key} className={`dl-flash block rounded-full px-lg py-xs font-black shadow-lg ${flash.text === "Go!" ? "bg-primary text-on-primary text-headline-lg px-xl" : flash.text === "Your turn!" ? "bg-error text-on-error text-headline-md" : "bg-inverse-surface text-inverse-on-surface text-headline-md"}`}>
                          {flash.text}
                        </span>
                      </span>
                    )}
                    {moment && (
                      <span className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20 whitespace-nowrap" aria-hidden="true">
                        {moment.kind === "answer" ? (
                          <span key={moment.key} className="dl-burst flex flex-col items-center rounded-2xl bg-surface-container-lowest px-lg py-xs shadow-xl border-2" style={{ borderColor: TIERS[moment.points]?.color }}>
                            <span className="font-serif font-black text-headline-md leading-tight text-on-surface">
                              {moment.answer} <span style={{ color: TIERS[moment.points]?.color }}>+{moment.points}</span>
                            </span>
                            <span className="text-label-md font-semibold text-on-surface-variant" style={{ color: moment.points >= 5 ? TIERS[moment.points]?.color : undefined }}>
                              {moment.points >= 5 ? `${TIERS[moment.points].label}!` : moment.mine ? "Nice." : moment.who}
                            </span>
                          </span>
                        ) : (
                          <span key={moment.key} className="dl-burst block rounded-full bg-error text-on-error px-md py-xs text-body-lg font-black shadow-lg">
                            💥 {moment.mine ? (moment.out ? "You're out!" : "You missed!") : moment.out ? `${moment.who} is out!` : `${moment.who} missed!`}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </SeatRing>
              </div>
              <AnswerChips round={round} players={players} />
              </div>
            </div>
            <div className="flex flex-col gap-xs pt-sm pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:pb-0">
              <AnswerBar roundId={round.id} myTurn={myTurn} canPlay={!!meP && meP.seat !== null && !meP.is_out}
                actions={actions} holderName={nameOf(holder)} onTyping={onTyping} />
              <ReactionBar onReact={react} />
            </div>
          </>
        ) : room.status === "finished" ? (
          <EndScreen state={state} actions={actions} />
        ) : (
          <Lobby state={state} actions={actions} onInvite={() => onEvent?.("invite_copied")} />
        )}

        {/* Phone, lobby and end: chat below, with reactions */}
        {!playing && (
          <section className="lg:hidden flex flex-col gap-sm" aria-label="Room chat">
            <div className="flex items-center justify-center gap-xs">
              <ReactionBar onReact={react} />
              <SoundToggle />
            </div>
            <div className="h-80 rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">{chat}</div>
          </section>
        )}
      </div>

      {/* ── Laptop: chat on the right, every phase ── */}
      <aside className="hidden lg:flex flex-col sticky top-md h-[calc(100dvh-8rem)] min-h-[480px] rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden" aria-label="Room chat">
        <div className="flex items-center justify-between pl-md pr-xs pt-xs">
          <p className="font-semibold text-on-surface">Room chat</p>
          <SoundToggle />
        </div>
        {chat}
        {!playing && <ReactionBar onReact={react} className="border-t border-outline-variant py-xs" />}
      </aside>

      {/* ── The big moments ── */}
      {playing && moment?.kind === "miss" && <div key={moment.key} className="dl-vignette pointer-events-none fixed inset-0 z-[70]" aria-hidden="true" />}
      {playing && moment?.kind === "answer" && moment.points >= 5 && (
        <Confetti key={moment.key} seed={moment.key} count={moment.points >= 7 ? 90 : 36}
          colors={moment.points >= 7 ? ["#d4a017", "#facc15", "#fde68a", "#f59e0b"] : undefined} />
      )}

      {/* ── Phone: chat sheet during the game ── */}
      {playing && <ChatSheet open={sheet} onClose={() => setSheet(false)}>{chat}</ChatSheet>}
    </div>
  );
}

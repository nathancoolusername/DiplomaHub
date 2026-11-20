"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import type { ChatMessage, Reaction, RoomActions, RoomState, TypingStore } from "@/lib/deadline/types";
import { nameOf } from "./bits";
import { ChatButton, ChatPanel, ChatSheet } from "./Chat";
import { EndScreen } from "./EndScreen";
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

  // Phone chat sheet: closed by default, closes itself when your turn starts.
  const [sheet, setSheet] = useState(false);
  const [seenTurn, setSeenTurn] = useState(myTurn);
  if (seenTurn !== myTurn) {
    setSeenTurn(myTurn);
    if (myTurn) setSheet(false);
  }
  // Unread: messages from others that arrived while the sheet was closed.
  const [readCount, setReadCount] = useState(messages.length);
  if (sheet && readCount !== messages.length) setReadCount(messages.length);
  const unread = messages.slice(readCount).filter((m) => m.user_id !== me).length;

  // A flash when the prompt changes (and when Overtime starts).
  const [seenRound, setSeenRound] = useState(round?.id ?? null);
  const [flash, setFlash] = useState<{ key: string; text: string } | null>(null);
  if ((round?.id ?? null) !== seenRound) {
    setSeenRound(round?.id ?? null);
    if (round && seenRound) setFlash({ key: round.id, text: round.overtime ? "Overtime!" : "New prompt" });
  }

  const chat = (
    <ChatPanel messages={messages} players={players} me={me} isHost={isHost} actions={actions} className="h-full" />
  );
  const react = (e: string) => void actions.react(e);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-lg lg:items-start">
      {/* ── The room ── */}
      <div
        style={playing && vh ? { height: vh } : undefined}
        className={playing
          ? "max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[60] max-lg:bg-surface-container-low flex flex-col max-lg:px-md lg:gap-md"
          : "flex flex-col gap-lg"}
      >
        {playing && round ? (
          <>
            {/* Phone top bar: room, leave, chat */}
            <div className="flex items-center justify-between gap-sm py-sm lg:hidden">
              <button type="button" onClick={() => void actions.leave()} aria-label="Leave the game" className="p-sm -ml-sm text-on-surface-variant cursor-pointer"><LogOut size={18} /></button>
              <span className="font-mono font-bold tracking-widest text-on-surface-variant">{room.code}</span>
              <ChatButton unread={unread} onClick={() => { setSheet(true); onEvent?.("chat_opened"); }} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col lg:overflow-visible">
              {/* m-auto: centred on a tall phone, still scrolls on a short one */}
              <div className="m-auto w-full flex flex-col gap-md py-sm lg:m-0 lg:py-0">
              <div className="relative">
                <SeatRing players={players} me={me} round={round} hostId={room.host_id} event={room.last_event} reactions={reactions}>
                  <PromptClock round={round} offset={offset} mine={myTurn} holderName={nameOf(holder)} typing={typing} />
                </SeatRing>
                {flash && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <span key={flash.key} className={`dl-flash rounded-full px-lg py-sm text-headline-md font-black shadow-lg ${flash.text === "Overtime!" ? "bg-error text-on-error" : "bg-inverse-surface text-inverse-on-surface"}`}>
                      {flash.text}
                    </span>
                  </div>
                )}
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
            <ReactionBar onReact={react} />
            <div className="h-80 rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">{chat}</div>
          </section>
        )}
      </div>

      {/* ── Laptop: chat on the right, every phase ── */}
      <aside className="hidden lg:flex flex-col sticky top-md h-[calc(100dvh-8rem)] min-h-[480px] rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden" aria-label="Room chat">
        <p className="px-md pt-md font-semibold text-on-surface">Room chat</p>
        {chat}
        {!playing && <ReactionBar onReact={react} className="border-t border-outline-variant py-xs" />}
      </aside>

      {/* ── Phone: chat sheet during the game ── */}
      {playing && <ChatSheet open={sheet} onClose={() => setSheet(false)}>{chat}</ChatSheet>}
    </div>
  );
}

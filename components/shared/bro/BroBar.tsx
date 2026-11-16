"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Square, BookOpen, History, Maximize2, RotateCcw, X } from "lucide-react";
import { BroAvatar } from "../BroAvatar";
import { BRO_BUTTON_ICON_ID, useBroPlacement, type BroOpenRequest } from "./bro-visibility";
import type { DiplomaBroState } from "./DiplomaBroIcon";
import { BroChatList } from "./BroChatsMenu";
import { BroMessageList, BroStarters, QUESTION_STARTERS } from "./BroMessages";
import { isNewChatShortcut, useBroChat } from "./useBroChat";

const FLY_MS = 420;

// The Bro command bar. It opens instantly at its normal size (an input,
// starters and past chats), with the chat loading quietly behind it. When the
// student sends a message (or picks a starter, or opens Past chats) it grows
// into a tall, wide panel with the current chat and the input at the bottom,
// and stays big after "New chat". The growth is a short opacity/scale
// animation over an instant size switch: animating the width and padding
// made the browser redo the layout (and the backdrop blur) every frame.

export function BroBar({ onClose, request = null }: { onClose: () => void; request?: BroOpenRequest | null }) {
  const [input, setInput] = useState("");
  // The question on screen ("Ask Bro" on one, or the player's current one), until the student removes it.
  const { question: pageQuestion } = useBroPlacement();
  const [detached, setDetached] = useState(false);
  const question = detached ? null : (request?.question ?? pageQuestion);
  // With a question on screen, Bro opens that practice set's own chat, not the latest general one.
  const { messages, setMessages, loaded, phase, busy, remaining, submit, newChat, hasSent, conversationId, chats, openChat, deleteChat, stop, retry } =
    useBroChat(request, question?.attemptId ?? null, true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const avatarRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Bro "answers" while it flies in, then settles.
  const [arrival, setAvatarState] = useState<DiplomaBroState>("answering");
  const avatarState: DiplomaBroState = phase === "thinking" ? "thinking" : phase === "answering" ? "answering" : arrival;
  // Normal size until the student sends something; "Talk to Bro" and prompt chips open big (there's already something to read).
  const [big, setBig] = useState(() => !!(request?.context || request?.prompt));
  const expand = () => setBig(true);
  // The big view shows the chat, or the list of past chats.
  const [view, setView] = useState<"chat" | "chats">("chat");
  const showChats = () => {
    expand();
    setView("chats");
  };

  // Growing: a quick fade and scale on the compositor, no layout animation.
  const wasBig = useRef(big);
  useLayoutEffect(() => {
    if (big === wasBig.current) return;
    // The input moves from the top to the bottom: keep the focus in it.
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    if (big && dialogRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialogRef.current.animate([{ opacity: 0.4, transform: "scale(0.97)" }, { opacity: 1, transform: "none" }], {
        duration: 180,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
      });
    }
    wasBig.current = big;
  }, [big]);

  const startNewChat = () => {
    setView("chat");
    newChat();
    setInput("");
    inputRef.current?.focus();
  };

  // Opening: the icon flies from the bottom-right button into the bar (with a
  // turn and a slight overshoot), and the bar fades up behind it.
  useLayoutEffect(() => {
    inputRef.current?.focus();
    const avatar = avatarRef.current;
    const panel = panelRef.current;
    // The button is already shrinking away; its centre doesn't move, and offsetWidth ignores the scale.
    const button = document.getElementById(BRO_BUTTON_ICON_ID);
    const from = button?.getBoundingClientRect();
    const fromSize = button?.offsetWidth ?? 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const settle = window.setTimeout(() => setAvatarState("idle"), FLY_MS + 250);
    if (!avatar || !panel || reduced) return () => window.clearTimeout(settle);

    const running: Animation[] = [];
    running.push(panel.animate(
      [
        { opacity: 0, transform: "translateY(12px) scale(0.98)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 240, delay: 80, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "backwards" },
    ));
    if (from && fromSize > 0) {
      const to = avatar.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      running.push(avatar.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${fromSize / to.width}) rotate(-120deg)` },
          { transform: "translate(0, 0) scale(1) rotate(0deg)" },
        ],
        { duration: FLY_MS, easing: "cubic-bezier(0.3, 1.25, 0.5, 1)" },
      ));
    }
    return () => {
      window.clearTimeout(settle);
      running.forEach((a) => a.cancel());
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (isNewChatShortcut(e)) {
        e.preventDefault();
        newChat();
        setInput("");
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, newChat]);

  // Keep the newest text in view while it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, big]);

  // Back to the input when a reply finishes.
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    expand();
    setView("chat");
    setInput("");
    submit(text, question);
  };

  const open = (id: string) => {
    expand();
    setView("chat");
    if (id !== conversationId) void openChat(id);
  };

  // Long messages wrap onto more lines (up to about six, then the box scrolls) instead of sliding out of view.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input, big]);

  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(input);
      }}
      className={`flex flex-wrap items-end gap-sm rounded-2xl bg-surface-raised border border-outline-variant shadow-xl pl-[56px] pr-md py-sm ${big ? "" : "glass"}`}
    >
      {question && (
        <span className="basis-full inline-flex items-center gap-xs self-start rounded-full bg-surface-container px-sm py-0.5 text-label-sm text-on-surface-variant">
          <BookOpen size={12} aria-hidden="true" /> Helping with: {question.label}
          <button type="button" onClick={() => setDetached(true)} aria-label="Stop sending this question to Bro" className="hover:text-primary cursor-pointer">
            <X size={12} />
          </button>
        </span>
      )}
      <textarea
        ref={inputRef}
        value={input}
        rows={1}
        onChange={(e) => setInput(e.target.value)}
        // Enter sends; Shift+Enter starts a new line.
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send(input);
          }
        }}
        maxLength={2000}
        placeholder={busy ? "Bro is answering…" : hasSent ? "Reply to Bro…" : "Ask Bro anything about your studies…"}
        aria-label="Message Bro"
        className="flex-1 resize-none bg-transparent outline-none text-body-md leading-6 text-on-surface placeholder:text-on-surface-variant py-sm"
      />
      {busy ? (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop"
          title="Stop"
          className="rounded-[50%] bg-on-surface text-surface p-sm cursor-pointer hover:opacity-90"
        >
          <Square size={12} fill="currentColor" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="rounded-[50%] bg-primary text-on-primary p-sm disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </form>
  );

  return (
    <div
      className={`fixed inset-0 z-100 flex justify-center px-sm sm:px-md ${
        big ? "items-stretch py-sm sm:py-[5vh]" : "items-start pt-[30vh]"
      }`}
    >
      <div className="absolute inset-0 bg-scrim/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Ask Bro"
        className={`relative w-full flex flex-col gap-sm ${
          big ? "max-w-[860px]" : "max-w-160"
        }`}
      >
        {/* The avatar sits outside the panel, over the input's left edge, so it can fly in while the panel fades up. */}
        <span ref={avatarRef} className={`absolute left-md z-10 inline-flex ${big ? "bottom-3" : "top-3"}`}>
          <BroAvatar size={32} state={avatarState} />
        </span>
        <div ref={panelRef} className={`flex flex-col gap-sm ${big ? "flex-1 min-h-0" : ""}`}>
          {!big && form}

          <div
            className={`rounded-2xl bg-surface-raised border border-outline-variant shadow-xl flex flex-col ${
              big ? "flex-1 min-h-0" : "glass"
            }`}
          >
            {big && (
              <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-outline-variant">
                {view === "chats" ? (
                  <button
                    type="button"
                    onClick={() => setView("chat")}
                    className="inline-flex items-center gap-xs font-serif font-bold text-body-lg text-on-surface hover:text-primary cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Past chats
                  </button>
                ) : (
                  <p className="font-serif font-bold text-body-lg text-on-surface">DiplomaBro</p>
                )}
                <div className="flex items-center gap-md">
                  {view === "chat" && chats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setView("chats")}
                      className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
                    >
                      <History size={14} /> Chats
                    </button>
                  )}
                  {hasSent && (
                    <button
                      type="button"
                      onClick={startNewChat}
                      title="New chat (Ctrl/⌘ Shift O)"
                      className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
                    >
                      <RotateCcw size={14} /> New chat
                    </button>
                  )}
                  <Link href="/bro" onClick={onClose} className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
                    <Maximize2 size={14} /> Full page
                  </Link>
                </div>
              </div>
            )}
            <div
              ref={scrollRef}
              aria-live="polite"
              className={`p-md overflow-y-auto flex flex-col gap-md ${big ? "flex-1 min-h-0 sm:px-lg" : "max-h-[45vh]"}`}
            >
              {!big ? (
                // Normal size: straight away, whatever is still loading.
                <div>
                  {question ? <BroStarters onPick={send} starters={QUESTION_STARTERS} label="About this question:" /> : <BroStarters onPick={send} />}
                  {chats.length > 0 && (
                    <button
                      type="button"
                      onClick={showChats}
                      className="mt-sm inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
                    >
                      <History size={14} /> Past chats
                    </button>
                  )}
                </div>
              ) : view === "chats" ? (
                <BroChatList chats={chats} currentId={conversationId} onOpen={open} onDelete={(id) => void deleteChat(id)} />
              ) : messages.length === 0 ? (
                loaded && (
                  <div className="m-auto text-center flex flex-col items-center gap-sm">
                    <p className="font-serif font-bold text-body-lg text-on-surface">New chat</p>
                    <BroStarters onPick={send} label="" starters={question ? QUESTION_STARTERS : undefined} />
                  </div>
                )
              ) : (
                <BroMessageList messages={messages} phase={phase} setMessages={setMessages} onRetry={retry} />
              )}
            </div>
            <p className={`text-label-sm text-on-surface-variant px-md pb-sm ${big ? "pt-xs sm:px-lg" : ""}`}>
              <Link href="/bro/memory" onClick={onClose} className="hover:text-primary underline-offset-2 hover:underline">
                What Bro remembers
              </Link>{" "}
              · Esc to close
              {remaining !== null && remaining <= 10 ? ` · ${remaining} message${remaining === 1 ? "" : "s"} left today` : ""}
            </p>
          </div>

          {big && form}
        </div>
      </div>
    </div>
  );
}

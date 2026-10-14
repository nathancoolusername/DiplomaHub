"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { BroAvatar } from "../BroAvatar";
import { BRO_BUTTON_ICON_ID, type BroOpenRequest } from "./bro-visibility";
import type { DiplomaBroState } from "./DiplomaBroIcon";

const FLY_MS = 420;

// UI ONLY: replies just echo the input. Phase 7 replaces `reply()` with the
// streaming Bro route (context builder, tools, quota checks on the server).

type Message = { role: "user" | "bro"; text: string };

const STARTERS = ["Plan my week", "What should I practise first?", "Add my next test"];

function reply(input: string): string {
  return `You said: “${input}”. (Bro isn't connected yet; this bar only echoes for now.)`;
}

function initialMessages(request: BroOpenRequest | null): Message[] {
  const out: Message[] = [];
  if (request?.context) out.push({ role: "bro", text: request.context });
  if (request?.prompt) out.push({ role: "user", text: request.prompt }, { role: "bro", text: reply(request.prompt) });
  return out;
}

export function BroBar({ onClose, request = null }: { onClose: () => void; request?: BroOpenRequest | null }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => initialMessages(request));
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Bro "answers" while it flies in, then settles.
  const [avatarState, setAvatarState] = useState<DiplomaBroState>("answering");

  // Opening: the icon flies from the bottom-right button into the bar (with a
  // turn and a slight overshoot), and the bar fades up behind it.
  useLayoutEffect(() => {
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "bro", text: reply(trimmed) }]);
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center px-md pt-[30vh]">
      <div className="absolute inset-0 bg-scrim/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-label="Ask Bro" className="relative w-full max-w-160 flex flex-col gap-sm">
        {/* The avatar sits outside the panel (over its left edge) so it can fly in while the panel fades up. */}
        <span ref={avatarRef} className="absolute left-md top-3 z-10 inline-flex">
          <BroAvatar size={32} state={avatarState} />
        </span>
        <div ref={panelRef} className="flex flex-col gap-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-sm rounded-2xl bg-surface-raised glass border border-outline-variant shadow-xl pl-[56px] pr-md py-sm"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Bro anything about your studies…"
            aria-label="Message Bro"
            className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant py-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send"
            className="rounded-[50%] bg-primary text-on-primary p-sm disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ArrowUp size={16} />
          </button>
        </form>

        <div className="rounded-2xl bg-surface-raised glass border border-outline-variant shadow-xl p-md max-h-[45vh] overflow-y-auto flex flex-col gap-sm">
          {messages.length === 0 ? (
            <>
              <p className="text-label-md text-on-surface-variant">Try one of these:</p>
              <div className="flex flex-wrap gap-xs">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface hover:border-primary hover:text-primary cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            messages.map((m, i) => (
              <p
                key={i}
                className={`text-body-md rounded-xl px-md py-sm max-w-[85%] ${
                  m.role === "user"
                    ? "self-end bg-primary text-on-primary"
                    : "self-start bg-surface-container text-on-surface"
                }`}
              >
                {m.text}
              </p>
            ))
          )}
          <p className="text-label-sm text-on-surface-variant mt-xs">Esc to close</p>
        </div>
        </div>
      </div>
    </div>
  );
}

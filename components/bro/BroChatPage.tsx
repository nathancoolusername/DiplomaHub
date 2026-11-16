"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square, Brain, RotateCcw, X } from "lucide-react";
import { BroAvatar } from "@/components/shared/BroAvatar";
import { BroMessageList, BroStarters } from "@/components/shared/bro/BroMessages";
import { useBroOverride } from "@/components/shared/bro/bro-visibility";
import { BroChatSidebar, BroChatsMenu } from "@/components/shared/bro/BroChatsMenu";
import { isNewChatShortcut, useBroChat } from "@/components/shared/bro/useBroChat";
import type { BroMemoryItem } from "@/lib/data/supabase/bro-memory";
import { MemoryManager } from "./MemoryManager";

// /bro for Pro students: the same chat as the Bro bar, on a full page.
// "Memory" opens What Bro remembers (a column beside the chat on wide
// screens, a drawer on phones); it starts closed. Past chats are a sidebar on
// the left on laptops and wider, and the "Chats" menu on smaller screens.
// Enter sends, Shift+Enter starts a new line, Ctrl/⌘ Shift O (or Ctrl/⌘ N
// where the browser allows it) starts a new chat.
export function BroChatPage({ memory }: { memory: BroMemoryItem[] }) {
  const { messages, setMessages, loaded, phase, busy, remaining, submit, newChat, hasSent, conversationId, chats, openChat, deleteChat, stop, retry } =
    useBroChat();
  const [input, setInput] = useState("");
  const [memoryOpen, setMemoryOpen] = useState(false);
  // Reload the memory panel when the chat saves, forgets or undoes something.
  const memoryKey = messages.reduce((n, m) => (m.role === "memory" ? n + 1 + (m.undone ? 1 : 0) : n), 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // The floating button would only open a second copy of this chat.
  useBroOverride(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isNewChatShortcut(e)) return;
      e.preventDefault();
      newChat();
      setInput("");
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [newChat]);

  // Grow the box with what's typed, up to about eight lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const startNew = () => {
    newChat();
    setInput("");
    inputRef.current?.focus();
  };

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    setInput("");
    submit(text);
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-sm sm:px-md flex gap-lg h-[calc(100dvh-4rem)]">
      <BroChatSidebar chats={chats} currentId={conversationId} onOpen={(id) => void openChat(id)} onDelete={(id) => void deleteChat(id)} onNew={startNew} />
    <div className="flex-1 min-w-0 max-w-[900px] mx-auto flex flex-col">
      <header className="flex items-center justify-between gap-md py-md border-b border-outline-variant">
        <div className="flex items-center gap-sm">
          <BroAvatar size={40} state={phase === "thinking" ? "thinking" : phase === "answering" ? "answering" : "idle"} />
          <div>
            <h1 className="font-serif font-bold text-headline-sm text-on-surface leading-tight">DiplomaBro</h1>
            <p className="text-label-md text-on-surface-variant">{phase === "thinking" ? "Thinking…" : phase === "answering" ? "Typing…" : "Your study partner"}</p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          {/* On laptops the chats are in the sidebar instead. */}
          <div className="lg:hidden">
            <BroChatsMenu chats={chats} currentId={conversationId} onOpen={(id) => void openChat(id)} onDelete={(id) => void deleteChat(id)} />
          </div>
          <button
            type="button"
            onClick={() => setMemoryOpen((o) => !o)}
            aria-expanded={memoryOpen}
            className={`inline-flex items-center gap-xs text-label-md cursor-pointer hover:text-primary ${memoryOpen ? "text-primary" : "text-on-surface-variant"}`}
          >
            <Brain size={14} /> Memory
          </button>
          {hasSent && (
            <button
              type="button"
              onClick={startNew}
              title="New chat (Ctrl/⌘ Shift O)"
              className="inline-flex lg:hidden items-center gap-xs text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <RotateCcw size={14} /> New chat
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} aria-live="polite" className="flex-1 min-h-0 overflow-y-auto py-lg px-xs flex flex-col gap-md">
        {messages.length === 0 ? (
          loaded && (
            <div className="m-auto flex flex-col items-center text-center gap-md max-w-120">
              <BroAvatar size={64} />
              <p className="font-serif font-bold text-headline-sm text-on-surface">What are we working on?</p>
              <p className="text-body-md text-on-surface-variant">Bro knows your subjects, your next tests and your weakest topics. Ask it anything about your studies.</p>
              <BroStarters onPick={send} label="" />
            </div>
          )
        ) : (
          <BroMessageList messages={messages} phase={phase} setMessages={setMessages} size="lg" onRetry={retry} />
        )}
      </div>

      <div className="pb-md pt-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-sm rounded-2xl bg-surface-raised border border-outline-variant shadow-lg pl-md pr-sm py-sm focus-within:border-primary"
        >
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            maxLength={2000}
            placeholder={busy ? "Bro is answering…" : hasSent ? "Reply to Bro…" : "Ask Bro anything about your studies…"}
            aria-label="Message Bro"
            className="flex-1 resize-none bg-transparent outline-none text-body-lg text-on-surface placeholder:text-on-surface-variant py-xs"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop"
              title="Stop"
              className="rounded-[50%] bg-on-surface text-surface p-sm cursor-pointer hover:opacity-90"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="rounded-[50%] bg-primary text-on-primary p-sm disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </form>
        <p className="text-label-sm text-on-surface-variant mt-xs px-xs">
          Enter to send, Shift+Enter for a new line. Bro can be wrong: tap &ldquo;This is wrong&rdquo; under a reply to tell us.
          {remaining !== null && remaining <= 10 ? ` ${remaining} message${remaining === 1 ? "" : "s"} left today.` : ""}
        </p>
      </div>
    </div>

      {/* What Bro remembers: a column on wide screens, a drawer on phones and tablets. */}
      <aside
        aria-label="What Bro remembers"
        className={memoryOpen ? "fixed inset-0 z-100 flex lg:static lg:z-auto lg:w-[320px] lg:shrink-0 lg:py-md" : "hidden"}
      >
        <div className="absolute inset-0 bg-scrim/50 lg:hidden" onClick={() => setMemoryOpen(false)} aria-hidden="true" />
        <div className="relative ml-auto h-full w-[min(360px,90vw)] lg:w-full bg-surface lg:bg-transparent border-l border-outline-variant lg:border lg:rounded-2xl lg:bg-surface-container-lowest flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-sm p-md border-b border-outline-variant">
            <div>
              <h2 className="font-serif font-bold text-body-lg text-on-surface flex items-center gap-xs">
                <Brain size={16} className="text-primary" aria-hidden="true" /> What Bro remembers
              </h2>
              <p className="text-label-sm text-on-surface-variant">Never health, family, religion or where you live. Edit or delete anything.</p>
            </div>
            <button type="button" onClick={() => setMemoryOpen(false)} aria-label="Close" className="text-on-surface-variant hover:text-primary cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-md">
            <MemoryManager initial={memory} compact refreshKey={memoryKey} />
          </div>
        </div>
      </aside>
    </div>
  );
}

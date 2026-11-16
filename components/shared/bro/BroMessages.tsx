"use client";

import { useEffect, useState } from "react";
import { Brain, Flag, LineChart, RotateCcw } from "lucide-react";
import { deleteMemoryItem } from "@/app/lib/actions/bro-memory";
import { removeResult } from "@/app/lib/actions/results";
import { BroAvatar } from "../BroAvatar";
import { MathMarkdown } from "../MathMarkdown";
import type { BroChatMessage, BroPhase } from "./useBroChat";
import { BroCardView, BroLinkChip } from "./BroCards";

const BRO_MD = { a: BroLinkChip };

// The conversation as both the Bro bar and /bro show it: Bro's replies with
// its avatar, a typing indicator until the first words arrive, a blinking
// caret while they stream, "This is wrong" under each reply, and the
// "Bro noted … Undo" lines.

export const BRO_STARTERS = ["Plan my week", "What should I practise first?", "Explain my weakest topic"];

/** Starters when a practice question is attached: hints first, the answer only on request. */
export const QUESTION_STARTERS = ["Give me a hint", "Explain the markscheme", "Where did I lose marks?", "Show me the full answer"];

export function BroStarters({
  onPick,
  label = "Try one of these:",
  starters = BRO_STARTERS,
}: {
  onPick: (text: string) => void;
  label?: string;
  starters?: string[];
}) {
  return (
    <div className="flex flex-col gap-sm">
      {label && <p className="text-label-md text-on-surface-variant">{label}</p>}
      <div className="flex flex-wrap gap-xs">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border border-outline-variant px-md py-xs text-label-md text-on-surface hover:border-primary hover:text-primary cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Three dots bouncing in turn: Bro is thinking. */
/** What Bro is doing while a tool runs, with a soft pulse. */
function BroStatus({ text, className = "" }: { text: string; className?: string }) {
  // A step that takes a while says so, so the wait never looks stuck.
  const [slowFor, setSlowFor] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSlowFor(text), 8000);
    return () => clearTimeout(t);
  }, [text]);
  const shown = slowFor === text ? `${text.replace(/…$/, "")}, still on it…` : text;
  return (
    <span role="status" className={`inline-flex items-center gap-sm text-label-md text-on-surface-variant ${className}`}>
      <span className="relative inline-flex size-2" aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-primary opacity-60 animate-ping" />
        <span className="relative size-2 rounded-full bg-primary" />
      </span>
      <span key={shown} className="bro-in">{shown}</span>
    </span>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[5px] py-[6px]" role="status" aria-label="Bro is typing">
      <span className="bro-dot" />
      <span className="bro-dot [animation-delay:150ms]" />
      <span className="bro-dot [animation-delay:300ms]" />
    </span>
  );
}

export function BroMessageList({
  messages,
  phase,
  setMessages,
  size = "md",
  onRetry,
}: {
  messages: BroChatMessage[];
  phase: BroPhase;
  setMessages: React.Dispatch<React.SetStateAction<BroChatMessage[]>>;
  /** "Try again" under a failed last reply. */
  onRetry?: () => void;
  /** lg on the full page: a little more room and type. */
  size?: "md" | "lg";
}) {
  const lastBro = messages.findLastIndex((m) => m.role === "bro");
  const text = size === "lg" ? "text-body-lg" : "text-body-md";
  return (
    <>
      {messages.map((m, i) => {
        if (m.role === "memory") {
          return (
            <MemoryNote
              key={i}
              note={m}
              onUndone={() => setMessages((all) => all.map((x, j) => (j === i ? { ...m, undone: true } : x)))}
            />
          );
        }
        if (m.role === "result") {
          return (
            <ResultNote
              key={i}
              note={m}
              onUndone={() => setMessages((all) => all.map((x, j) => (j === i ? { ...m, undone: true } : x)))}
            />
          );
        }
        if (m.role === "user") {
          return (
            <p key={i} className={`bro-in ${text} rounded-2xl rounded-br-md px-md py-sm max-w-[85%] self-end bg-primary text-on-primary whitespace-pre-wrap break-words`}>
              {m.text}
            </p>
          );
        }
        const live = i === lastBro && phase !== "idle";
        return (
          <div key={i} className="bro-in self-start max-w-[92%] flex items-start gap-sm">
            <BroAvatar size={size === "lg" ? 32 : 28} state={live ? (phase === "thinking" ? "thinking" : "answering") : "idle"} className="mt-0.5" />
            <div className="flex flex-col gap-xs min-w-0">
              <div
                className={`${text} rounded-2xl rounded-tl-md px-md py-sm bg-surface-container ${
                  m.error ? "text-on-surface-variant italic" : "text-on-surface"
                } ${live && m.text ? "bro-streaming" : ""}`}
              >
                {m.text ? <MathMarkdown components={BRO_MD}>{m.text}</MathMarkdown> : m.status && live ? <BroStatus text={m.status} /> : <TypingDots />}
              </div>
              {m.text && m.status && live && <BroStatus text={m.status} className="px-xs" />}
              {m.note && <p className="px-xs text-label-sm text-on-surface-variant italic">{m.note}</p>}
              {m.error && onRetry && i === messages.length - 1 && phase === "idle" && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="self-start inline-flex items-center gap-xs rounded-full border border-outline-variant px-sm py-0.5 text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary cursor-pointer"
                >
                  <RotateCcw size={12} aria-hidden="true" /> Try again
                </button>
              )}
              {m.cards?.map((c, ci) => (
                <BroCardView
                  key={ci}
                  card={c}
                  index={ci}
                  messageId={m.id}
                  onChange={(next) =>
                    setMessages((all) => all.map((x, j) => (j === i && x.role === "bro" ? { ...x, cards: x.cards?.map((y, k) => (k === ci ? next : y)) } : x)))
                  }
                />
              ))}
              {m.id !== undefined && !m.error && (
                <FlagReply
                  messageId={m.id}
                  flagged={!!m.flagged}
                  onFlagged={() => setMessages((all) => all.map((x) => (x.role === "bro" && x.id === m.id ? { ...x, flagged: true } : x)))}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

const REASONS = [
  { id: "wrong", label: "Wrong answer" },
  { id: "ib_fact", label: "Wrong about the IB" },
  { id: "unhelpful", label: "Not helpful" },
  { id: "other", label: "Something else" },
] as const;

/** "This is wrong" under one of Bro's replies: pick a reason, add a note if you like. */
function FlagReply({ messageId, flagged, onFlagged }: { messageId: number; flagged: boolean; onFlagged: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"] | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (flagged) {
    return <p className="text-label-sm text-on-surface-variant inline-flex items-center gap-xs px-xs"><Flag size={12} aria-hidden="true" /> Flagged. Thanks, we&apos;ll look at it.</p>;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start inline-flex items-center gap-xs px-xs text-label-sm text-on-surface-variant hover:text-error cursor-pointer"
      >
        <Flag size={12} aria-hidden="true" /> This is wrong
      </button>
    );
  }

  const send = async () => {
    if (!reason) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/bro/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, reason, note }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !body.ok) throw new Error(body.message ?? "Couldn't send the flag. Try again?");
      onFlagged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the flag. Try again?");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-sm flex flex-col gap-xs">
      <p className="text-label-md font-semibold text-on-surface">What&apos;s wrong with this reply?</p>
      <div className="flex flex-wrap gap-xs">
        {REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={reason === r.id}
            onClick={() => setReason(r.id)}
            className={`rounded-full border px-md py-xs text-label-md cursor-pointer ${
              reason === r.id ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface hover:border-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="What should it have said? (optional)"
        aria-label="Note about this reply"
        className="rounded-lg border border-outline-variant bg-transparent px-sm py-xs text-body-md text-on-surface outline-none focus:border-primary"
      />
      <p className="text-label-sm text-on-surface-variant">The DiplomaHub team will read this reply and your question before it, to fix Bro.</p>
      {error && <p role="alert" className="text-label-sm text-error">{error}</p>}
      <div className="flex gap-sm justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer px-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={send}
          disabled={!reason || sending}
          className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          {sending ? "Sending…" : "Send flag"}
        </button>
      </div>
    </div>
  );
}

/** "Bro noted: …" with Undo, or "Bro forgot: …", between messages. */
function MemoryNote({ note, onUndone }: { note: Extract<BroChatMessage, { role: "memory" }>; onUndone: () => void }) {
  const [busy, setBusy] = useState(false);
  const undo = async () => {
    if (note.memoryId === undefined) return;
    setBusy(true);
    const res = await deleteMemoryItem(note.memoryId);
    setBusy(false);
    if (res.success) onUndone();
  };
  return (
    <p className="self-start inline-flex flex-wrap items-center gap-xs text-label-sm text-on-surface-variant px-xs">
      <Brain size={12} aria-hidden="true" />
      {note.memoryId === undefined ? (
        <span>Bro forgot: {note.text}</span>
      ) : note.undone ? (
        <span className="line-through">Bro noted: {note.text}</span>
      ) : (
        <>
          <span>Bro noted: {note.text}</span>
          <button type="button" onClick={undo} disabled={busy} className="font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50">
            Undo
          </button>
        </>
      )}
    </p>
  );
}

/** "Bro logged: Unit 3 test, grade 6" with Undo, between messages. */
function ResultNote({ note, onUndone }: { note: Extract<BroChatMessage, { role: "result" }>; onUndone: () => void }) {
  const [busy, setBusy] = useState(false);
  const undo = async () => {
    setBusy(true);
    const res = await removeResult(note.resultId);
    setBusy(false);
    if (res.success) onUndone();
  };
  return (
    <p className="self-start inline-flex flex-wrap items-center gap-xs text-label-sm text-on-surface-variant px-xs">
      <LineChart size={12} aria-hidden="true" />
      <span className={note.undone ? "line-through" : ""}>
        Bro logged on <a href="/progress" className="underline hover:text-primary">Progress</a>: {note.text}
      </span>
      {!note.undone && (
        <button type="button" onClick={undo} disabled={busy} className="font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50">
          Undo
        </button>
      )}
    </p>
  );
}

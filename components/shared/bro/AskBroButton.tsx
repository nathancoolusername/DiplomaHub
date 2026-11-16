"use client";

import { BroAvatar } from "../BroAvatar";
import { openBro } from "./bro-visibility";

/** "Ask Bro" on one practice question (marking, results): opens the bar with that question attached. Pro only. */
export function AskBroButton({ attemptId, questionId, label, isPro }: { attemptId: string; questionId: string; label: string; isPro: boolean }) {
  if (!isPro) return null;
  return (
    <button
      type="button"
      onClick={() => openBro({ question: { attemptId, questionId, label } })}
      className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-sm py-0.5 text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary cursor-pointer"
    >
      <BroAvatar size={16} /> Ask Bro
    </button>
  );
}

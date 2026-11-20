"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { DeadlineRoom } from "@/components/deadline/DeadlineRoom";
import { useRoom } from "@/lib/deadline/useRoom";
import type { RoomState } from "@/lib/deadline/types";

const GONE: Record<string, string> = {
  not_found: "This room has closed.",
  not_member: "You're no longer in this room.",
};

/** A live room: the hook keeps the state, chat and clock in step with Supabase. */
export function LiveRoom({ code, initial }: { code: string; initial: RoomState }) {
  const { state, offset, messages, reactions, actions, load, live, logEvent, typing, onTyping } = useRoom(code, initial);

  // "Reconnecting…" once the live connection has been down for 2 s (not while it first connects).
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (live) return;
    const t = setTimeout(() => setDown(true), 2000);
    return () => { clearTimeout(t); setDown(false); };
  }, [live]);

  if (load.status === "gone") {
    return (
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <p className="font-serif font-bold text-headline-md text-on-surface">{GONE[load.reason] ?? "This room isn't available."}</p>
        <Link href="/play/deadline" className="rounded-full bg-primary text-on-primary px-lg py-sm font-semibold">Back to Deadline</Link>
      </div>
    );
  }
  return (
    <>
      {down && (
        <p role="status" className="fixed left-1/2 top-sm z-[75] -translate-x-1/2 inline-flex items-center gap-xs rounded-full bg-inverse-surface text-inverse-on-surface px-md py-xs text-label-md font-semibold shadow-lg">
          <WifiOff size={14} aria-hidden="true" />Reconnecting… the game keeps checking in
        </p>
      )}
      <DeadlineRoom state={state} offset={offset} messages={messages} reactions={reactions} actions={actions} onEvent={(k) => logEvent(k)}
        typing={typing} onTyping={onTyping} />
    </>
  );
}

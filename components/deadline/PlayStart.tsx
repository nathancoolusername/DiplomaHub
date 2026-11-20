"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Plus, Users } from "lucide-react";
import { createRoomAction, joinWithCodeAction } from "@/app/play/deadline/actions";
import { CODE_ALPHABET } from "@/lib/codes";

/** Create a room, or join one with its 4-character code. */
export function PlayStart() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid sm:grid-cols-2 gap-md">
      <button type="button" disabled={pending}
        onClick={() => start(async () => { const r = await createRoomAction(null); if (r?.error) setError(r.error); })}
        className="flex flex-col items-start gap-xs rounded-2xl bg-primary text-on-primary p-lg text-left disabled:opacity-60 cursor-pointer">
        <Plus size={22} aria-hidden="true" />
        <span className="font-serif font-bold text-headline-md">{pending ? "Making a room…" : "Create a room"}</span>
        <span className="text-body-md text-on-primary/80">Get a code to send your friends. 2–8 players.</span>
      </button>
      <form
        onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await joinWithCodeAction(code); if (r?.error) setError(r.error); }); }}
        className="flex flex-col gap-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg">
        <label htmlFor="dl-code" className="flex items-center gap-xs font-serif font-bold text-headline-md text-on-surface">
          <Users size={22} aria-hidden="true" className="text-primary" />Join with a code
        </label>
        <div className="flex gap-xs">
          <input id="dl-code" value={code} inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="K7MP"
            onChange={(e) => { setCode(e.target.value.toUpperCase().split("").filter((c) => CODE_ALPHABET.includes(c)).join("").slice(0, 4)); setError(null); }}
            className="w-full min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm font-mono text-headline-md tracking-[0.3em] uppercase text-on-surface outline-none focus:border-primary" />
          <button type="submit" disabled={code.length !== 4 || pending} aria-label="Join"
            className="rounded-xl bg-primary text-on-primary px-md disabled:opacity-40 cursor-pointer"><ArrowRight size={20} /></button>
        </div>
      </form>
      {error && <p className="sm:col-span-2 text-body-md text-error" role="alert">{error}</p>}
    </div>
  );
}

/** "Start a game" for a squad: a room only its members can find from the squad. */
export function SquadGameButton({ squadId, className = "" }: { squadId: string; className?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-xs">
      <button type="button" disabled={pending}
        onClick={() => start(async () => { const r = await createRoomAction(squadId); if (r?.error) setError(r.error); })}
        className={`inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold disabled:opacity-60 cursor-pointer ${className}`}>
        <Plus size={14} aria-hidden="true" />{pending ? "Making a room…" : "Start a Deadline game"}
      </button>
      {error && <span className="text-label-sm text-error">{error}</span>}
    </span>
  );
}

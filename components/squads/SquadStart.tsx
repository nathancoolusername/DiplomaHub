"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { createSquadAction, joinSquadAction } from "@/app/squads/actions";
import { Spinner } from "@/components/spinner";
import { JOIN_MESSAGES } from "@/lib/squads";


const field = "flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant";
const primary = "inline-flex items-center justify-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer";

/** Create a squad or join one with a code. */
export function SquadStart({ first, initialCode = "" }: { first: boolean; initialCode?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<{ where: "create" | "join"; text: string } | null>(null);
  const [busy, start] = useTransition();
  const [notSquad, setNotSquad] = useState<string | null>(null);

  const create = () =>
    start(async () => {
      setError(null);
      try {
        const r = await createSquadAction(name);
        router.push(`/squads/${r.id}`);
      } catch (e) {
        setError({ where: "create", text: e instanceof Error ? e.message : "Couldn't create the squad" });
      }
    });
  const join = () =>
    start(async () => {
      setError(null);
      const r = await joinSquadAction(code).catch(() => null);
      if (!r) return setError({ where: "join", text: "Couldn't join just now. Try again." });
      if (!r.ok) {
        // Older practice set codes are 6 characters too: send those to the Codes page.
        if (r.reason === "not_found") setNotSquad(code.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
        return setError({ where: "join", text: JOIN_MESSAGES[r.reason] ?? "Couldn't join that squad." });
      }
      router.push(`/squads/${r.id}`);
    });

  return (
    <div className="grid md:grid-cols-2 gap-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
        className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-sm"
      >
        <h2 className="font-serif font-bold text-headline-md text-on-surface flex items-center gap-xs">
          <Plus size={20} className="text-primary" aria-hidden="true" /> {first ? "Start a squad" : "Start another"}
        </h2>
        <p className="text-body-md text-on-surface-variant">Name it, then send the code to your friends.</p>
        <div className="flex gap-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Paper 2 Survivors" aria-label="Squad name" className={field} />
          <button type="submit" disabled={busy || !name.trim()} className={primary}>
            {busy ? <Spinner size={14} /> : "Create"}
          </button>
        </div>
        {error?.where === "create" && <p className="text-label-md text-error">{error.text}</p>}
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          join();
        }}
        className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-sm"
      >
        <h2 className="font-serif font-bold text-headline-md text-on-surface flex items-center gap-xs">
          <UserPlus size={20} className="text-primary" aria-hidden="true" /> Join a squad
        </h2>
        <p className="text-body-md text-on-surface-variant">Got a 6-character code from a friend?</p>
        <div className="flex gap-sm">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABC234"
            aria-label="Squad code"
            autoComplete="off"
            className={`${field} font-mono tracking-[0.2em] uppercase`}
          />
          <button type="submit" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 6} className={primary}>
            {busy ? <Spinner size={14} /> : "Join"}
          </button>
        </div>
        {error?.where === "join" && <p className="text-label-md text-error">{error.text}</p>}
        {error?.where === "join" && notSquad && (
          <Link href={`/codes?c=${notSquad}&set=1`} className="text-label-md font-semibold text-primary hover:underline">
            Is it a practice set code? Open it on the Codes page
          </Link>
        )}
      </form>
    </div>
  );
}

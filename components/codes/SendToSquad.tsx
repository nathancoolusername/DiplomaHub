"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Check, Users } from "lucide-react";
import { mySquadsAction, shareResourceToSquadAction, shareToSquadAction } from "@/app/squads/actions";
import { Spinner } from "@/components/spinner";

/**
 * In every share dialog (and on resource pages): send it to one of your
 * squads, where it lands on the squad's shelf for everyone else.
 */
export function SendToSquad({ code, resourceId, bare = false }: { code?: string; resourceId?: string; /** No divider or heading (inside its own popover). */ bare?: boolean }) {
  const [squads, setSquads] = useState<{ id: string; name: string; members: number }[] | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    mySquadsAction()
      .then((s) => !cancelled && setSquads(s))
      .catch(() => !cancelled && setSquads([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (squads === null) return null;

  if (squads.length === 0)
    return (
      <p className="text-center text-label-md text-on-surface-variant">
        <Users size={14} className="inline -mt-0.5 mr-xs text-primary" aria-hidden="true" />
        <Link href="/squads" className="font-semibold text-primary hover:underline">
          Start a squad
        </Link>{" "}
        to send things to your friends in one tap.
      </p>
    );

  const send = (id: string) =>
    start(async () => {
      setError(null);
      setSending(id);
      try {
        if (resourceId) await shareResourceToSquadAction(id, resourceId);
        else if (code) await shareToSquadAction(id, code);
        setSent((s) => [...s, id]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't send it");
      } finally {
        setSending(null);
      }
    });

  return (
    <div className={`flex flex-col gap-xs ${bare ? "" : "border-t border-outline-variant pt-md"}`}>
      <p className="text-label-md font-semibold text-on-surface flex items-center gap-xs">
        <Users size={14} className="text-primary" aria-hidden="true" /> Send to your squad
      </p>
      <div className="flex flex-wrap gap-xs">
        {squads.map((s) => {
          const done = sent.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              disabled={done || sending !== null}
              onClick={() => send(s.id)}
              className={`inline-flex items-center gap-xs rounded-full px-md py-xs text-label-md font-semibold border cursor-pointer disabled:cursor-default ${
                done ? "bg-secondary-container text-on-secondary-container border-transparent" : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
              }`}
            >
              {sending === s.id ? <Spinner size={12} /> : done ? <Check size={12} aria-hidden="true" /> : null}
              {done ? `On ${s.name}'s shelf` : s.name}
            </button>
          );
        })}
      </div>
      {error && <p className="text-label-sm text-error">{error}</p>}
    </div>
  );
}

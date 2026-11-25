"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, RotateCcw, Trophy, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { TIERS } from "@/lib/deadline/config";
import type { RoomActions, RoomState } from "@/lib/deadline/types";
import { nameOf, Points, WinsBadge } from "./bits";
import { GuestUpgrade } from "./Guest";
import { SubjectPicker } from "./SubjectPicker";
import { PlayerMenu } from "./PlayerMenu";
import { Confetti, playerColors, seatAvatarClass } from "./fx";

/** The winner, everyone's place, the rarest answer, Play again and Save as squad. */
export function EndScreen({ state, actions }: { state: RoomState; actions: Pick<RoomActions, "start" | "leave" | "saveSquad" | "listSubjects" | "setSubjects" | "kick" | "mute"> }) {
  const { room, players, me, end } = state;
  const byId = new Map(players.map((p) => [p.user_id, p]));
  const winner = end?.winner_id ? byId.get(end.winner_id) : null;
  const isHost = room.host_id === me;
  const [again, setAgain] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [saving, setSaving] = useState(false);
  const [squadMsg, setSquadMsg] = useState<string | null>(null);
  const SQUAD_REASONS: Record<string, string> = {
    too_many: "You're already in 5 squads.",
    rate_limited: "That's a lot of new squads today. Try tomorrow.",
    already_squad: "This room is already a squad's room.",
  };

  const colors = playerColors(players.map((p) => p.user_id));
  const podium = end ? [2, 1, 3].map((place) => end.places.find((pl) => pl.place === place)).filter((pl) => !!pl) : [];
  const rest = end ? end.places.filter((pl) => pl.place > 3) : [];
  const HEIGHT: Record<number, string> = { 1: "h-[5.5rem]", 2: "h-[3.75rem]", 3: "h-[2.75rem]" };

  async function saveSquad(e: React.FormEvent) {
    e.preventDefault();
    if (!squadName.trim()) return;
    setSaving(true);
    const r = await actions.saveSquad(squadName.trim());
    setSaving(false);
    setSquadMsg(r.ok ? "Squad saved! Everyone here can join it in one tap." : SQUAD_REASONS[r.reason ?? ""] ?? "Couldn't save the squad.");
  }

  return (
    <div className="flex flex-col items-center gap-lg text-center">
      {winner && <Confetti seed={`${room.id}:${room.game_no}`} count={80} top="22%" />}
      <div className="dl-flash flex flex-col items-center gap-sm" style={{ animationFillMode: "backwards", animationDuration: "700ms" }}>
        <Trophy size={40} className="text-tertiary" aria-hidden="true" />
        {winner ? (
          <>
            <Avatar src={winner.avatar_url} name={nameOf(winner)} size={88} className="ring-4 ring-tertiary-container" />
            <h2 className="font-serif font-bold text-headline-lg text-on-surface">{winner.user_id === me ? "You won!" : `${nameOf(winner)} wins!`}</h2>
            <WinsBadge wins={winner.wins} className="text-label-md px-sm" />
          </>
        ) : (
          <h2 className="font-serif font-bold text-headline-lg text-on-surface">Game over</h2>
        )}
      </div>

      {end?.rarest && (
        <div className="rounded-2xl border-2 bg-surface-container-lowest px-lg py-sm" style={{ borderColor: TIERS[end.rarest.points]?.color }}>
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">{end.rarest.points === 7 ? `Rarest answer · ${TIERS[7].label}` : "Rarest answer"}</p>
          <p className="font-serif font-bold text-headline-md text-on-surface">“{end.rarest.answer}” <Points n={end.rarest.points} /></p>
          <p className="text-label-md text-on-surface-variant">by {end.rarest.user_id === me ? "you" : nameOf(byId.get(end.rarest.user_id))}</p>
        </div>
      )}

      {podium.length > 1 && (
        <ol className="flex items-end justify-center gap-sm w-full max-w-[24rem]" aria-label="Podium">
          {podium.map((pl, i) => {
            const p = byId.get(pl.user_id);
            return (
              <li key={pl.user_id} style={{ "--seat": colors.get(pl.user_id) } as React.CSSProperties} className="flex-1 flex flex-col items-center gap-xs min-w-0">
                <PlayerMenu player={p} enabled={isHost && pl.user_id !== me} actions={actions}>
                  <Avatar src={p?.avatar_url} name={nameOf(p)} size={pl.place === 1 ? 48 : 40} className={`${seatAvatarClass} ring-2 ring-(--seat)`} />
                </PlayerMenu>
                <span className="max-w-full truncate text-label-md font-semibold text-on-surface">{pl.user_id === me ? "You" : nameOf(p)}</span>
                <span className="text-label-sm tabular-nums text-on-surface-variant">{pl.points} pts</span>
                <span className={`dl-rise w-full ${HEIGHT[pl.place]} rounded-t-xl bg-(--seat)/25 border-2 border-b-0 border-(--seat)/60 flex items-start justify-center pt-xs font-black text-headline-md text-on-surface`}
                  style={{ animationDelay: `${[250, 0, 450][i]}ms` }}>
                  {pl.place}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {end && (podium.length <= 1 || rest.length > 0) && (
        <ol className="w-full max-w-[24rem] flex flex-col gap-xs" aria-label="Results">
          {(podium.length > 1 ? rest : end.places).map((pl) => {
            const p = byId.get(pl.user_id);
            return (
              <li key={pl.user_id} className={`flex items-center gap-sm rounded-xl px-sm py-xs ${pl.user_id === me ? "bg-primary/10" : "bg-surface-container-lowest"}`}>
                <span className="w-6 text-label-md font-bold tabular-nums text-on-surface-variant">{pl.place}</span>
                <PlayerMenu player={p} enabled={isHost && pl.user_id !== me} actions={actions}>
                  <Avatar src={p?.avatar_url} name={nameOf(p)} size={28} />
                </PlayerMenu>
                <span className="flex-1 truncate text-left text-body-md font-semibold text-on-surface">{pl.user_id === me ? "You" : nameOf(p)}</span>
                <span className="text-body-md tabular-nums text-on-surface-variant">{pl.points} pts</span>
              </li>
            );
          })}
        </ol>
      )}

      <SubjectPicker chosen={room.settings.subjects ?? []} isHost={isHost} actions={actions} />

      <div className="flex flex-wrap justify-center gap-sm">
        {isHost ? (
          <button type="button" disabled={again} onClick={async () => { setAgain(true); await actions.start(); setAgain(false); }}
            className="inline-flex items-center gap-sm rounded-2xl bg-primary text-on-primary px-lg py-sm text-body-lg font-bold disabled:opacity-50 cursor-pointer">
            <RotateCcw size={18} aria-hidden="true" />{again ? "Starting…" : "Play again"}
          </button>
        ) : (
          <p className="text-body-md text-on-surface-variant self-center">Waiting for {nameOf(byId.get(room.host_id))} to play again…</p>
        )}
      </div>

      {byId.get(me)?.guest && <GuestUpgrade next={`/play/deadline/${room.code}`} className="w-full max-w-[28rem]" />}

      {!room.squad_id && !byId.get(me)?.guest && (
        room.saved_squad ? (
          room.saved_squad.member ? (
            <p className="text-label-md text-on-surface-variant inline-flex items-center gap-xs"><Users size={14} aria-hidden="true" />Saved as the squad “{room.saved_squad.name}”.</p>
          ) : (
            <Link href={`/join/${room.saved_squad.code}`} className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary">
              <Users size={14} aria-hidden="true" />Join the squad “{room.saved_squad.name}”
            </Link>
          )
        ) : (
          <form onSubmit={saveSquad} className="w-full max-w-[24rem] flex flex-col gap-xs">
            <p className="text-label-md text-on-surface-variant">Play together again? Save this group as a squad.</p>
            <div className="flex gap-xs">
              <input value={squadName} onChange={(e) => setSquadName(e.target.value.slice(0, 40))} placeholder="Squad name"
                className="flex-1 rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-body-md text-on-surface outline-none focus:border-primary" />
              <button type="submit" disabled={saving || !squadName.trim()} className="rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface disabled:opacity-50 cursor-pointer">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {squadMsg && <p className="text-label-md text-on-surface-variant">{squadMsg}</p>}
          </form>
        )
      )}

      <button type="button" onClick={() => void actions.leave()} className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-error cursor-pointer">
        <LogOut size={14} aria-hidden="true" />Leave room
      </button>
    </div>
  );
}

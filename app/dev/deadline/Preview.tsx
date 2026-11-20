"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DeadlineRoom } from "@/components/deadline/DeadlineRoom";
import { BONUS_EVERY, MAX_EXTENSIONS, START_EXTENSIONS, TURN_MS } from "@/lib/deadline/config";
import type { ChatMessage, Reaction, RoomActions, RoomPlayer, RoomRound, RoomState, SubmitResult } from "@/lib/deadline/types";

// Dev-only: a small fake engine that follows the game's rules closely enough
// to see every screen. Made-up prompts (the real bank stays private).
const PROMPTS: { text: string; answers: [string, number][] }[] = [
  { text: "Name a fruit", answers: [["Apple", 1], ["Banana", 1], ["Orange", 1], ["Mango", 2], ["Kiwi", 2], ["Lychee", 4], ["Durian", 5], ["Rambutan", 6], ["Salak", 7]] },
  { text: "Name a board game", answers: [["Chess", 1], ["Monopoly", 1], ["Scrabble", 2], ["Cluedo", 3], ["Risk", 3], ["Catan", 4], ["Carcassonne", 5], ["Go", 4], ["Mancala", 6]] },
  { text: "Name a pizza topping", answers: [["Cheese", 1], ["Pepperoni", 1], ["Mushroom", 1], ["Olives", 2], ["Pineapple", 2], ["Anchovies", 4], ["Artichoke", 5], ["Capers", 6]] },
  { text: "Name a breakfast food", answers: [["Toast", 1], ["Cereal", 1], ["Pancakes", 1], ["Porridge", 2], ["Croissant", 2], ["Bagel", 3], ["Shakshuka", 5], ["Congee", 6]] },
  { text: "Name an ice cream flavour", answers: [["Vanilla", 1], ["Chocolate", 1], ["Strawberry", 1], ["Mint", 2], ["Pistachio", 3], ["Rum raisin", 5], ["Ube", 7]] },
  { text: "Name a dog breed", answers: [["Labrador", 1], ["Poodle", 1], ["Beagle", 2], ["Dachshund", 3], ["Corgi", 2], ["Husky", 2], ["Vizsla", 6], ["Basenji", 7]] },
];
const ME = "me";
const BOTS = [["b1", "Maya", 12], ["b2", "Leo", 3], ["b3", "Aarav", 0], ["b4", "Sofia", 27], ["b5", "Jonas", 1]] as const;
const LINES = ["no way 😭", "who knew that one", "ok that was rare", "my brain is empty", "gg", "lol", "TOO FAST", "wait what"];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^(the|a|an) /, "").replace(/s$/, "");
function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const iso = (ms = Date.now()) => new Date(ms).toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function player(id: string, name: string, wins: number): RoomPlayer {
  return { user_id: id, name, avatar_url: null, seat: null, extensions: START_EXTENSIONS, points: 0, is_out: false, waiting: false, muted: false, wins, last_seen: iso() };
}
function lobby(n: number, meHost: boolean): RoomState {
  const players = [player(ME, "Nathan", 5), ...BOTS.slice(0, n - 1).map(([id, name, w]) => player(id, name, w))];
  return {
    ok: true, server_now: iso(), me: ME,
    room: { id: "room", code: "K7MP", status: "lobby", host_id: meHost ? ME : "b1", squad_id: null, settings: { mix: "mixed" }, version: 1, game_no: 0, last_event: null, saved_squad: null },
    players, round: null, end: null,
  };
}

type Engine = { state: RoomState; used: number[]; promptIdx: number; turns: number };
const active = (s: RoomState) => s.players.filter((p) => p.seat !== null && !p.is_out);
function nextHolder(s: RoomState, after: string) {
  const seats = active(s).sort((a, b) => a.seat! - b.seat!);
  const me = s.players.find((p) => p.user_id === after)!;
  return (seats.find((p) => p.seat! > me.seat!) ?? seats[0]).user_id;
}
function openRound(e: Engine, holder: string, overtimeForce = false): Engine {
  const unused = PROMPTS.map((_, i) => i).filter((i) => !e.used.includes(i));
  const idx = unused.length ? unused[Math.floor(Math.random() * unused.length)] : Math.floor(Math.random() * PROMPTS.length);
  const overtime = overtimeForce || unused.length < 3;
  const prev = e.state.round;
  const round: RoomRound = {
    id: uid(), prompt: PROMPTS[idx].text, subject: "mixed", prompt_no: (prev?.prompt_no ?? 0) + 1, holder_id: holder,
    turn_started_at: iso(), turn_ms: overtime ? Math.max(6000, 9000 - 1000 * (prev?.overtime ? prev.prompt_no % 3 : 0)) : TURN_MS,
    overtime, fail_count: 0, failed_by: null, answers: [],
  };
  return { ...e, used: [...e.used, idx], promptIdx: idx, turns: 0, state: { ...e.state, round } };
}
function endGame(e: Engine): Engine {
  const s = e.state;
  const winner = active(s)[0]?.user_id ?? null;
  const seated = s.players.filter((p) => p.seat !== null);
  const places = [...seated].sort((a, b) => (a.user_id === winner ? -1 : b.user_id === winner ? 1 : b.points - a.points)).map((p, i) => ({ user_id: p.user_id, place: i + 1, points: p.points }));
  const all = s.round ? s.round.answers : [];
  const rarest = [...all].sort((a, b) => b.points - a.points)[0] ?? null;
  return {
    ...e,
    state: {
      ...s,
      room: { ...s.room, status: "finished" },
      players: s.players.map((p) => (p.user_id === winner ? { ...p, wins: p.wins + 1 } : p)),
      round: null,
      end: { winner_id: winner, counts_for_wins: true, rarest: rarest ?? { answer: "Salak", points: 7, user_id: winner ?? ME }, places },
    },
  };
}
function advance(e: Engine, success: boolean): Engine {
  const s = e.state;
  const r = s.round!;
  if (active(s).length <= 1) return endGame(e);
  const next = nextHolder(s, r.holder_id);
  const total = PROMPTS[e.promptIdx].answers.length;
  let reason: string | null = null;
  if (success) {
    if (r.answers.length >= total) reason = "exhausted";
    else if (r.fail_count === 0 && e.turns >= 3 * active(s).length) reason = "cleared";
    else if (r.failed_by && next === r.failed_by) reason = "back_to_failer";
  } else if (r.fail_count >= 2) reason = "second_fail";
  if (reason) return openRound(e, next);
  return { ...e, state: { ...s, round: { ...r, holder_id: next, turn_started_at: iso() } } };
}
function timeout(e: Engine): Engine {
  const s = e.state;
  const r = s.round!;
  const h = s.players.find((p) => p.user_id === r.holder_id)!;
  const out = h.extensions <= 1;
  const players = s.players.map((p) => (p.user_id === h.user_id ? { ...p, extensions: out ? 0 : p.extensions - 1, is_out: out } : p));
  const round = { ...r, fail_count: r.fail_count + 1, failed_by: r.failed_by ?? h.user_id };
  return advance({ ...e, state: { ...s, players, round, room: { ...s.room, last_event: { type: "timeout", user_id: h.user_id, out, at: iso() } } } }, false);
}
function answer(e: Engine, who: string, text: string): { e: Engine; r: SubmitResult } {
  const s = e.state;
  const r = s.round!;
  if (r.holder_id !== who) return { e, r: { result: "not_your_turn" } };
  if (Date.now() > Date.parse(r.turn_started_at) + r.turn_ms + 250) return { e: timeout(e), r: { result: "too_late" } };
  const t = norm(text);
  const list = PROMPTS[e.promptIdx].answers;
  const hit = list.find(([a]) => norm(a) === t) ?? (t.length >= 4 ? list.find(([a]) => lev(norm(a), t) <= (t.length >= 6 ? 2 : 1)) : undefined);
  if (!hit) return { e, r: { result: "wrong", reject_id: Math.floor(Math.random() * 1e6) } };
  if (r.answers.some((a) => a.answer === hit[0])) return { e, r: { result: "taken", answer: hit[0] } };
  const p = s.players.find((x) => x.user_id === who)!;
  const pts = p.points + hit[1];
  const bonus = Math.min(Math.floor(pts / BONUS_EVERY) - Math.floor(p.points / BONUS_EVERY), MAX_EXTENSIONS - p.extensions);
  const players = s.players.map((x) => (x.user_id === who ? { ...x, points: pts, extensions: x.extensions + Math.max(0, bonus) } : x));
  const round = { ...r, answers: [...r.answers, { answer: hit[0], points: hit[1], user_id: who }] };
  const next = advance({ ...e, turns: e.turns + 1, state: { ...s, players, round, room: { ...s.room, last_event: { type: "answer", user_id: who, answer: hit[0], points: hit[1], bonus: Math.max(0, bonus), at: iso() } } } }, true);
  return { e: next, r: { result: "ok", answer: hit[0], points: hit[1], bonus: Math.max(0, bonus) } };
}

export function DeadlinePreview() {
  const [n, setN] = useState(5);
  const [meHost, setMeHost] = useState(true);
  const [bots, setBots] = useState(true);
  const [panel, setPanel] = useState(true);
  const [eng, setEng] = useState<Engine>(() => ({ state: lobby(5, true), used: [], promptIdx: 0, turns: 0 }));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", user_id: "b1", body: "who's ready to lose 😤", created_at: iso() },
    { id: "m2", user_id: "b4", body: "not me", created_at: iso() },
  ]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const engRef = useRef(eng);
  useEffect(() => { engRef.current = eng; }, [eng]);

  const say = useCallback((user: string, body: string) => setMessages((m) => [...m, { id: uid(), user_id: user, body, created_at: iso() }]), []);
  const reactAs = useCallback((user: string, emoji: string) => {
    const r = { id: uid(), user_id: user, emoji };
    setReactions((rs) => [...rs.slice(-20), r]);
  }, []);

  // The clock: time out the holder after the deadline (+ grace).
  useEffect(() => {
    const t = setInterval(() => {
      const e = engRef.current;
      const r = e.state.round;
      if (e.state.room.status === "playing" && r && Date.now() > Date.parse(r.turn_started_at) + r.turn_ms + 250) setEng(timeout(e));
    }, 150);
    return () => clearInterval(t);
  }, []);

  // Bots: answer after a while (sometimes too slowly), react and chat now and then.
  const round = eng.state.round;
  const holder = round?.holder_id;
  const turnKey = round ? `${round.id}:${round.turn_started_at}` : null;
  useEffect(() => {
    if (!bots || !round || !holder || holder === ME || eng.state.room.status !== "playing") return;
    const slow = Math.random() < 0.18;
    const wait = slow ? round.turn_ms + 600 : 1200 + Math.random() * (round.turn_ms - 2500);
    const t = setTimeout(() => {
      const e = engRef.current;
      if (!e.state.round || e.state.round.holder_id !== holder) return;
      const left = PROMPTS[e.promptIdx].answers.filter(([a]) => !e.state.round!.answers.some((x) => x.answer === a));
      if (!left.length) return;
      const pick = left[Math.floor(Math.random() * left.length)][0];
      const { e: next } = answer(e, holder, pick);
      setEng(next);
      const others = next.state.players.filter((p) => p.user_id !== ME && p.user_id !== holder);
      const any = () => others[Math.floor(Math.random() * others.length)]?.user_id;
      if (others.length && Math.random() < 0.35) reactAs(any()!, ["🔥", "😮", "👏", "🧠"][Math.floor(Math.random() * 4)]);
      if (others.length && Math.random() < 0.12) say(any()!, LINES[Math.floor(Math.random() * LINES.length)]);
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one schedule per turn
  }, [turnKey, bots]);

  const actions: RoomActions = {
    submit: async (text) => {
      const { e, r } = answer(engRef.current, ME, text);
      setEng(e);
      return r;
    },
    appeal: async () => {},
    start: async () => {
      const e = engRef.current;
      if (e.state.players.length < 2) return { ok: false, reason: "need_two" };
      const order = [...e.state.players].sort(() => Math.random() - 0.5);
      const players = e.state.players.map((p) => ({ ...p, seat: order.findIndex((o) => o.user_id === p.user_id), extensions: START_EXTENSIONS, points: 0, is_out: false }));
      const started: Engine = { ...e, used: [], state: { ...e.state, players, end: null, room: { ...e.state.room, status: "playing", game_no: e.state.room.game_no + 1, last_event: { type: "started", at: iso() } }, round: null } };
      setEng(openRound(started, order[0].user_id));
      return { ok: true };
    },
    leave: async () => { setEng({ state: lobby(n, meHost), used: [], promptIdx: 0, turns: 0 }); },
    sendChat: async (body) => {
      const last = messages.filter((m) => m.user_id === ME).at(-1);
      if (last && Date.now() - Date.parse(last.created_at) < 1000) return { ok: false, reason: "slow_down" };
      say(ME, body);
      return { ok: true };
    },
    react: async (emoji) => reactAs(ME, emoji),
    report: async () => {},
    mute: async (userId, muted) => setEng((e) => ({ ...e, state: { ...e.state, players: e.state.players.map((p) => (p.user_id === userId ? { ...p, muted } : p)) } })),
    saveSquad: async (name) => {
      setEng((e) => ({ ...e, state: { ...e.state, room: { ...e.state.room, saved_squad: { id: "sq", name, code: "K7MPXR", member: true } } } }));
      return { ok: true };
    },
  };

  const reset = (players = n, host = meHost) => setEng({ state: lobby(players, host), used: [], promptIdx: 0, turns: 0 });
  // "My turn" also puts you back in the game (with one extension) if you'd gone out.
  const myTurnNow = () => setEng((e) => (e.state.round ? {
    ...e,
    state: {
      ...e.state,
      players: e.state.players.map((p) => (p.user_id === ME && p.is_out ? { ...p, is_out: false, extensions: 1 } : p)),
      round: { ...e.state.round, holder_id: ME, turn_started_at: iso() },
    },
  } : e));
  const someBot = () => {
    const inRoom = eng.state.players.filter((p) => p.user_id !== ME);
    return inRoom[Math.floor(Math.random() * inRoom.length)]?.user_id ?? "b1";
  };
  const overtime = () => setEng((e) => (e.state.round ? openRound(e, e.state.round.holder_id, true) : e));
  const finish = () => setEng((e) => (e.state.room.status === "playing" ? endGame({ ...e, state: { ...e.state, players: e.state.players.map((p) => (p.seat === null ? p : p.user_id === ME ? { ...p, is_out: false, extensions: Math.max(1, p.extensions) } : { ...p, is_out: true, extensions: 0 })) } }) : e));
  const BTN = "rounded-full border border-outline-variant px-sm py-0.5 text-label-sm font-semibold text-on-surface hover:border-primary cursor-pointer";

  return (
    <>
      <DeadlineRoom state={eng.state} offset={0} messages={messages} reactions={reactions} actions={actions} />
      <div className="fixed left-sm bottom-sm z-[80] max-w-[calc(100vw-1rem)]">
        {panel ? (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest/95 backdrop-blur shadow-xl p-sm flex flex-col gap-xs w-72">
            <div className="flex items-center justify-between"><p className="text-label-sm font-bold text-on-surface">Dev preview · fake room</p>
              <button type="button" onClick={() => setPanel(false)} className="text-label-sm text-on-surface-variant cursor-pointer">Hide</button></div>
            <p className="text-label-sm text-on-surface-variant">Made-up prompts (not the IB bank): fruit, board games, pizza toppings, breakfast foods, ice cream, dog breeds.</p>
            <div className="flex flex-wrap gap-xs">
              <button type="button" className={BTN} onClick={() => reset()}>Lobby</button>
              <button type="button" className={BTN} onClick={() => void actions.start()}>Start</button>
              <button type="button" className={BTN} onClick={myTurnNow}>My turn</button>
              <button type="button" className={BTN} onClick={overtime}>Overtime</button>
              <button type="button" className={BTN} onClick={finish}>Win now</button>
              <button type="button" className={BTN} onClick={() => setBots(!bots)}>Bots {bots ? "on" : "off"}</button>
              <button type="button" className={BTN} onClick={() => say(someBot(), LINES[Math.floor(Math.random() * LINES.length)])}>Bot chats</button>
              <button type="button" className={BTN} onClick={() => reactAs(someBot(), "💀")}>Bot reacts</button>
              <button type="button" className={BTN} onClick={() => { setMeHost(!meHost); reset(n, !meHost); }}>{meHost ? "I'm host" : "Not host"}</button>
            </div>
            <label className="flex items-center gap-xs text-label-sm text-on-surface-variant">Players
              <input type="range" min={2} max={6} value={n} onChange={(e) => { setN(+e.target.value); reset(+e.target.value); }} />{n}</label>
          </div>
        ) : (
          <button type="button" onClick={() => setPanel(true)} className="rounded-full bg-inverse-surface text-inverse-on-surface px-sm py-xs text-label-sm font-semibold shadow-lg cursor-pointer">Dev</button>
        )}
      </div>
    </>
  );
}

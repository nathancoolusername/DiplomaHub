// Deadline: the shapes the game UI works with. RoomState is exactly what
// get_room_state (migration 56) returns, so the real room and the dev
// preview feed the same components.

export type RoomStatus = "lobby" | "playing" | "finished";

export type RoomPlayer = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  /** null while waiting in the lobby during someone else's game. */
  seat: number | null;
  extensions: number;
  points: number;
  is_out: boolean;
  waiting: boolean;
  muted: boolean;
  /** Playing as a guest (no account; off the leaderboard). */
  guest?: boolean;
  /** Lifetime wins: the flex. */
  wins: number;
  last_seen: string;
};

export type RoundAnswer = { answer: string; points: number; user_id: string };

export type RoomRound = {
  id: string;
  prompt: string;
  subject: string;
  prompt_no: number;
  holder_id: string;
  turn_started_at: string;
  turn_ms: number;
  overtime: boolean;
  fail_count: number;
  failed_by: string | null;
  answers: RoundAnswer[];
};

export type RoomEvent =
  | { type: "started"; at: string }
  | { type: "answer"; user_id: string; answer: string; points: number; bonus: number; at: string }
  | { type: "timeout"; user_id: string; out: boolean; at: string }
  | { type: "joined" | "left" | "kicked"; user_id: string; at: string };

export type RoomEnd = {
  winner_id: string | null;
  counts_for_wins: boolean;
  rarest: { answer: string; points: number; user_id: string } | null;
  places: { user_id: string; place: number; points: number }[];
};

export type RoomState = {
  ok: true;
  server_now: string;
  me: string;
  room: {
    id: string;
    code: string;
    status: RoomStatus;
    host_id: string;
    squad_id: string | null;
    /** subjects: the host's ticked subjects; empty or missing = Mixed (all). */
    settings: { mix: string; subjects?: string[] };
    version: number;
    game_no: number;
    last_event: RoomEvent | null;
    saved_squad: { id: string; name: string; code: string; member: boolean } | null;
  };
  players: RoomPlayer[];
  round: RoomRound | null;
  end: RoomEnd | null;
};

export type SubmitResult =
  | { result: "ok"; answer: string; points: number; bonus: number }
  | { result: "wrong" | "ambiguous" | "denied"; reject_id: number | null }
  | { result: "taken"; answer: string }
  | { result: "not_your_turn" | "too_late" | "rate_limited" | "not_playing" }
  /** The request itself failed (network): nothing was sent to the game. */
  | { result: "error" };

export type ChatMessage = { id: string; user_id: string; body: string; created_at: string };
export type Reaction = { id: string; user_id: string; emoji: string };

/** What the room UI can ask for. The real room calls the RPCs; the dev preview fakes them. */
export type RoomActions = {
  submit: (text: string) => Promise<SubmitResult>;
  appeal: (rejectId: number) => Promise<void>;
  start: () => Promise<{ ok: boolean; reason?: string }>;
  leave: () => Promise<void>;
  sendChat: (body: string) => Promise<{ ok: boolean; reason?: string }>;
  react: (emoji: string) => Promise<void>;
  report: (messageId: string) => Promise<void>;
  mute: (userId: string, muted: boolean) => Promise<void>;
  /** Host: remove someone from the room (they can't rejoin it). */
  kick: (userId: string) => Promise<{ ok: boolean; reason?: string }>;
  saveSquad: (name: string) => Promise<{ ok: boolean; reason?: string; code?: string }>;
  /** Subjects with how many prompts each has. */
  listSubjects: () => Promise<{ subject: string; prompts: number }[]>;
  /** Host: tick subjects (empty = Mixed). */
  setSubjects: (subjects: string[]) => Promise<{ ok: boolean; reason?: string; prompts?: number }>;
  /** Flags mode, end screen: the game's length, flags shown of total, and the flags nobody named (codes). */
  flagsSummary: () => Promise<FlagsSummary | null>;
};

export type FlagsSummary = { seconds: number; shown: number; total: number; missed: string[] };

/** What players are typing right now (user id → text), as a tiny store so a
 *  stream of keystrokes re-renders only the line that shows them. */
export type TypingStore = { subscribe: (onChange: () => void) => () => void; get: () => Readonly<Record<string, string>> };

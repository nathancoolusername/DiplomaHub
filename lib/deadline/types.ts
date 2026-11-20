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
  | { type: "joined" | "left"; user_id: string; at: string };

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
    settings: { mix: string };
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
  | { result: "not_your_turn" | "too_late" | "rate_limited" | "not_playing" };

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
  saveSquad: (name: string) => Promise<{ ok: boolean; reason?: string; code?: string }>;
};

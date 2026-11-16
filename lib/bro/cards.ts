// Cards on Bro's replies (bro_messages.attachments, migration 45): what Bro
// did or proposes, shown as clean previews with buttons. Shared by the
// server (tools) and the chat UI, so no server-only imports.

export type SetCard = {
  type: "set";
  setId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  questionCount: number;
  topics: string[];
  timed: boolean;
};

export type HubCardItem = {
  title: string;
  kind: "test" | "mock" | "deadline" | "study";
  subjectId: string | null;
  subjectName: string | null;
  /** ISO, UTC. */
  start: string;
  end: string;
  allDay: boolean;
  /** A study session for one of their practice sets: on the Hub it opens the set, and finishing the set ticks it off. */
  practiceSetId?: string | null;
  practiceSetTitle?: string | null;
};

export type HubCard = {
  type: "hub";
  status: "proposed" | "added";
  items: HubCardItem[];
  /** A named plan ("Mocks timetable", "Mock revision plan"): shown with a calendar and shareable as a Hub set code. */
  title?: string | null;
  /** The Hub items it created, once added (for the share code). */
  addedIds?: string[];
  /** The Hub set it became when added (named plans; migration 46). */
  setId?: string | null;
  /** Its Hub set share code, once made. */
  code?: string | null;
};

export type ResourcesCard = {
  type: "resources";
  items: { id: string; title: string; typeTag: string; subjectTag: string }[];
};

/** One existing Hub item as it is, or as it will be. The optional fields are only compared when set. */
export type HubItemSnapshot = {
  title: string;
  kind: HubCardItem["kind"] | null;
  start: string;
  end: string;
  allDay: boolean;
  done?: boolean;
  /** The countdown on Home. */
  timer?: boolean;
  notes?: string | null;
  subjectName?: string | null;
  /** The Hub's subject id (for applying). */
  subjectId?: string | null;
  /** Its checklist (stage labels). */
  stages?: string[];
};

/** Changes Bro proposes to existing Hub items and sets; applied only when the student taps Apply. */
export type HubChangesCard = {
  type: "hub_changes";
  status: "proposed" | "applied" | "cancelled";
  items: { id: string; action: "update" | "delete"; before: HubItemSnapshot; after?: HubItemSnapshot }[];
  sets: {
    /** The set's id; for "create", made when applied. */
    id: string;
    action: "rename" | "delete" | "create" | "add_items" | "remove_items";
    name: string;
    newName?: string;
    deleteItems?: boolean;
    itemCount: number;
    /** create / add_items / remove_items: which items, and their titles to show. */
    itemIds?: string[];
    itemTitles?: string[];
  }[];
};

/** A share code Bro made for a practice set, Hub item or Hub set. */
export type CodeCard = {
  type: "code";
  codeType: "practice_set" | "hub_item" | "hub_set";
  code: string;
  title: string;
  /** Hub sets: how many items it copies. */
  count?: number;
};

/** A code the student gave Bro to use. Redeemed straight away, except a Hub set, which asks keep-the-dates or start-on first. */
export type RedeemCard = {
  type: "redeem";
  code: string;
  status: "needs_choice" | "done" | "failed";
  /** needs_choice: what the Hub set holds. */
  preview?: { name: string; count: number; firstStart: string; lastEnd: string };
  /** done: what it gave, in words, and where to see it. */
  result?: { text: string; href: string };
  /** failed: why. */
  error?: string;
};

/** One settings change: what it does when applied, and how it reads on the card. */
export type SettingsOp = (
  | { op: "theme"; value: "system" | "light" | "dark" | "midnight" }
  | { op: "exam_session"; id: string }
  | { op: "level"; subjectId: string; level: "HL" | "SL" }
  | { op: "add_class"; subjectId: string; level: "HL" | "SL" }
  | { op: "remove_class"; subjectId: string }
  | { op: "swap_core"; from: string; to: string; level: "HL" | "SL" }
  | { op: "pro_badge"; hidden: boolean }
) & { label: string; before: string; after: string };

/** Settings changes Bro proposes; applied only when the student taps Apply. */
export type SettingsCard = { type: "settings"; status: "proposed" | "applied" | "cancelled"; ops: SettingsOp[] };

export type BroCard = SetCard | HubCard | ResourcesCard | HubChangesCard | CodeCard | RedeemCard | SettingsCard;

export const HUB_KIND_LABEL: Record<HubCardItem["kind"], string> = { test: "Test", mock: "Mock", deadline: "Deadline", study: "Study" };

/** Cards read back from the database, dropping anything malformed. */
export function readCards(v: unknown): BroCard[] {
  if (!Array.isArray(v)) return [];
  return v.filter((c): c is BroCard => !!c && typeof c === "object" && (c.type === "set" || c.type === "hub" || c.type === "resources" || c.type === "hub_changes" || c.type === "code" || c.type === "redeem" || c.type === "settings"));
}

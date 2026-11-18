import "server-only";

import { findSubtopic, subjectById } from "@/lib/catalog";
import type { SubjectId } from "@/lib/data/types";
import { toCatalogSubjectId } from "@/lib/hub-subjects";
import { rpc } from "./client";

// Squads (migration 52) and marks won back (migration 51). Every call goes
// through a security-definer function that checks membership itself.

export type MarksWonBack = {
  /** Won back since the start of the week (Monday, UTC) unless another date was asked for. */
  wonSince: number;
  wonTotal: number;
  /** Still to win back (losses from the last 120 days). */
  open: number;
  bySubtopic: { subjectId: SubjectId; subjectName: string; subtopicCode: string; name: string; won: number; open: number }[];
};

export type SquadSummary = {
  id: string;
  name: string;
  members: number;
  isOwner: boolean;
  /** This week, by practice points (null before migration 53). */
  myRank: number | null;
  myPoints: number | null;
  /** Who's top this week (null when nobody has points yet). */
  leader: string | null;
  leaderIsMe: boolean;
};

export type SquadFortyFive = { userId: string; displayName: string; avatarUrl: string | null; isMe: boolean; score: number | null; seconds: number | null };

export type SquadMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isMe: boolean;
  isOwner: boolean;
  points: number;
  wonBack: number;
  resetDone: boolean;
  /** Weeks planned in total. */
  resets: number;
  practised: { subjectId: SubjectId; subtopicCode: string; subjectName: string; topic: string }[];
  /** Today's Forty-Five, if they've finished it. */
  ffToday: { score: number; seconds: number } | null;
  /** Forty-Five total for the period (this week or all time) and games played. */
  ffTotal: number;
  ffGames: number;
};

export type SquadPeriod = "week" | "all";
export type SquadBoard = { id: string; name: string; code: string; isOwner: boolean; period: SquadPeriod; weekStart: string; members: SquadMember[] };

export type JoinSquadResult = { ok: true; id: string; name: string; already?: boolean } | { ok: false; reason: "rate_limited" | "not_found" | "full" | "too_many" };

const subjectName = (id: string) => subjectById(id as SubjectId)?.shortName ?? id;
const topicName = (subject: string, code: string) => findSubtopic(subject as SubjectId, code)?.shortName ?? code;

/** The signed-in student's marks won back; null before migration 51. */
export async function getMarksWonBack(since?: string): Promise<MarksWonBack | null> {
  try {
    const r = await rpc<{ won_since: number; won_total: number; open: number; by_subtopic: { subject_id: string; subtopic_code: string; won: number; open: number }[] }>(
      "my_marks_won_back",
      { p_since: since ?? null },
    );
    return {
      wonSince: r.won_since,
      wonTotal: r.won_total,
      open: r.open,
      bySubtopic: (r.by_subtopic ?? []).map((t) => ({
        subjectId: t.subject_id as SubjectId,
        subjectName: subjectName(t.subject_id),
        subtopicCode: t.subtopic_code,
        name: topicName(t.subject_id, t.subtopic_code),
        won: t.won,
        open: t.open,
      })),
    };
  } catch {
    return null;
  }
}

/** The signed-in student's squads; [] before migration 52. */
export async function getMySquads(): Promise<SquadSummary[]> {
  try {
    const rows = await rpc<{ id: string; name: string; members: number; is_owner: boolean; my_rank?: number | null; my_points?: number | null; leader?: string | null; leader_is_me?: boolean | null }[]>("my_squads");
    return (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      members: Number(r.members) || 1,
      isOwner: r.is_owner,
      myRank: r.my_rank ?? null,
      myPoints: r.my_points ?? null,
      leader: r.leader ?? null,
      leaderIsMe: !!r.leader_is_me,
    }));
  } catch {
    return [];
  }
}

type BoardRow = {
  id: string;
  name: string;
  code: string;
  is_owner: boolean;
  period?: SquadPeriod;
  week_start: string;
  members: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    is_me: boolean;
    is_owner: boolean;
    points: number;
    won_back: number;
    reset_done: boolean;
    resets?: number;
    practised: { subject_id: string; subtopic_code: string }[];
    ff_today?: { score: number; seconds: number } | null;
    ff_total?: number;
    ff_games?: number;
  }[];
};

/** A squad's board for this week or all time; null when the student isn't in that squad (or it doesn't exist). */
export async function getSquadBoard(id: string, period: SquadPeriod = "week"): Promise<SquadBoard | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  let r: BoardRow;
  try {
    r = await rpc<BoardRow>("squad_board", { p_squad: id, p_period: period });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Before migration 53 there's only the one-argument (this week) board.
    if (/function .*squad_board|schema cache/i.test(msg)) {
      try {
        r = await rpc<BoardRow>("squad_board", { p_squad: id });
      } catch (e2) {
        if (!(e2 instanceof Error && /Squad not found/.test(e2.message))) console.error("squad_board failed:", e2 instanceof Error ? e2.message : e2);
        return null;
      }
    } else {
      // "Squad not found" is the normal not-a-member case; anything else is worth seeing in the logs.
      if (!/Squad not found/.test(msg)) console.error("squad_board failed:", msg);
      return null;
    }
  }
  const members = (r.members ?? [])
    .map(
      (m): SquadMember => ({
        userId: m.user_id,
        displayName: m.display_name,
        avatarUrl: m.avatar_url,
        isMe: m.is_me,
        isOwner: m.is_owner,
        points: Number(m.points) || 0,
        wonBack: Number(m.won_back) || 0,
        resetDone: !!m.reset_done,
        resets: Number(m.resets) || 0,
        practised: (m.practised ?? []).map((p) => ({
          subjectId: p.subject_id as SubjectId,
          subtopicCode: p.subtopic_code,
          subjectName: subjectName(p.subject_id),
          topic: topicName(p.subject_id, p.subtopic_code),
        })),
        ffToday: m.ff_today ?? null,
        ffTotal: Number(m.ff_total) || 0,
        ffGames: Number(m.ff_games) || 0,
      }),
    )
    .sort((a, b) => b.points - a.points || b.wonBack - a.wonBack);
  return { id: r.id, name: r.name, code: r.code, isOwner: r.is_owner, period: r.period ?? "week", weekStart: r.week_start, members };
}

/** Everyone in the student's squads and today's Forty-Five ([] when not in a squad, or before migration 53). */
export async function getSquadsFortyFiveToday(): Promise<SquadFortyFive[]> {
  try {
    const rows = await rpc<{ user_id: string; display_name: string; avatar_url: string | null; is_me: boolean; score: number | null; seconds: number | null }[]>("my_squads_forty_five_today");
    return (rows ?? []).map((r) => ({ userId: r.user_id, displayName: r.display_name, avatarUrl: r.avatar_url, isMe: r.is_me, score: r.score, seconds: r.seconds }));
  } catch {
    return [];
  }
}

export async function createSquad(name: string): Promise<{ id: string; code: string }> {
  return rpc("create_squad", { p_name: name });
}

export async function joinSquad(code: string): Promise<JoinSquadResult> {
  return rpc("join_squad", { p_code: code });
}

export async function leaveSquad(id: string): Promise<void> {
  await rpc("leave_squad", { p_squad: id });
}

export async function removeSquadMember(id: string, userId: string): Promise<void> {
  await rpc("remove_squad_member", { p_squad: id, p_user: userId });
}

export async function renameSquad(id: string, name: string): Promise<void> {
  await rpc("rename_squad", { p_squad: id, p_name: name });
}

export async function newSquadCode(id: string): Promise<string> {
  return rpc("new_squad_code", { p_squad: id });
}

// ── The squad shelf (migration 54) ─────────────────────────────────────

export type ShelfItem = {
  id: string;
  /** null for a resource. */
  code: string | null;
  type: "practice_set" | "hub_item" | "hub_set" | "resource";
  /** For a resource (migration 55). */
  resourceId: string | null;
  /** A resource's library tags, e.g. "Chemistry" and "Exemplar - IA". */
  subjectTag: string | null;
  typeTag: string | null;
  title: string;
  note: string | null;
  createdAt: string;
  sharedBy: string;
  isMine: boolean;
  /** The student's own code (nothing to add). */
  ownCode: boolean;
  /** They've already added it. */
  added: boolean;
  uses: number;
  subjectName: string | null;
  questions: number | null;
  kind: string | null;
  startsAt: string | null;
  count: number | null;
};

/** The newest 30 things shared to a squad; [] before migration 54 or when not a member. */
export async function getSquadShelf(squadId: string): Promise<ShelfItem[]> {
  if (!/^[0-9a-f-]{36}$/i.test(squadId)) return [];
  try {
    const rows = await rpc<
      {
        id: string;
        code: string | null;
        resource_id?: string | null;
        subject_tag?: string | null;
        type_tag?: string | null;
        type: ShelfItem["type"];
        title: string | null;
        note: string | null;
        created_at: string;
        shared_by: string;
        is_mine: boolean;
        own_code: boolean;
        added: boolean;
        uses: number;
        subject_id: string | null;
        questions: number | null;
        kind: string | null;
        starts_at: string | null;
        count: number | null;
      }[]
    >("squad_shelf", { p_squad: squadId });
    return (rows ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      resourceId: r.resource_id ?? null,
      subjectTag: r.subject_tag ?? null,
      typeTag: r.type_tag ?? null,
      title: r.title ?? (r.type === "hub_set" ? "Hub plan" : "Shared item"),
      note: r.note,
      createdAt: r.created_at,
      sharedBy: r.shared_by,
      isMine: r.is_mine,
      ownCode: r.own_code,
      added: r.added,
      uses: Number(r.uses) || 0,
      // Hub items keep the Hub's subject ids; practice sets use the catalog's.
      subjectName: r.subject_id ? subjectName(r.type === "hub_item" ? toCatalogSubjectId(r.subject_id) : r.subject_id) : null,
      questions: r.questions === null ? null : Number(r.questions),
      kind: r.kind,
      startsAt: r.starts_at,
      count: r.count === null ? null : Number(r.count),
    }));
  } catch {
    return [];
  }
}

export async function shareToSquad(squadId: string, code: string, note?: string): Promise<void> {
  await rpc("share_to_squad", { p_squad: squadId, p_code: code, p_note: note ?? null });
}

export async function shareResourceToSquad(squadId: string, resourceId: string, note?: string): Promise<void> {
  await rpc("share_resource_to_squad", { p_squad: squadId, p_resource: resourceId, p_note: note ?? null });
}

export async function removeSquadShare(id: string): Promise<void> {
  await rpc("remove_squad_share", { p_id: id });
}

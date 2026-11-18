import { notFound } from "next/navigation";
import type { SubjectId } from "@/lib/data/types";
import type { Metadata } from "next";
import type { SquadBoard } from "@/lib/data";
import { SquadBoardView } from "@/components/squads/SquadBoardView";
import { SquadShelf } from "@/components/squads/SquadShelf";
import { SquadsCard } from "@/components/home/pro-home/SquadsCard";
import { MarksWonBackCard } from "@/components/progress/MarksWonBackCard";

export const metadata: Metadata = { title: "Squads (dev)", robots: { index: false } };

// Dev-only: a sample squad board, the Home card and the Progress card, with no
// sign-in or migrations. The buttons call the real actions, so they fail here.
const t = (subjectId: string, subjectName: string, subtopicCode: string, topic: string) => ({ subjectId: subjectId as SubjectId, subtopicCode, subjectName, topic });

export default async function SquadsPreview({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const all = (await searchParams).period === "all";
  // eslint-disable-next-line react-hooks/purity -- dev demo, rendered once
  const now = Date.now();
  if (process.env.NODE_ENV === "production") notFound();
  const board: SquadBoard = {
    id: "00000000-0000-4000-8000-000000000000",
    name: "The Paper 2 Survivors",
    code: "K7MPXR",
    isOwner: true,
    period: all ? "all" : "week",
    weekStart: new Date().toISOString(),
    members: [
      { userId: "a", displayName: "Maya", avatarUrl: null, isMe: false, isOwner: false, points: all ? 1840 : 142, wonBack: all ? 96 : 11, resetDone: true, resets: 6, practised: all ? [] : [t("chemistry", "Chemistry", "C.3", "Organic mechanisms"), t("biology", "Biology", "C1.1", "Enzymes")], ffToday: { score: 41, seconds: 133 }, ffTotal: all ? 312 : 118, ffGames: all ? 8 : 3 },
      { userId: "b", displayName: "Nathan", avatarUrl: null, isMe: true, isOwner: true, points: all ? 2210 : 118, wonBack: all ? 120 : 9, resetDone: true, resets: 7, practised: all ? [] : [t("physics", "Physics", "C.1", "Simple harmonic motion"), t("math_aa", "Maths AA", "5.10", "Integration")], ffToday: { score: 45, seconds: 98 }, ffTotal: all ? 355 : 131, ffGames: all ? 8 : 3 },
      { userId: "c", displayName: "Leo", avatarUrl: null, isMe: false, isOwner: false, points: all ? 960 : 87, wonBack: all ? 40 : 4, resetDone: false, resets: 2, practised: all ? [] : [t("economics", "Economics", "2.4", "Price elasticity of demand")], ffToday: null, ffTotal: all ? 201 : 74, ffGames: all ? 6 : 2 },
      { userId: "d", displayName: "Aarav", avatarUrl: null, isMe: false, isOwner: false, points: all ? 410 : 40, wonBack: all ? 18 : 2, resetDone: true, resets: 3, practised: [], ffToday: { score: 33, seconds: 260 }, ffTotal: all ? 150 : 33, ffGames: all ? 5 : 1 },
      { userId: "e", displayName: "Sofia", avatarUrl: null, isMe: false, isOwner: false, points: all ? 35 : 0, wonBack: 0, resetDone: false, resets: 0, practised: [], ffToday: null, ffTotal: 0, ffGames: 0 },
    ],
  };
  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <p className="text-label-sm text-on-surface-variant">Dev preview · sample squad · buttons don&apos;t work here</p>
        <SquadBoardView board={board} />
        <SquadShelf
          squadId={board.id}
          isOwner
          items={[
            { id: "s1", code: "K7MPX", resourceId: null, subjectTag: null, typeTag: null, type: "practice_set", title: "Organic mechanisms: 10 tricky ones", note: "These came up in our mock", createdAt: new Date(now - 2 * 3600_000).toISOString(), sharedBy: "Maya", isMine: false, ownCode: false, added: false, uses: 3, subjectName: "Chemistry", questions: 10, kind: null, startsAt: null, count: null },
            { id: "s4", code: null, resourceId: "0b57eb1a-20d4-45f0-bed5-d8e8bbe67878", subjectTag: "Chemistry", typeTag: "Exemplar - IA", type: "resource", title: "Chemistry IA exemplar: rates of reaction (7)", note: "Super useful for the method section", createdAt: new Date(now - 5 * 3600_000).toISOString(), sharedBy: "Aarav", isMine: false, ownCode: false, added: false, uses: 0, subjectName: null, questions: null, kind: null, startsAt: null, count: null },
            { id: "s2", code: "T4QWB", resourceId: null, subjectTag: null, typeTag: null, type: "hub_item", title: "Physics test: waves", note: null, createdAt: new Date(now - 26 * 3600_000).toISOString(), sharedBy: "Leo", isMine: false, ownCode: false, added: true, uses: 4, subjectName: "Physics", questions: null, kind: "test", startsAt: new Date(now + 4 * 86_400_000).toISOString(), count: null },
            { id: "s3", code: "M4HQB", resourceId: null, subjectTag: null, typeTag: null, type: "hub_set", title: "Mocks timetable", note: "All 14 papers with times", createdAt: new Date(now - 3 * 86_400_000).toISOString(), sharedBy: "Nathan", isMine: true, ownCode: true, added: false, uses: 2, subjectName: null, questions: null, kind: null, startsAt: new Date(now + 20 * 86_400_000).toISOString(), count: 14 },
          ]}
        />
        <h2 className="pt-lg border-t border-outline-variant text-label-md font-semibold text-on-surface">On Home</h2>
        <SquadsCard squads={[{ id: board.id, name: board.name, members: 5, isOwner: true, myRank: 2, myPoints: 118, leader: "Maya", leaderIsMe: false }]} />
        <SquadsCard squads={[]} />
        <h2 className="pt-lg border-t border-outline-variant text-label-md font-semibold text-on-surface">On Progress</h2>
        <MarksWonBackCard
          data={{
            wonSince: 9,
            wonTotal: 41,
            open: 17,
            bySubtopic: [
              { subjectId: "physics", subjectName: "Physics", subtopicCode: "C.1", name: "Simple harmonic motion", won: 6, open: 5 },
              { subjectId: "economics", subjectName: "Economics", subtopicCode: "2.4", name: "Price elasticity of demand", won: 7, open: 3 },
              { subjectId: "math_aa", subjectName: "Maths AA", subtopicCode: "5.10", name: "Integration by substitution", won: 4, open: 2 },
            ],
          }}
        />
      </div>
    </div>
  );
}

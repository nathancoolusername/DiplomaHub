import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getSquadBoard, getSquadDeadline, getSquadShelf } from "@/lib/data";
import { SquadBoardView } from "@/components/squads/SquadBoardView";
import { SquadShelf } from "@/components/squads/SquadShelf";
import { SquadDeadlineCard } from "@/components/deadline/SquadDeadlineCard";

export const metadata: Metadata = { title: "Squad", robots: { index: false } };

export default async function SquadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ period?: string }> }) {
  const [{ id }, { period }] = await Promise.all([params, searchParams]);
  if (!(await getCurrentUserId())) redirect(`/login?next=/squads/${id}`);
  const [board, shelf, deadline] = await Promise.all([getSquadBoard(id, period === "all" ? "all" : "week"), getSquadShelf(id), getSquadDeadline(id)]);
  if (!board) notFound();

  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <Link href="/squads" className="self-start inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant hover:text-primary">
          <ArrowLeft size={14} aria-hidden="true" /> Your squads
        </Link>
        <SquadBoardView board={board} />
        {deadline && <SquadDeadlineCard squadId={board.id} deadline={deadline} members={board.members} />}
        <SquadShelf squadId={board.id} items={shelf} isOwner={board.isOwner} />
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getAttemptPoints, getAttemptResult, getMySquads, getMyStanding, getViewer } from "@/lib/data";
import { links } from "@/lib/practice/links";
import { MarkingStep } from "@/components/practice/results/MarkingStep";
import { ResultsView } from "@/components/practice/results/ResultsView";

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const [viewer, result] = await Promise.all([getViewer(), getAttemptResult(attemptId)]);
  if (!result) notFound();

  if (result.attempt.status === "in_progress") redirect(links.play(result.set.id));
  if (result.attempt.status === "marking") return <MarkingStep result={result} isPro={viewer.isPro} />;
  // Points this set earned and the new weekly rank; skipped quietly if the leaderboard isn't set up.
  // And where it puts them in their first squad (with at least one friend in it).
  const [points, standing, squads] = await Promise.all([getAttemptPoints(attemptId).catch(() => null), getMyStanding("week").catch(() => null), getMySquads()]);
  const squad = squads.find((s) => s.members > 1 && s.myRank) ?? null;
  return (
    <ResultsView
      result={result}
      isPro={viewer.isPro}
      points={points}
      standing={standing}
      squad={squad && { id: squad.id, name: squad.name, rank: squad.myRank!, members: squad.members }}
    />
  );
}

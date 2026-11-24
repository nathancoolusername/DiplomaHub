import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getViewer } from "@/lib/data";
import { getDraftFileUrl, getReviewAllowance, getReviewProject, ReviewsNotReadyError } from "@/lib/data/supabase/reviews";
import { NotReady } from "@/components/review/NotReady";
import { subjectById } from "@/lib/catalog";
import { criteriaView } from "@/lib/review/view";
import { reviewContext } from "@/lib/review/context";
import { links } from "@/lib/practice/links";
import { ProjectView } from "@/components/review/ProjectView";

export const metadata: Metadata = { title: "Coursework review", robots: { index: false } };

export default async function ReviewProjectPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ d?: string }> }) {
  const { projectId } = await params;
  const { d } = await searchParams;
  const uid = await getCurrentUserId();
  if (!uid) redirect(`/login?next=/review/${projectId}`);
  if (!(await getViewer()).isPro) redirect(links.plans());
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();
  let project, allowance;
  try {
    [project, allowance] = await Promise.all([getReviewProject(projectId), getReviewAllowance()]);
  } catch (e) {
    if (e instanceof ReviewsNotReadyError) return <NotReady />;
    throw e;
  }
  if (!project) notFound();
  // The PDF for the draft on show, so its review can be read on the page itself.
  const shown = project.drafts.find((x) => x.id === d) ?? project.drafts[0];
  const fileUrl = shown?.status === "done" ? await getDraftFileUrl(shown.id) : null;
  const ctx = await reviewContext(uid, project.subjectId, project.level);
  const view = criteriaView(project.kind, project.subjectId, ctx);
  if (!view) notFound();
  const subjectName = project.subjectId ? (subjectById(project.subjectId as Parameters<typeof subjectById>[0])?.name ?? null) : null;

  return (
    <div className="max-w-[1320px] mx-auto px-md py-xl">
      <ProjectView project={project} criteria={view} allowance={allowance} subjectName={subjectName} selectedId={d ?? null} fileUrl={fileUrl} level={ctx.level ?? "SL"} />
    </div>
  );
}

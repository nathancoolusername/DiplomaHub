import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getViewer } from "@/lib/data";
import { getReviewAllowance, getReviewProjects, ReviewsNotReadyError } from "@/lib/data/supabase/reviews";
import { NotReady } from "@/components/review/NotReady";
import { subjectById } from "@/lib/catalog";
import { KIND_LABELS } from "@/lib/review/labels";
import { reportTotal } from "@/lib/review/report";
import { criteriaView } from "@/lib/review/view";
import { reviewContext } from "@/lib/review/context";
import { links } from "@/lib/practice/links";
import { AllowancePill } from "@/components/review/AllowancePill";

export const metadata: Metadata = { title: "Coursework review", robots: { index: false } };

// /review (Pro): the student's IA, EE and TOK projects, each with its drafts
// and reviews, and this month's allowance (6 full reviews, any mix).
export default async function ReviewHomePage() {
  const uid = await getCurrentUserId();
  if (!uid) redirect("/login?next=/review");
  if (!(await getViewer()).isPro) redirect(links.plans());
  let projects, allowance;
  try {
    [projects, allowance] = await Promise.all([getReviewProjects(), getReviewAllowance()]);
  } catch (e) {
    if (e instanceof ReviewsNotReadyError) return <NotReady />;
    throw e;
  }

  const contexts = Object.fromEntries(await Promise.all(projects.map(async (p) => [p.id, await reviewContext(uid, p.subjectId, p.level)] as const)));

  return (
    <div className="max-w-[1100px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Coursework review</h1>
        <p className="text-body-lg text-on-surface-variant max-w-[720px]">
          Upload a draft of your IA, extended essay or TOK work. Bro marks it against the official criteria like a moderator would, pins comments to your
          pages, and tracks what changes from draft to draft.
        </p>
        <div className="flex flex-wrap items-center gap-sm">
          <Link href="/review/new" className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:opacity-90">
            <Plus size={16} aria-hidden="true" /> New project
          </Link>
          <AllowancePill allowance={allowance} />
        </div>
      </header>

      {projects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-outline-variant p-xl flex flex-col items-center text-center gap-sm">
          <FileText size={28} className="text-primary" aria-hidden="true" />
          <p className="font-serif font-bold text-headline-md text-on-surface">Nothing here yet</p>
          <p className="text-body-md text-on-surface-variant max-w-[480px]">
            Start a project for each piece of coursework: your Maths IA, your EE, your TOK essay. Every draft you upload stays with it, so you can see your marks move.
          </p>
        </section>
      ) : (
        <ul className="grid gap-md sm:grid-cols-2">
          {projects.map((p) => {
            const latest = p.drafts[0];
            const done = p.drafts.find((d) => d.status === "done" && d.report);
            const view = criteriaView(p.kind, p.subjectId, contexts[p.id]);
            const total = done?.report && view ? reportTotal(done.report, Object.fromEntries(view.criteria.map((c) => [c.id, c.max]))) : null;
            const subject = p.subjectId ? subjectById(p.subjectId as Parameters<typeof subjectById>[0])?.shortName : null;
            return (
              <li key={p.id}>
                <Link
                  href={`/review/${p.id}`}
                  className="h-full rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-xs hover:border-primary transition-colors"
                >
                  <span className="text-label-sm text-on-surface-variant">
                    {KIND_LABELS[p.kind]}
                    {subject ? ` · ${subject}` : ""}
                  </span>
                  <span className="font-serif font-bold text-headline-md text-on-surface">{p.title}</span>
                  {p.question && <span className="text-label-md text-on-surface-variant line-clamp-2">{p.question}</span>}
                  <span className="mt-auto pt-sm text-label-md text-on-surface-variant">
                    {!latest
                      ? "No drafts yet"
                      : latest.status === "marking"
                        ? `Draft ${latest.version} is being reviewed. It'll be ready in a few minutes.`
                        : total && view
                          ? `Latest review: ${total.low === total.high ? total.low : `${total.low}–${total.high}`} / ${total.max ?? view.total} · ${p.drafts.length} draft${p.drafts.length === 1 ? "" : "s"}`
                          : `Draft ${latest.version} uploaded`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

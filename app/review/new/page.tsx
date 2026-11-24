import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getUserSubjects, getViewer } from "@/lib/data";
import { allSubjects } from "@/lib/catalog";
import { IA_SUBJECTS } from "@/lib/review/labels";
import { links } from "@/lib/practice/links";
import { NewProjectForm } from "@/components/review/NewProjectForm";

export const metadata: Metadata = { title: "New coursework project", robots: { index: false } };

export default async function NewReviewProjectPage() {
  if (!(await getCurrentUserId())) redirect("/login?next=/review/new");
  if (!(await getViewer()).isPro) redirect(links.plans());
  const userSubjects = await getUserSubjects();
  const mine = userSubjects.map((s) => s.subject.id as string);
  const levels = Object.fromEntries(userSubjects.filter((s) => s.levelSet).map((s) => [s.subject.id as string, s.level]));
  // The student's subjects first, then the rest.
  const subjects = allSubjects()
    .map((s) => ({ id: s.id as string, name: s.name, shortName: s.shortName, ibGroup: s.ibGroup, mine: mine.includes(s.id), ia: s.id in IA_SUBJECTS, iaLabel: IA_SUBJECTS[s.id] ?? null, level: (levels[s.id] as "SL" | "HL" | undefined) ?? null }))
    .sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name));

  return (
    <div className="max-w-[720px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg text-on-surface">New project</h1>
        <p className="text-body-md text-on-surface-variant">One project per piece of coursework. You&apos;ll upload drafts to it next.</p>
      </header>
      <NewProjectForm subjects={subjects} />
    </div>
  );
}

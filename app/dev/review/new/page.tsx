import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allSubjects } from "@/lib/catalog";
import { IA_SUBJECTS } from "@/lib/review/labels";
import { NewProjectForm } from "@/components/review/NewProjectForm";

export const metadata: Metadata = { title: "New project (demo)", robots: { index: false } };

// Dev-only: the new-project form for a sample student (Maths AA HL, Biology HL,
// Chemistry SL, English A Lit SL, French B SL, History HL). Not served in production.
const MINE: Record<string, "SL" | "HL"> = { math_aa: "HL", biology: "HL", chemistry: "SL", english_a_lit: "SL", french_b: "SL", history: "HL" };

export default function NewProjectDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const subjects = allSubjects()
    .map((s) => ({
      id: s.id as string,
      name: s.name,
      shortName: s.shortName,
      ibGroup: s.ibGroup,
      mine: s.id in MINE,
      ia: s.id in IA_SUBJECTS,
      iaLabel: IA_SUBJECTS[s.id] ?? null,
      level: MINE[s.id] ?? null,
    }))
    .sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name));
  return (
    <div className="max-w-[720px] mx-auto px-md py-xl flex flex-col gap-lg">
      <h1 className="font-serif font-bold text-headline-lg text-on-surface">New project</h1>
      <NewProjectForm subjects={subjects} />
    </div>
  );
}

import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { toMarkscheme, toQuestion } from "@/lib/data/supabase/map";
import { findSubtopic, subjectById } from "@/lib/catalog";
import type { SubjectId } from "@/lib/data/types";
import type { CheckSubject } from "@/components/home/system/QuickCheck";
import { getSampleQuestions } from "./sample";

// The homepage's "Try 3 questions": three verified bank questions per
// practice subject, public on purpose (question and markscheme). Only the
// ids live here; the questions come from the database. Add a subject's ids
// here when its questions join the bank. Pick short, verified,
// diagram-free questions from different topics. Where the subject has a
// multiple-choice paper (Biology, Chemistry, Physics, Maths AA), the first
// question is multiple choice.
const QUICK_CHECK: Partial<Record<SubjectId, string[]>> = {
  biology: ["gen-5130d598-5703-5ff0-a650-bceb7333f9aa", "gen-deb9f12d-322f-5317-858d-887480a3b3db", "gen-d06d0e18-9c4c-54cb-922c-0ae164c11e3c"],
  business: ["gen-34cba3e7-2a4e-5f86-a3df-8cddefd1dc4d", "gen-e25c7955-e63e-5090-ac7f-e79a39bde987", "gen-f718ca15-0774-5b35-9da9-495aee1a7a41"],
  chemistry: ["gen-7a431ea1-2a19-5613-9917-1f76fbfc2b99", "gen-02e9da15-d19a-5b5d-a7e7-118ca01703e9", "gen-25993c0f-0ded-5e8a-9e31-c9829d068daf"],
  economics: ["gen-0746d7f9-7ad8-5db5-9691-0dfb2d00d527", "gen-2bcecee8-1ee9-5a84-bd04-887f8f9de0af", "gen-1eb5438e-43c3-5f19-9f96-a0922f41f8d7"],
  geography: ["gen-8b9ec674-a4c6-525d-b4af-963856e8f16b", "gen-50cb6a7f-8c36-58b4-a305-39ba33ff1ab9", "gen-14885cfe-e752-5144-9c02-88910508bb89"],
  math_aa: ["gen-d56d151a-40c2-582c-9761-a87384ac58e7", "gen-8d52cefa-939f-5e21-a4b3-688aebaeb144", "gen-120004c6-6f37-5e7d-8465-5ab6fe58a6db"],
  math_ai: ["gen-0d62f849-b2a4-56f8-bc8b-5126afe24db9", "gen-8e35b5e7-795a-5c5e-8f8d-8118239baaf3", "gen-87a4c69a-bbd7-583c-9490-b93b19e8dce2"],
  physics: ["gen-60f27c44-516e-55a4-89e6-e556471b90f3", "gen-e7d67650-079d-5b22-9b32-abc302581323", "gen-1ae04f1b-e6f6-50b8-ac83-e2c11e68aa8d"],
};

const label = (id: SubjectId) => subjectById(id)?.shortName ?? id;
const topic = (id: SubjectId, sub: string) => findSubtopic(id, sub)?.shortName ?? sub;

/** One question set per subject, in the order above (cached for a day; the page is static). */
export const getQuickCheckSubjects = unstable_cache(
  async (): Promise<CheckSubject[]> => {
    try {
      const ids = Object.values(QUICK_CHECK).flat();
      const { data, error } = await createAdminClient().from("questions").select("*").in("id", ids).eq("status", "verified");
      if (error || !data?.length) throw error ?? new Error("no questions");
      const byId = new Map(data.map((row) => [row.id as string, row]));
      return (Object.entries(QUICK_CHECK) as [SubjectId, string[]][])
        .map(([id, qids]) => ({
          id,
          label: label(id),
          questions: qids
            .map((q) => byId.get(q))
            .filter((row) => !!row)
            .map((row) => {
              const question = toQuestion(row);
              return { question, markscheme: toMarkscheme({ ...row, question_id: row.id }), subjectLabel: label(id), topic: topic(id, question.subtopicId) };
            }),
        }))
        .filter((s) => s.questions.length > 0);
    } catch {
      // Never break the homepage: fall back to the hand-written samples, one subject each.
      return getSampleQuestions().map((s) => {
        const id = s.question.subjectId as SubjectId;
        return { id, label: label(id), questions: [{ ...s, subjectLabel: label(id), topic: topic(id, s.question.subtopicId) }] };
      });
    }
  },
  ["homepage-quick-check-v2"],
  { revalidate: 86_400 },
);

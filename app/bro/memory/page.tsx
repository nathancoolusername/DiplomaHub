import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getBroMemory } from "@/lib/data";
import { MemoryManager } from "@/components/bro/MemoryManager";

export const metadata: Metadata = { title: "What Bro remembers", robots: { index: false } };

// Everything DiplomaBro remembers about the student, to see, edit, add to and
// delete (DiplomaBro spec: memory students control, GDPR). Open to every
// signed-in student, so memory can still be deleted after Pro ends.
export default async function BroMemoryPage() {
  if (!(await getCurrentUserId())) redirect("/login?next=/bro/memory");
  const items = await getBroMemory();

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">What Bro remembers</h1>
        <p className="text-body-lg text-on-surface-variant">
          Bro saves short notes about your goals, what you find hard and how you like help, so it doesn&apos;t have to ask again. It never keeps
          anything about your health, family, religion or where you live. Edit or delete anything here; it&apos;s gone for good.
        </p>
      </header>
      <MemoryManager initial={items} />
    </div>
  );
}

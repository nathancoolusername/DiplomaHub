import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getBroMemory, getViewer } from "@/lib/data";
import { links } from "@/lib/practice/links";
import { BroChatPage } from "@/components/bro/BroChatPage";

export const metadata: Metadata = { title: "DiplomaBro", robots: { index: false } };

// /bro: DiplomaPro's home for Bro. The full-page chat with "What Bro
// remembers" beside it. Pro only: everyone else goes to the DiplomaPro page,
// which explains Bro (memory can still be deleted at /bro/memory).
export default async function BroPage() {
  if (!(await getCurrentUserId())) redirect("/login?next=/bro");
  if (!(await getViewer()).isPro) redirect(links.plans());
  return <BroChatPage memory={await getBroMemory()} />;
}

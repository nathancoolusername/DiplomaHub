import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import WriteDiscussionForm from "@/components/community/WriteDiscussionForm";

export default async function WriteDiscussionPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return <WriteDiscussionForm />;
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import WriteDiscussionForm from "@/components/community/WriteDiscussionForm";

export default async function WriteDiscussionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <WriteDiscussionForm />;
}

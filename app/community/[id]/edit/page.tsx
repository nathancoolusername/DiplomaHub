import { redirect, notFound } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getDiscussionForEdit } from "@/app/lib/actions/discussions";
import WriteDiscussionForm from "@/components/community/WriteDiscussionForm";

export default async function EditDiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const result = await getDiscussionForEdit(id);
  if (!result.success) notFound();

  return <WriteDiscussionForm discussion={result.data} />;
}

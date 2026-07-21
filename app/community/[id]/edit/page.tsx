import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import { getDiscussionForEdit } from "@/app/lib/actions/discussions";
import WriteDiscussionForm from "@/components/community/WriteDiscussionForm";

export default async function EditDiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const result = await getDiscussionForEdit(id);
  if (!result.success) notFound();

  return <WriteDiscussionForm discussion={result.data} />;
}

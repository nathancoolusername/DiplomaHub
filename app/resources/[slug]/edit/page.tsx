import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import { getResourceForEdit } from "@/app/lib/actions/resources";
import UploadResourceForm from "@/components/resources/UploadResourceForm";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const result = await getResourceForEdit(slug);
  if (!result.success) notFound();

  return <UploadResourceForm resource={result.data} />;
}

import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import UploadResourceForm from "@/components/resources/UploadResourceForm";

export default async function UploadResourcePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return <UploadResourceForm />;
}

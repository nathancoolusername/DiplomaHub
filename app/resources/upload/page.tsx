import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import UploadResourceForm from "@/components/resources/UploadResourceForm";

export default async function UploadResourcePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <UploadResourceForm />;
}

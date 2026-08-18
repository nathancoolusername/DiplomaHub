import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import WriteArticleForm from "@/components/articles/WriteArticleForm";

export default async function WriteArticlePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return <WriteArticleForm />;
}

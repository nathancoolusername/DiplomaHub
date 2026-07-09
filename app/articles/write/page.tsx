import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import WriteArticleForm from "@/components/articles/WriteArticleForm";

export default async function WriteArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <WriteArticleForm />;
}

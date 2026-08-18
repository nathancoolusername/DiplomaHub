import { redirect, notFound } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getArticleForEdit } from "@/app/lib/actions/articles";
import WriteArticleForm from "@/components/articles/WriteArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { slug } = await params;
  const result = await getArticleForEdit(slug);
  if (!result.success) notFound();

  return <WriteArticleForm article={result.data} />;
}

import { Pencil } from "lucide-react";
import Link from "next/link";
import Button from "../../components/button";
import ArticleGrid from "../../components/articles/article-grid";
import { getArticles } from "@/app/lib/actions/articles";

export default async function Articles() {
  const result = await getArticles();

  if (!result.success) {
    return (
      <p className="text-red-500">Failed to load articles: {result.error}</p>
    );
  }

  const data = result.data.map((a) => ({ ...a, subject_tag: a.topic }));

  return (
    <div className="flex flex-col bg-surface-bright px-margin py-lg gap-margin">
      <div className="flex flex-row justify-between py-margin">
        <div>
          <h1 className="text-display-lg font-serif font-bold">
            Article Archive
          </h1>
          <h1 className="text-on-surface-variant text-body-lg w-170">
            A curated collection of articles, guides, and student experiences
            from across the IB community.
          </h1>
        </div>
        <Link href={"/articles/write"}>
          <Button className="h-12 self-center text-body-lg">
            <div className="flex flex-row items-center gap-sm text-label-md font-sans">
              <Pencil />
              Write Article
            </div>
          </Button>
        </Link>
      </div>

      <ArticleGrid data={data} />
    </div>
  );
}

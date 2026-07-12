import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/app/lib/actions/articles";
import { getComments } from "@/app/lib/actions/comments";
import { getCurrentUser } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";
import {
  ChevronRight,
  CircleUser,
  Calendar,
  Eye,
  Share2,
  Pencil,
} from "lucide-react";
import Comments from "@/components/detailed-articles/comments";
import { DeleteArticleButton } from "@/components/articles/DeleteArticleButton";
import { estimateReadTime } from "@/app/lib/readTime";
import { LikeButton } from "@/components/likeButton";
import { SaveButton } from "@/components/saveButton";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [result, currentUser] = await Promise.all([
    getArticle(slug),
    getCurrentUser(),
  ]);

  if (!result.success) notFound();
  const article = result.data;

  const commentsResult = await getComments({ article_id: article.id });
  const comments = commentsResult.success ? commentsResult.data : [];

  const isOwner =
    currentUser?.id === article.author_id || isAdmin(currentUser?.id);

  const createdAt = new Date(article.created_at);
  const month = months[createdAt.getMonth()];
  const final =
    month + " " + createdAt.getDate() + ", " + createdAt.getFullYear();

  const final_view =
    article.view_count >= 1000
      ? (() => {
          const shortened = article.view_count / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : article.view_count;
  const readTime = estimateReadTime(article.content);

  return (
    <div className="flex flex-col px-md md:px-10 xl:px-100 py-10  gap-gutter bg-surface-container-lowest">
      <div className="flex flex-row gap-sm items-center">
        <Link href={"/articles"}>
          <h1 className={`text-on-surface-variant text-headline-md uppercase`}>
            articles
          </h1>
        </Link>
        <ChevronRight />
        <h1 className={`text-secondary text-headline-md uppercase`}>
          {article.topic}
        </h1>
      </div>

      <h1 className={`font-serif text-display-lg font-bold`}>
        {article.title}
      </h1>

      <div className="border-b-1 border-outline-variant flex flex-row pb-md gap-gutter">
        <div className="flex flex-row items-center gap-sm">
          <CircleUser />
          <div className="flex flex-col">
            <h1 className="text-body-lg">{article.author?.display_name}</h1>
            <h1 className="text-label-md text-on-surface-variant">
              {article.author?.is_pro ? "Diploma Pro" : ""}
            </h1>
          </div>
        </div>
        <div className="flex flex-row items-center gap-sm">
          <Calendar />
          <h1>{final}</h1>
        </div>
        <h1 className="text-on-surface-variant self-center">
          {readTime} min read
        </h1>
      </div>

      <div className="relative w-full aspect-video rounded-xl overflow-hidden">
        <Image
          src={
            article.cover_image_url ||
            "/option-pics/StudentLife/StudentLife1.jpg"
          }
          alt={article.title}
          fill
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
          priority
        />
      </div>

      <div className="pb-10 border-b-1 border-outline-variant">
        <div
          className="article-content font-sans text-body-lg text-on-surface"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>

      <div className=" pt-md flex flex-row">
        <div className="flex flex-row items-center">
          <LikeButton
            target={{ article_id: article.id }}
            initiallyLiked={article.isLiked ?? false}
            initialCount={article.like_count}
            path={`/articles/${article.slug}`}
            size={30}
            className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer hover:border-outline-variant border-white border-b-1 flex flex-row items-center"
          />
          <div className="text-on-surface-variant transition hover:text-primary p-sm">
            <Eye size={30} />
          </div>
          <h1 className="text-on-surface-variant text-body-lg ml-sm">
            {final_view} views
          </h1>
        </div>
        <div className="ml-auto text-on-surface-variant rounded-xl flex flex-row gap-md items-center">
          <SaveButton
            target={{ article_id: article.id }}
            initiallySaved={article.isSaved ?? false}
            path={`/articles/${article.slug}`}
            size={50}
            className="rounded-xl text-display-lg transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
          />
          <Share2
            size={50}
            className="rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
          />
          {isOwner && (
            <Link href={`/articles/${article.slug}/edit`}>
              <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer">
                <Pencil size={30} />
              </div>
            </Link>
          )}
          {isOwner && <DeleteArticleButton articleId={article.id} />}
        </div>
      </div>

      <Comments
        kind="comment"
        target={{ article_id: article.id }}
        initialItems={comments}
        path={`/articles/${article.slug}`}
        isLoggedIn={!!currentUser}
        currentUserId={currentUser?.id ?? null}
      />
    </div>
  );
}

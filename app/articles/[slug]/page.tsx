import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { getPublishedArticle, getPublicComments } from "@/app/lib/public-content";
import { stripHtml } from "@/app/lib/stripHtml";
import { Calendar, Eye, Pencil } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DiplomaProBadge } from "@/components/DiplomaProBadge";
import { DeleteArticleButton } from "@/components/articles/DeleteArticleButton";
import { estimateReadTime } from "@/app/lib/readTime";
import {
  ArticleViewCounter,
  OwnerOnly,
  ViewerComments,
  ViewerLikeButton,
  ViewerProvider,
  ViewerSaveButton,
} from "@/components/detail/ViewerActions";
import { ShareButton } from "@/components/shareButton";
import { Avatar } from "@/components/avatar";
import { JsonLd } from "@/components/JsonLd";

// Rendered once and served from the cache to everyone, rebuilt at most hourly
// and straight away when the article is edited, deleted or commented on
// (revalidatePath in the actions). Nothing here may depend on the visitor:
// liked/saved, owner controls, the comment box and the view count are all
// handled in the browser by components/detail/ViewerActions.tsx.
export const revalidate = 3600;

// Empty = no articles built at deploy time; each is built on its first visit.
export async function generateStaticParams() {
  return [];
}

// generateMetadata and the page both need this article — React's cache()
// dedupes them into one fetch per render.
const getArticle = cache(getPublishedArticle);

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  const { title, content } = article;
  return {
    title,
    description: stripHtml(content).slice(0, 160),
    alternates: { canonical: `/articles/${slug}` },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const comments = await getPublicComments({ article_id: article.id });

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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: stripHtml(article.content).slice(0, 200),
    datePublished: article.created_at,
    image: article.cover_image_url || undefined,
    author: {
      "@type": "Person",
      name: article.author?.display_name ?? "DiplomaHub",
    },
    publisher: { "@type": "Organization", name: "DiplomaHub" },
    url: `https://www.diplomahub.org/articles/${article.slug}`,
  };

  return (
    <ViewerProvider target={{ article_id: article.id }} authorId={article.author_id}>
      <JsonLd data={articleJsonLd} />
      <ArticleViewCounter articleId={article.id} />
      <div className="flex flex-col px-md md:px-10 xl:px-100 py-10  gap-gutter bg-surface-container-lowest">
        <Breadcrumb
          parentLabel="articles"
          parentHref="/articles"
          currentLabel={article.topic}
          currentClassName="text-secondary"
        />

        <h1 className={`font-serif text-display-lg font-bold`}>
          {article.title}
        </h1>

        <div className="border-b-1 border-outline-variant flex flex-row flex-wrap gap-y-sm pb-md gap-gutter">
          <div className="flex flex-row items-center gap-sm">
            <Avatar
              src={article.author?.avatar_url}
              name={article.author?.display_name ?? "?"}
              size={40}
            />
            <div className="flex flex-col">
              <p className="text-body-lg">{article.author?.display_name}</p>
              {article.author?.is_pro && (
                <DiplomaProBadge className="text-label-md text-on-surface-variant" />
              )}
            </div>
          </div>
          <div className="flex flex-row items-center gap-sm">
            <Calendar />
            <p>{final}</p>
          </div>
          <p className="text-on-surface-variant self-center">
            {readTime} min read
          </p>
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

        <div className=" pt-md flex flex-row flex-wrap gap-y-sm">
          <div className="flex flex-row items-center">
            <ViewerLikeButton
              target={{ article_id: article.id }}
              initialCount={article.like_count}
              size={30}
              className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer hover:border-outline-variant border-transparent border-b-1 flex flex-row items-center"
            />
            <div className="text-on-surface-variant transition hover:text-primary p-sm">
              <Eye size={30} />
            </div>
            <p className="text-on-surface-variant text-body-lg ml-sm">
              {final_view} views
            </p>
          </div>
          <div className="ml-auto text-on-surface-variant rounded-xl flex flex-row gap-md items-center">
            <ViewerSaveButton
              target={{ article_id: article.id }}
              size={36}
              className="rounded-xl text-display-lg transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
            />
            <ShareButton
              size={36}
              className="rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
            />
            <OwnerOnly>
              <Link href={`/articles/${article.slug}/edit`}>
                <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer">
                  <Pencil size={30} />
                </div>
              </Link>
              <DeleteArticleButton articleId={article.id} />
            </OwnerOnly>
          </div>
        </div>

        <ViewerComments
          target={{ article_id: article.id }}
          initialItems={comments}
          path={`/articles/${article.slug}`}
        />
      </div>
    </ViewerProvider>
  );
}

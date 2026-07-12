import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { stripHtml } from "@/app/lib/stripHtml";
import { LikeButton } from "@/components/likeButton";
import { SaveButton } from "@/components/saveButton";
import { Avatar } from "@/components/avatar";

type PanelArticle = {
  id: string | number;
  slug?: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string | null;
  like_count: number;
  view_count: number;
  isLiked?: boolean;
  isSaved?: boolean;
  author?: {
    name?: string;
    display_name?: string;
    is_pro?: boolean;
    avatar_url?: string | null;
  };
};

export default function Panel({
  children,
  article,
  href,
}: {
  children?: React.ReactNode;
  article: PanelArticle;
  href?: string;
}) {
  const linkHref = href ?? `/articles/${article.slug ?? article.id}`;

  return (
    <div
      key={article.id}
      className="group flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden cursor-pointer h-130 hover:border-primary hover:drop-shadow-xl/25 transition duration-200"
    >
      <Link href={linkHref}>
        <div className="overflow-hidden relative h-48">
          <Image
            src={
              article.cover_image_url ||
              "/option-pics/StudentLife/StudentLife1.jpg"
            }
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="z-1 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {children}
        </div>
      </Link>
      <div className="p-md flex flex-col justify-between flex-1">
        <Link href={linkHref}>
          <div className="gap-md mx-md flex flex-col">
            <div className="mt-md">
              <h1 className="text-headline-md font-serif font-bold transition duration-200 group-hover:text-primary">
                {article.title}
              </h1>
            </div>
            <div>
              <h1 className="text-on-surface-variant text-body-sm">
                {article.excerpt ??
                  (article.content
                    ? `${stripHtml(article.content).slice(0, 140)}…`
                    : "")}
              </h1>
            </div>
          </div>
        </Link>
        <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
          <div className="flex flex-row items-center gap-sm">
            <Avatar
              src={article.author?.avatar_url}
              name={article.author?.display_name ?? article.author?.name ?? "?"}
              size={36}
            />
            <div className="flex flex-col">
              <h1 className="text-body-md">
                {article.author?.display_name ?? article.author?.name}
              </h1>
              <h1 className="text-on-primary-fixed-variant font-bold text-label-sm">
                {article.author?.is_pro ? "Diploma Pro" : ""}
              </h1>
            </div>
          </div>
          <div className="flex flex-row items-center ml-auto text-primary">
            <LikeButton
              target={{ article_id: String(article.id) }}
              initiallyLiked={article.isLiked ?? false}
              initialCount={article.like_count}
              path="/articles"
            />
            <Eye />
            <h1 className="text-on-surface-variant text-body-lg ml-sm">
              {article.view_count}
            </h1>
            <SaveButton
              target={{ article_id: String(article.id) }}
              initiallySaved={article.isSaved ?? false}
              path="/articles"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Heart, Eye, CircleUser } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { stripHtml } from "@/app/lib/stripHtml";

type PanelArticle = {
  id: string | number;
  slug?: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string | null;
  like_count: number;
  view_count: number;
  author?: {
    name?: string;
    display_name?: string;
    is_pro?: boolean;
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
            <CircleUser />
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
            <Heart />
            <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">
              {article.like_count}
            </h1>
            <Eye />
            <h1 className="text-on-surface-variant text-body-lg ml-sm">
              {article.view_count}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

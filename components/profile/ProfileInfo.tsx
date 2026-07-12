"use client";
import type { Article, Resource, Discussion } from "@/app/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ResourcePanel from "../home/article-section/article-panel";
import DiscussionPanel from "../community/discussion-panel";
import ArticlePanel from "../articles/article-panel";
import Comment from "../detailed-articles/comment";
import { LoadMoreList } from "./LoadMoreList";
import { deleteComment } from "@/app/lib/actions/comments";

type CommentWritten = {
  id: string;
  content: string;
  created_at: string;
  resource_id: string | null;
  article_id: string | null;
  resource?: { title: string } | { title: string }[] | null;
  article?: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

export default function ProfileInfo({
  articles,
  resources,
  discussions,
  totalLikes,
  total_downloads,
  commentsWritten,
  bio,
  trust,
  self,
  savedItems,
  drafts,
  author,
  profileUserId,
}: {
  articles: Article[];
  resources: Resource[];
  discussions: Discussion[];
  commentsWritten: CommentWritten[];
  totalLikes: number;
  total_downloads: number;
  bio: string | null;
  trust: number;
  self: boolean;
  savedItems: {
    resources: Resource[];
    articles: Article[];
    discussions: Discussion[];
  } | null;
  drafts: Article[] | null;
  author: {
    display_name: string;
    is_pro: boolean;
    ib_year: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
  };
  profileUserId: string;
}) {
  const router = useRouter();

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const result = await deleteComment(commentId, `/profile/${profileUserId}`);
    if (result.success) router.refresh();
  }

  const final_like =
    totalLikes >= 1000
      ? (() => {
          const shortened = totalLikes / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : totalLikes;
  const [section, setSection] = useState("Resources");
  function handleClick(section: string) {
    setSection(section);
  }

  return (
    <div className="flex flex-row bg-surface-container-low grow h-full py-10 px-md md:px-10 xl:px-30 gap-margin">
      <div className="flex flex-col basis-1/4 gap-lg">
        <div className="bg-surface-container-lowest p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-lg">
          <h1 className="font-serif text-headline-lg font-bold">Analytics</h1>
          <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-3 cursor-pointer">
            <h1 className="text-on-surface-variant text-body-lg">
              <b>Resources</b> Uploaded
            </h1>
            <h1 className="text-primary text-body-lg font-bold">
              {resources.length}
            </h1>
          </div>
          <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-3 cursor-pointer">
            <h1 className="text-on-surface-variant text-body-lg">
              <b>Downloads</b>
            </h1>
            <h1 className="text-primary text-body-lg font-bold">
              {`${total_downloads}`}
            </h1>
          </div>
          <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-3 cursor-pointer">
            <h1 className="text-on-surface-variant text-body-lg">
              <b>Articles</b> Written
            </h1>
            <h1 className="text-primary text-body-lg font-bold">
              {articles.length}
            </h1>
          </div>
          <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-3 cursor-pointer">
            <h1 className="text-on-surface-variant text-body-lg">
              <b>Discussions</b> Started
            </h1>
            <h1 className="text-primary text-body-lg font-bold">
              {discussions.length}
            </h1>
          </div>
          <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-3 cursor-pointer">
            <h1 className="text-on-surface-variant text-body-lg">
              <b>Likes</b> Received
            </h1>
            <h1 className="text-primary text-body-lg font-bold">
              {final_like}
            </h1>
          </div>
          <div className="flex flex-row justify-between pb-3 cursor-pointer">
            <h1 className="text-on-surface-variant text-body-lg">
              <b>Comments</b> Written
            </h1>
            <h1 className="text-primary text-body-lg font-bold">
              {commentsWritten.length}
            </h1>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-lg">
          {bio && (
            <div className="flex flex-col gap-lg">
              <h1 className="font-serif text-headline-lg font-bold">About</h1>{" "}
              <h1 className="text-body-lg text-on-surface-variant">{bio}</h1>
            </div>
          )}
          <h1 className="font-serif text-headline-lg font-bold self-center">
            Community Trust
          </h1>
          <h1 className="font-serif font-bold text-headline-lg text-primary self-center">
            {trust} %
          </h1>
        </div>
      </div>
      <div className="flex-col flex basis-3/5 gap-margin">
        <div className="flex flex-row gap-margin border-b-1 border-outline-variant">
          <button
            onClick={() => handleClick("Resources")}
            className={`text-headline-md transition-colors pb-3 cursor-pointer ${
              section == "Resources"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => handleClick("Discussions")}
            className={`text-headline-md transition-colors pb-3 cursor-pointer ${
              section == "Discussions"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => handleClick("Articles")}
            className={`text-headline-md transition-colors pb-3 cursor-pointer ${
              section == "Articles"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Articles
          </button>
          <button
            onClick={() => handleClick("Comments")}
            className={`text-headline-md transition-colors pb-3 cursor-pointer ${
              section == "Comments"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Comments
          </button>
          {self && (
            <button
              onClick={() => handleClick("Saves")}
              className={`text-headline-md transition-colors pb-3 cursor-pointer ${
                section == "Saves"
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Saves
            </button>
          )}
          {self && (
            <button
              onClick={() => handleClick("Draft")}
              className={`text-headline-md transition-colors pb-3 cursor-pointer ${
                section == "Draft"
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Drafts
            </button>
          )}
        </div>
        {section == "Resources" && (
          <LoadMoreList
            items={resources}
            listClassName="grid grid-cols-2 gap-gutter items-center"
            emptyMessage="No published resources yet."
            renderItem={(resource) => (
              <div key={resource.id}>
                <ResourcePanel resource={resource} />
              </div>
            )}
          />
        )}

        {section == "Discussions" && (
          <LoadMoreList
            items={discussions}
            listClassName="flex flex-col gap-gutter"
            emptyMessage="No published discussions yet."
            renderItem={(discussion) => (
              <div key={discussion.id}>
                <DiscussionPanel discussion={discussion} />
              </div>
            )}
          />
        )}

        {section == "Articles" && (
          <LoadMoreList
            items={articles}
            listClassName="grid grid-cols-2 gap-gutter"
            emptyMessage="No published articles yet."
            renderItem={(article) => (
              <div key={article.id}>
                <ArticlePanel article={article} />
              </div>
            )}
          />
        )}
        {section == "Comments" && (
          <LoadMoreList
            items={commentsWritten}
            listClassName="flex flex-col gap-gutter items-cener"
            emptyMessage="No published comments yet."
            renderItem={(comment) => {
              const resource = Array.isArray(comment.resource)
                ? comment.resource[0]
                : comment.resource;
              const article = Array.isArray(comment.article)
                ? comment.article[0]
                : comment.article;
              const targetHref = resource
                ? `/resources/${comment.resource_id}`
                : article
                  ? `/articles/${article.slug}`
                  : null;
              const targetTitle = resource?.title ?? article?.title;
              return (
                <div key={comment.id} className="flex flex-col gap-sm">
                  {targetHref && targetTitle && (
                    <Link
                      href={targetHref}
                      className="text-on-surface-variant text-body-sm hover:text-primary"
                    >
                      Commented on <span className="font-bold">{targetTitle}</span>
                    </Link>
                  )}
                  <Comment
                    content={comment.content}
                    createdAt={comment.created_at}
                    author={author}
                    canDelete={self}
                    onDelete={() => handleDeleteComment(comment.id)}
                  />
                </div>
              );
            }}
          />
        )}
        {section == "Saves" && (
          <div className="flex flex-col gap-margin">
            <h1 className="text-headline-md font-serif">Saved Resources</h1>
            <LoadMoreList
              items={savedItems?.resources ?? []}
              listClassName="grid grid-cols-2 gap-gutter"
              emptyMessage="No saved resources"
              renderItem={(resource) => (
                <div key={resource.id}>
                  <ResourcePanel resource={resource} />
                </div>
              )}
            />
            <h1 className="text-headline-md font-serif">Saved Discussions</h1>
            <LoadMoreList
              items={savedItems?.discussions ?? []}
              listClassName="flex flex-col gap-gutter"
              emptyMessage="No saved discussions"
              renderItem={(discussion) => (
                <div key={discussion.id}>
                  <DiscussionPanel discussion={discussion} />
                </div>
              )}
            />
            <h1 className="text-headline-md font-serif">Saved Articles</h1>
            <LoadMoreList
              items={savedItems?.articles ?? []}
              listClassName="grid grid-cols-2 gap-gutter items-center"
              emptyMessage="No saved articles"
              renderItem={(article) => (
                <div key={article.id}>
                  <ArticlePanel article={article} />
                </div>
              )}
            />
          </div>
        )}
        {section == "Draft" && (
          <LoadMoreList
            items={drafts ?? []}
            listClassName="grid grid-cols-2 gap-gutter"
            emptyMessage="No drafts"
            renderItem={(article) => (
              <div key={article.id}>
                <ArticlePanel
                  article={article}
                  href={`/articles/${article.slug}/edit`}
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

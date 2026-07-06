"use client";
import type { Article, Resource, Discussion } from "@/app/lib/types";
import { useState } from "react";
import ResourcePanel from "../home/article-section/article-panel";
import DiscussionPanel from "../community/discussion-panel";
import ArticlePanel from "../articles/article-panel";
import Comment from "../detailed-articles/comment";

function groupBySubject<T extends { subject_tag: string | null }>(items: T[]) {
  const grouped: Record<string, T[]> = {};

  for (const item of items) {
    const key = item.subject_tag ?? "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  return grouped;
}

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
}: {
  articles: Article[];
  resources: Resource[];
  discussions: Discussion[];
  commentsWritten: any[];
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
}) {
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
  const groupedArticles = groupBySubject(
    articles.map((a) => ({ ...a, subject_tag: a.topic })),
  );
  const groupedResources = groupBySubject(resources);
  const groupedDiscussions = groupBySubject(
    discussions.map((d) => ({ ...d, subject_tag: d.subject_tag })),
  );
  let savedArticles;
  let savedResources;
  let savedDiscussions;
  if (savedItems?.articles?.length) {
    savedArticles = groupBySubject(
      savedItems.articles.map((a) => ({ ...a, subject_tag: a.topic })),
    );
  }
  if (savedItems?.resources?.length) {
    savedResources = groupBySubject(savedItems.resources);
  }
  if (savedItems?.discussions?.length) {
    savedDiscussions = groupBySubject(
      savedItems.discussions.map((d) => ({ ...d, subject_tag: d.subject_tag })),
    );
  }

  return (
    <div className="flex flex-row bg-surface-container-low grow h-full py-10 px-30 gap-margin">
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
              {total_downloads}
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
          <div className="grid grid-cols-2 gap-gutter items-center">
            {Object.entries(groupedResources).map(([subject, resources]) =>
              resources.map((resource) => (
                <div key={resource.id}>
                  <ResourcePanel resource={resource} />
                </div>
              )),
            )}
            {resources.length === 0 && (
              <p className="text-on-surface-variant text-body-md">
                No published resources yet.
              </p>
            )}
          </div>
        )}

        {section == "Discussions" && (
          <div className="flex flex-col gap-gutter">
            {Object.entries(groupedDiscussions).map(([subject, discussions]) =>
              discussions.map((discussion) => (
                <div key={discussion.id}>
                  <DiscussionPanel discussion={discussion} />
                </div>
              )),
            )}
            {discussions.length === 0 && (
              <p className="text-on-surface-variant text-body-md">
                No published discussions yet.
              </p>
            )}
          </div>
        )}

        {section == "Articles" && (
          <div className="grid grid-cols-2 gap-gutter">
            {Object.entries(groupedArticles).map(([subject, articles]) =>
              articles.map((article) => (
                <div key={article.id}>
                  <ArticlePanel article={article} />
                </div>
              )),
            )}
            {articles.length === 0 && (
              <p className="text-on-surface-variant text-body-md">
                No published articles yet.
              </p>
            )}
          </div>
        )}
        {section == "Comments" && (
          <div className="flex flex-col gap-gutter items-cener">
            {commentsWritten.map((comment) => (
              <div key={comment.id}>
                <Comment />
              </div>
            ))}
            {commentsWritten.length === 0 && (
              <p className="text-on-surface-variant text-body-md">
                No published comments yet.
              </p>
            )}
          </div>
        )}
        {section == "Saves" && (
          <div className="flex flex-col gap-margin">
            <h1 className="text-headline-md font-serif">Saved Resources</h1>
            <div className="grid grid-cols-2 gap-gutter">
              {savedItems?.resources && savedResources ? (
                Object.entries(savedResources).map(([subject, resources]) =>
                  resources.map((resource: Resource) => (
                    <div key={resource.id}>
                      <ResourcePanel resource={resource} />
                    </div>
                  )),
                )
              ) : (
                <h1 className="text-body-md text-on-surface-variant">
                  No saved resources
                </h1>
              )}
            </div>
            <h1 className="text-headline-md font-serif">Saved Discussions</h1>
            <div className="flex flex-col gap-gutter">
              {savedDiscussions ? (
                Object.entries(savedDiscussions).map(
                  ([subject, discussions]: any[]) =>
                    discussions.map((discussion: Discussion) => (
                      <div key={discussion.id}>
                        <DiscussionPanel discussion={discussion} />
                      </div>
                    )),
                )
              ) : (
                <h1 className="text-body-md text-on-surface-variant">
                  No saved discussions
                </h1>
              )}
            </div>
            <h1 className="text-headline-md font-serif">Saved Articles</h1>
            <div className="grid grid-cols-2 gap-gutter items-center">
              {savedArticles ? (
                Object.entries(savedArticles).map(
                  ([subject, articles]: any[]) =>
                    articles.map((article: Article) => (
                      <div key={article.id}>
                        <ArticlePanel article={article} />
                      </div>
                    )),
                )
              ) : (
                <h1 className="text-body-md text-on-surface-variant">
                  No saved articles
                </h1>
              )}
            </div>
          </div>
        )}
        {section == "Draft" &&
          (drafts?.length ? (
            drafts.map((article) => (
              <div key={article.id}>
                <ArticlePanel article={article} />
              </div>
            ))
          ) : (
            <h1 className="text-body-md text-on-surface-variant">No drafts</h1>
          ))}
      </div>
    </div>
  );
}

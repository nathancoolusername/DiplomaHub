import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDiscussion } from "@/app/lib/actions/discussions";
import { getCurrentUser } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";
import { Calendar, Pencil } from "lucide-react";
import Comments from "@/components/detailed-articles/comments";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DiplomaProBadge } from "@/components/DiplomaProBadge";
import { typeTags } from "@/components/community/discussion-panel";
import { DeleteDiscussionButton } from "@/components/community/DeleteDiscussionButton";
import { LikeButton } from "@/components/likeButton";
import { SaveButton } from "@/components/saveButton";
import { ShareButton } from "@/components/shareButton";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/app/lib/relativeTime";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getDiscussion(id);
  if (!result.success) return {};

  const { title, content } = result.data.discussion;
  return {
    title,
    description: content.slice(0, 160),
    alternates: { canonical: `/community/${id}` },
  };
}

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, currentUser] = await Promise.all([
    getDiscussion(id),
    getCurrentUser(),
  ]);
  if (!result.success) notFound();
  const { discussion, replies } = result.data;

  const isOwner =
    currentUser?.id === discussion.author_id || isAdmin(currentUser?.id);

  const finalTime = formatRelativeTime(discussion.created_at);
  const final_like =
    discussion.like_count >= 1000
      ? (() => {
          const shortened = discussion.like_count / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : discussion.like_count;

  const discussionJsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: discussion.title,
    text: discussion.content,
    datePublished: discussion.created_at,
    author: {
      "@type": "Person",
      name: discussion.author?.display_name ?? "DiplomaHub",
    },
    url: `https://www.diplomahub.org/community/${discussion.id}`,
  };

  return (
    <>
      <JsonLd data={discussionJsonLd} />
      <div className="flex flex-col px-md md:px-10 xl:px-50 py-10  gap-gutter bg-surface-container-low">
      <Breadcrumb
        parentLabel="discussions"
        parentHref="/community"
        currentLabel={discussion.subject_tag}
        currentClassName="text-secondary"
      />
      <div className="flex flex-col lg:flex-row gap-margin">
        <div className="flex flex-col gap-margin lg:basis-2/3">
          <div className="flex flex-col bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant gap-lg">
            <p
              className={
                discussion.type_tag ? typeTags[discussion.type_tag] : ""
              }
            >
              {discussion.type_tag}
            </p>

            <h1 className={`font-serif text-display-lg font-bold`}>
              {discussion.title}
            </h1>

            <div className="border-b-1 border-outline-variant flex flex-row flex-wrap gap-y-md pb-md gap-20">
              <div className="flex flex-row items-center gap-sm">
                <Avatar
                  src={discussion.author?.avatar_url}
                  name={discussion.author?.display_name ?? "?"}
                  size={40}
                />
                <div className="flex flex-col">
                  <p className="text-body-lg">
                    {discussion.author?.display_name}
                  </p>
                  {discussion.author?.is_pro && (
                    <DiplomaProBadge className="text-on-primary-fixed-variant font-bold" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <p className="text-body-lg">Posted</p>
                <div className="flex flex-row items-center gap-sm">
                  <Calendar className="text-on-surface-variant" />
                  <p className="text-on-surface-variant text-label-md">
                    {finalTime}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <p className="text-body-lg">Likes</p>
                <p className="text-label-md text-on-surface-variant">
                  {final_like}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-lg mt-md">
              <p className="text-on-surface-variant text-body-lg">
                {discussion.content}
              </p>
              <div className="ml-auto text-primary flex flex-row flex-wrap">
                <LikeButton
                  target={{ discussion_id: discussion.id }}
                  initiallyLiked={discussion.isLiked ?? false}
                  initialCount={discussion.like_count}
                  path={`/community/${discussion.id}`}
                  size={30}
                  className="text-on-surface-variant transition hover:text-[#f50707] hover:bg-surface-container p-sm rounded-xl cursor-pointer hover:border-outline-variant border-white border-b-1 flex flex-row items-center"
                  activeColor="#f50707"
                />
                <div className="ml-auto text-on-surface-variant rounded-xl flex flex-row  items-center">
                  <SaveButton
                    target={{ discussion_id: discussion.id }}
                    initiallySaved={discussion.isSaved ?? false}
                    path={`/community/${discussion.id}`}
                    size={36}
                    className="rounded-xl text-display-lg transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
                  />
                  <ShareButton
                    size={46}
                    className="rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
                  />
                  {isOwner && (
                    <Link href={`/community/${discussion.id}/edit`}>
                      <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer">
                        <Pencil size={30} />
                      </div>
                    </Link>
                  )}
                  {isOwner && (
                    <DeleteDiscussionButton discussionId={discussion.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
          <Comments
            kind="reply"
            target={{ discussion_id: discussion.id }}
            initialItems={replies}
            path={`/community/${discussion.id}`}
            isLoggedIn={!!currentUser}
            currentUserId={currentUser?.id ?? null}
          />
        </div>
        <div className="lg:basis-1/3 flex flex-col gap-margin">
          <div className="h-65 w-full bg-surface-container-lowest p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h2 className="text-body-lg uppercase text-primary">
              About the Author
            </h2>
            <div className="flex flex-row items-center gap-md">
              <Avatar
                src={discussion.author?.avatar_url}
                name={discussion.author?.display_name ?? "?"}
                size={50}
              />
              <div className="flex flex-col">
                <p className="text-headline-lg font-serif">
                  {discussion.author?.display_name}
                </p>
                {discussion.author?.is_pro && (
                  <DiplomaProBadge className="text-body-md text-primary" />
                )}
              </div>
            </div>
            <p className="text-body-md text-on-surface-variant">
              {discussion.author?.display_name} has contributed to the IBPeople
              community.
            </p>
            <Link href={`/profile/${discussion.author_id}`}>
              <button className="bg-surface-variant-lowest text-primary border-1 border-primary py-sm hover:bg-surface-container cursor-pointer w-full">
                View Full Profile
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceDetail } from "@/app/lib/actions/resources";
import { getComments } from "@/app/lib/actions/comments";
import { getCurrentUser } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";
import {
  ChevronRight,
  Calendar,
  FileText,
  BadgeCheck,
  Pencil,
} from "lucide-react";
import Comments from "@/components/detailed-articles/comments";
import { SubjectTags, ResourceTypeTag } from "@/components/pills";
import { DownloadButton } from "@/components/resources/DownloadButton";
import { DeleteResourceButton } from "@/components/resources/DeleteResourceButton";
import { LikeButton } from "@/components/likeButton";
import { SaveButton } from "@/components/saveButton";
import { ShareButton } from "@/components/shareButton";
import { Avatar } from "@/components/avatar";

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

export default async function resourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [result, currentUser] = await Promise.all([
    getResourceDetail(slug),
    getCurrentUser(),
  ]);

  if (!result.success) {
    notFound();
  }
  const resource = result.data;

  const commentsResult = await getComments({ resource_id: resource.id });
  const comments = commentsResult.success ? commentsResult.data : [];

  const isOwner =
    currentUser?.id === resource.author_id || isAdmin(currentUser?.id);

  const createdAt = new Date(resource.created_at);
  const month = months[createdAt.getMonth()];
  const final =
    month + " " + createdAt.getDate() + ", " + createdAt.getFullYear();
  const final_view =
    resource.download_count >= 1000
      ? (() => {
          const shortened = resource.download_count / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : resource.download_count;
  const final_like =
    resource.like_count >= 1000
      ? (() => {
          const shortened = resource.like_count / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : resource.like_count;
  const isExternalLink = resource.type_tag === "External Link";
  const fileExtension = !isExternalLink
    ? resource.file_url?.split("?")[0].split(".").pop()?.toUpperCase()
    : undefined;
  const linkHostname = (() => {
    if (!isExternalLink || !resource.file_url) return null;
    try {
      return new URL(resource.file_url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  return (
    <div className="flex flex-col px-md md:px-10 xl:px-50 py-10  gap-gutter bg-surface-container-low">
      <div className="flex flex-row gap-sm items-center">
        <Link href={"/resources"}>
          <h1 className={`text-on-surface-variant text-headline-md uppercase`}>
            Resources
          </h1>
        </Link>
        <ChevronRight />
        <h1 className={`text-secondary text-headline-md uppercase`}>
          {resource.subject_tag}
        </h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-margin">
        <div className="flex flex-col bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant lg:basis-2/3 gap-lg">
          <div className="flex flex-row justify-between">
            <div>
              {SubjectTags[resource.subject_tag]}{" "}
              {ResourceTypeTag[resource.type_tag]}
            </div>{" "}
            <FileText size={30} />{" "}
          </div>

          <h1 className={`font-serif text-display-lg font-bold`}>
            {resource.title}
          </h1>

          <div className="border-b-1 border-outline-variant flex flex-row flex-wrap gap-y-md pb-md gap-20">
            <div className="flex flex-row items-center gap-sm">
              <Avatar
                src={resource.author.avatar_url}
                name={resource.author.display_name}
                size={40}
              />
              <div className="flex flex-col">
                <h1 className="text-body-lg">{resource.author.display_name}</h1>
                <h1 className="text-label-md text-on-surface-variant">
                  {resource.author.ib_year}
                </h1>
              </div>
            </div>
            <div className="flex flex-col gap-sm">
              <h1 className="text-body-lg">Uploaded</h1>
              <div className="flex flex-row items-center gap-sm">
                <Calendar />
                <h1>{final}</h1>
              </div>
            </div>
            <div className="flex flex-col gap-sm">
              <h1 className="text-body-lg">Downloads</h1>
              <h1 className="text-label-md text-on-surface-variant">
                {final_view}
              </h1>
            </div>
            <div className="flex flex-col gap-sm">
              <h1 className="text-body-lg">Likes</h1>
              <h1 className="text-label-md text-on-surface-variant">
                {final_like}
              </h1>
            </div>
          </div>
          <div className="pb-10 border-b-1 border-outline-variant flex flex-col gap-lg mt-md">
            <h1 className="font-serif text-headline-lg font-bold">Abstract</h1>
            <h1 className="text-on-surface-variant text-body-lg">
              {resource.description}
            </h1>
            <div className="flex flex-row flex-wrap p-margin rounded-xl bg-surface-container-low border-1 border-outline-variant gap-lg">
              <FileText size={100} />
              <div className="flex flex-col gap-lg self-start">
                <div className="flex flex-col">
                  <h1 className="font-bold">
                    {isExternalLink
                      ? (linkHostname ?? "External Link")
                      : `Resource ${fileExtension ?? "File"}`}
                  </h1>
                </div>
                <div className="ml-auto text-primary flex flex-row flex-wrap items-center">
                  <DownloadButton
                    resourceId={resource.id}
                    fileName={resource.title}
                    isExternalLink={isExternalLink}
                  />
                  <LikeButton
                    target={{ resource_id: resource.id }}
                    initiallyLiked={resource.isLiked ?? false}
                    initialCount={resource.like_count}
                    path={`/resources/${resource.id}`}
                    size={30}
                    className="text-on-surface-variant transition hover:text-[#f50707] hover:bg-surface-container p-sm rounded-xl cursor-pointer hover:border-outline-variant border-white border-b-1 flex flex-row items-center"
                    activeColor="#f50707"
                  />
                  <div className="ml-auto text-on-surface-variant rounded-xl flex flex-row  items-center ">
                    <SaveButton
                      target={{ resource_id: resource.id }}
                      initiallySaved={resource.isSaved ?? false}
                      path={`/resources/${resource.id}`}
                      size={36}
                      className="rounded-xl text-display-lg transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
                    />
                    <ShareButton
                      size={46}
                      className="rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
                    />
                  </div>
                  {isOwner && (
                    <Link href={`/resources/${resource.id}/edit`}>
                      <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl cursor-pointer">
                        <Pencil size={30} />
                      </div>
                    </Link>
                  )}
                  {isOwner && <DeleteResourceButton resourceId={resource.id} />}
                </div>
              </div>
            </div>
          </div>

          <Comments
            kind="comment"
            target={{ resource_id: resource.id }}
            initialItems={comments}
            path={`/resources/${resource.id}`}
            isLoggedIn={!!currentUser}
            currentUserId={currentUser?.id ?? null}
          />
        </div>

        <div className="lg:basis-1/3 flex flex-col gap-margin">
          <div className="h-65 w-full bg-surface-container-lowest p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="text-body-lg uppercase text-primary">
              About the Author
            </h1>
            <div className="flex flex-row items-center gap-md">
              <Avatar
                src={resource.author.avatar_url}
                name={resource.author.display_name}
                size={50}
              />
              <div className="flex flex-col">
                <h1 className="text-headline-lg font-serif">
                  {resource.author.display_name}
                </h1>
                <h1 className="text-body-md text-primary">
                  {resource.author.ib_year}
                </h1>
              </div>
            </div>
            <h1 className="text-body-md text-on-surface-variant">
              {resource.author.display_name} has contributed resources to the
              IBPeople community.
            </h1>
            <button className="bg-surface-variant-lowest text-primary border-1 border-primary py-sm hover:bg-surface-container cursor-pointer">
              View Full Profile
            </button>
          </div>

          <div className="h-60 w-full bg-on-primary-fixed p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="font-serif text-headline-md text-surface-container">
              Community Trust
            </h1>
            <div className="flex flex-row justify-between">
              <h1 className="text-body-lg text-on-primary border-b-1 pb-5 border-outline-variant">
                Obtained from author activity and user engagement.
              </h1>
              <BadgeCheck className="text-secondary-container" size={50} />
            </div>
            <h1 className="text-display-lg mt-1 text-on-primary self-center">
              {resource.community_trust}%
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

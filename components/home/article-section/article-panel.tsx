import { Download, FileText, Target } from "lucide-react";
import type { Resource } from "@/app/lib/types";
import { SubjectTags, ResourceTypeTag } from "@/components/pills";
import { DownloadButton } from "@/components/resources/DownloadButton";
import { LikeButton } from "@/components/likeButton";
import { SaveButton } from "@/components/saveButton";
import { Avatar } from "@/components/avatar";
import Link from "next/link";

type Props = {
  resource: Resource;
};

export default function Panel({ resource }: Props) {
  let final_download;
  if (resource.download_count >= 1000) {
    const shortened = resource.download_count / 1000;
    final_download = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
  } else {
    final_download = resource.download_count;
  }
  return (
    <div className="group flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden min-h-100 hover:border-primary hover:drop-shadow-xl/25 transition p-lg">
      <div className="flex flex-col justify-between flex-1 gap-lg w-full">
        <Link href={`/resources/${resource.id}`}>
          <div className="flex flex-col flex-1 gap-lg">
            <div className="flex flex-row justify-between">
              <FileText size={30} />{" "}
              <div className="flex flex-row flex-wrap gap-sm">
                {SubjectTags[resource.subject_tag]}{" "}
                {ResourceTypeTag[resource.type_tag]}
              </div>
            </div>
            <div className="gap-md flex flex-col">
              <div>
                <h1 className="text-headline-md font-serif font-bold transition duration-200 group-hover:text-primary h-20">
                  {resource.title}
                </h1>
              </div>
              <div>
                <h1 className="text-on-surface-variant text-body-sm line-clamp-2">
                  {resource.description}
                </h1>
              </div>
            </div>
            <div className="flex flex-row gap-md">
              <div className="flex flex-row items-center gap-md">
                <Avatar
                  src={resource.author.avatar_url}
                  name={resource.author.display_name}
                  size={60}
                />
                <div className="flex flex-col">
                  <h1 className="text-body-md font-bold">
                    {resource.author.display_name}
                  </h1>
                  <div className="flex flex-row gap-sm items-center">
                    <h1 className="text-on-surface-variant text-label-md">
                      {resource.author.ib_year}
                    </h1>{" "}
                    <h1 className="text-on-primary-fixed-variant font-bold">
                      {resource.author.is_pro ? "Diploma Pro" : ""}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
        <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row flex-wrap gap-y-sm">
          <div className="flex flex-row items-center">
            <LikeButton
              target={{ resource_id: resource.id }}
              initiallyLiked={resource.isLiked ?? false}
              initialCount={resource.like_count}
              path="/resources"
              className="flex flex-row items-center hover:text-[#f50707] cursor-pointer"
              activeColor="#f50707"
            />
            <Download />
            <h1 className="text-on-surface-variant text-body-lg ml-sm">
              {final_download}
            </h1>
          </div>
          <div className="ml-auto text-primary flex flex-row items-center">
            <SaveButton
              target={{ resource_id: resource.id }}
              initiallySaved={resource.isSaved ?? false}
              path="/resources"
            />
            <DownloadButton
              resourceId={resource.id}
              fileName={resource.title}
              isExternalLink={resource.type_tag === "External Link"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Heart, Download, FileText, Users, Target } from "lucide-react";
import type { Resource } from "@/app/lib/types";
import { SubjectTags, ResourceTypeTag } from "@/components/pills";
import { DownloadButton } from "@/components/resources/DownloadButton";
import Link from "next/link";

type Props = {
  resource: Resource;
};

export default function Panel({ resource }: Props) {
  let final_download;
  let final_like;
  if (resource.download_count >= 1000) {
    const shortened = resource.download_count / 1000;
    final_download = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
  } else {
    final_download = resource.download_count;
  }
  if (resource.like_count >= 1000) {
    const shortened = resource.like_count / 1000;
    final_like = `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
  } else {
    final_like = resource.like_count;
  }
  return (
    <div className="group flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden h-100 hover:border-primary hover:drop-shadow-xl/25 transition p-lg">
      <div className="flex flex-col justify-between flex-1 gap-lg">
        <Link href={`/resources/${resource.id}`}>
          <div className="flex flex-col flex-1 gap-lg">
            <div className="flex flex-row justify-between">
              <FileText size={30} />{" "}
              <div>
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
                <div className="border-1 border-outline-variant rounded-[50%] h-15 w-15 items-center justify-items-center pt-2">
                  <Users size={40} />
                </div>
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
        <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
          <div className="flex flex-row items-center">
            <Heart className="hover:text-[#f50707] cursor-pointer" />
            <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">
              {final_like}
            </h1>
            <Download />
            <h1 className="text-on-surface-variant text-body-lg ml-sm">
              {final_download}
            </h1>
          </div>
          <div className="ml-auto text-primary">
            <Link
              href={"/resources/IB-Command-Terms-Cheat-Sheet.pdf"}
              target="_blank"
              download
            >
              <DownloadButton resourceId={resource.id} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

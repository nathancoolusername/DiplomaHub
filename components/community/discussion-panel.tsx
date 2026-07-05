import { Discussion } from "../data";
import { Users, Heart, MessageSquare, Bookmark } from "lucide-react";
import { TitleTag } from "../pills";

type Props = {
  discussion: Discussion;
};

export const typeTags: Tags = {
  Discussion:
    "px-md h-9 rounded-3xl py-1 bg-surface-container-high text-on-surface-variant items-center",
  Resource:
    "px-md h-9 rounded-3xl py-1 bg-secondary-container text-on-secondary-container items-center",
  Question:
    "px-md h-9 rounded-3xl py-1 bg-tertiary-container text-on-tertiary-container items-center",
};

type Tags = {
  [key: string]: string;
};

export default function Panel({ discussion }: Props) {
  let finalTime;
  let difference;
  const today = new Date();
  const last_I = today.toISOString().lastIndexOf("-");
  if (
    today.toISOString().split("T")[0] ==
    discussion.created_at.toISOString().split("T")[0]
  ) {
    finalTime = `${today.getHours() - discussion.created_at.getHours()}h`;
  } else if (
    today.toISOString().slice(0, last_I) ==
    discussion.created_at.toISOString().slice(0, last_I)
  ) {
    difference = today.getDate() - discussion.created_at.getDate() === 1;
    finalTime = `${today.getDate() - discussion.created_at.getDate()} ${difference ? "day" : "days"}`;
  } else if (
    today.toISOString().split("-")[0] ==
    discussion.created_at.toISOString().split("-")[0]
  ) {
    difference = today.getMonth() - discussion.created_at.getMonth() === 1;
    finalTime = `${today.getMonth() - discussion.created_at.getMonth()} ${difference ? "month" : "months"}`;
  } else {
    difference =
      today.getFullYear() - discussion.created_at.getFullYear() === 1;
    finalTime = `${today.getFullYear() - discussion.created_at.getFullYear()} ${difference ? "year" : "years"}`;
  }

  return (
    <div className="cursor-pointer hover:drop-shadow-xl/10 transition flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-md rounded-md gap-lg">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center gap-md">
          <div className="border-1 border-outline-variant rounded-[50%] h-15 w-15 items-center justify-items-center pt-2">
            <Users size={40} />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row gap-sm items-center">
              <h1 className="text-body-md font-bold">
                {discussion.author.name}
              </h1>{" "}
              <div className="flex flex-row gap-sm">
                {TitleTag[discussion.author.title]}
                <h1 className="text-on-primary-fixed-variant font-bold">
                  {discussion.author.is_pro ? "Diploma Pro" : ""}
                </h1>
              </div>
            </div>
            <div className="flex flex-row gap-sm items-center">
              <h1 className="text-on-surface-variant text-label-md">
                Posted {finalTime} ago in{" "}
              </h1>{" "}
              <h1 className="text-on-primary-fixed-variant">
                {discussion.subject_tag}
              </h1>
            </div>
          </div>
        </div>
        <h1 className={typeTags[discussion.type_tag]}>{discussion.type_tag}</h1>
      </div>

      <div>
        <h1 className="text-headline-md font-serif">{discussion.title}</h1>
      </div>

      <h1 className="text-on-surface-variant text-body-lg">
        {discussion.content}
      </h1>

      <div className="flex flex-row gap-md bg-surface-container-low py-md px-sm rounded-xl items-center">
        <div className="border-1 border-outline-variant rounded-[50%] h-8 w-8 items-center justify-items-center pt-1 bg-secondary-container">
          <h1>NP</h1>
        </div>
        <h1 className="italic text-on-surface-variant text-body-sm">
          "Had the exact same problem, please help🙏🙏"
        </h1>
        <h1 className="text-primary text-body-sm font-bold">- Nathan P.</h1>
      </div>

      <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
        <div className="flex flex-row items-center">
          <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl">
            <Heart />
          </div>
          <h1 className="text-on-surface-variant text-body-lg ml-sm mr-md">
            {discussion.like_count}
          </h1>
          <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl">
            <MessageSquare />
          </div>
          <h1 className="text-on-surface-variant text-body-lg ml-sm">
            {discussion.reply_count}
          </h1>
        </div>
        <div className="ml-auto text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl">
          <Bookmark />
        </div>
      </div>
    </div>
  );
}

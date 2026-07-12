"use client";
import Link from "next/link";
import FilterDropdown from "./drop-down";
import { useState } from "react";
import { TrendingUp, Dot, SquarePen, ChevronLeft, ChevronRight } from "lucide-react";
import type { Discussion } from "@/app/lib/types";
import Panel, { typeTags } from "./discussion-panel";
import { SubjectTags, YEAR_OPTIONS } from "../pills";

const optionsSubject = ["All Subjects", ...Object.keys(SubjectTags)];
const opttionsType = ["All Types", ...Object.keys(typeTags)];
const optionsYear = ["Any Year", ...YEAR_OPTIONS];

type Props = {
  data: Discussion[];
};

export default function CommunityPage({ data }: Props) {
  const [selectedS, setSelectedS] = useState(optionsSubject[0]);
  const [selectedT, setSelectedT] = useState(opttionsType[0]);
  const [selectedY, setSelectedY] = useState(optionsYear[0]);
  const [order, setOrder] = useState("Newest");
  const [num, setNum] = useState("1");
  const handleClickS = (selectedS: string) => {
    setSelectedS(selectedS);
    setNum("1");
  };
  const handleClickT = (selectedS: string) => {
    setSelectedT(selectedS);
    setNum("1");
  };
  const handleClickY = (selectedS: string) => {
    setSelectedY(selectedS);
    setNum("1");
  };
  const newest = order == "Newest";
  const Hot = order == "Hot";

  function hotScore(discussion: Discussion) {
    const hours =
      (new Date().getTime() - new Date(discussion.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    return discussion.like_count + discussion.reply_count / Math.pow(hours + 2, 1.5);
  }

  const trending = [...data].sort((a, b) => hotScore(b) - hotScore(a));
  const actual = trending.filter((discussion) => discussion.type_tag != "Resource");
  const essential = trending.find((discussion) => discussion.type_tag == "Resource");

  const filteredS = data.filter((discussion) => {
    if (selectedS == optionsSubject[0]) return true;
    return discussion.subject_tag === selectedS;
  });
  const filteredT = filteredS.filter((discussion) => {
    if (selectedT == opttionsType[0]) return true;
    return discussion.type_tag === selectedT;
  });
  const filteredY = filteredT.filter((discussion) => {
    if (selectedY == optionsYear[0]) return true;
    return discussion.year_tag === selectedY;
  });

  const filtered = newest
    ? [...filteredY].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [...filteredY].sort((a, b) => hotScore(b) - hotScore(a));

  const currentItems = filtered.slice((+num - 1) * 6, +num * 6);
  const numButtons = Math.ceil(filtered.length / 6);
  const buttons: React.ReactNode[] = [];
  for (let i = 1; i <= numButtons; i++) {
    const isActive = +num === i;
    const showPage = i <= 3 || i === numButtons || Math.abs(i - +num) <= 1;

    if (showPage) {
      buttons.push(
        <button
          onClick={() => setNum(`${i}`)}
          className={`border-1 border-outline-variant h-10 w-9 items-center rounded cursor-pointer ${isActive ? "bg-primary text-on-primary" : "hover:bg-surface-container-high transition"}`}
          key={i}
        >
          {i}
        </button>,
      );
    } else if (
      (i === 4 && +num > 4) ||
      (i === numButtons - 1 && Math.abs(i - +num) > 1)
    ) {
      buttons.push(<h1 key={`ellipsis-${i}`}>...</h1>);
    }
  }

  return (
    <div className="bg-surface-container-low flex flex-row py-margin px-md md:px-10 xl:px-30">
      <div className="flex flex-col gap-margin basis-2/3">
        <div className="flex-col flex w-full">
          <h1 className="font-serif text-headline-md">Filter Discussions</h1>
          <div className="flex flex-row mt-margin gap-margin">
            <div className="flex flex-col gap-sm basis-2/7">
              <h1 className="text-on-surface-variant text-body-md">
                Subject
              </h1>
              <FilterDropdown
                options={optionsSubject}
                selected={selectedS}
                handleClick={handleClickS}
              />
            </div>
            <div className="flex flex-col gap-sm basis-2/7">
              <h1 className="text-on-surface-variant text-body-md">Type</h1>
              <FilterDropdown
                options={opttionsType}
                selected={selectedT}
                handleClick={handleClickT}
              />
            </div>
            <div className="flex flex-col gap-sm basis-2/7">
              <h1 className="text-on-surface-variant text-body-md">Year</h1>
              <FilterDropdown
                options={optionsYear}
                selected={selectedY}
                handleClick={handleClickY}
              />
            </div>
            <button
              className="self-end cursor-pointer"
              onClick={() => {
                setSelectedS(optionsSubject[0]);
                setSelectedT(opttionsType[0]);
                setSelectedY(optionsYear[0]);
                setNum("1");
              }}
            >
              <div className="bg-on-primary-fixed-variant items-center flex justify-center h-10 w-20 self-end rounded-xl  hover:drop-shadow-xl/10">
                <h1 className="text-on-primary text-body-md">Clear</h1>
              </div>
            </button>
          </div>
        </div>

        {(actual.length > 0 || essential) && (
          <div className="flex flex-col">
            <div className="flex flex-row gap-sm items-center">
              <TrendingUp className="text-on-primary-fixed-variant" />
              <h1 className="font-serif text-headline-md">
                Trending This Week
              </h1>
            </div>
            <div className="flex flex-row mt-margin gap-lg">
              {actual.length > 0 && (
                <Link
                  href={`/community/${actual[0].id}`}
                  className="flex flex-col bg-surface-container-high px-md py-lg rounded-xl basis-1/2 gap-sm border-1 border-outline-variant cursor-pointer transition hover:border-on-primary-fixed-variant"
                >
                  <div className="px-sm bg-on-primary-fixed-variant text-on-primary text-label-md font-semibold w-30 rounded-sm justify-center">
                    <h1>MOST ACTIVE</h1>
                  </div>
                  <h1 className="text-headline-md font-serif">
                    {actual[0].title}
                  </h1>
                  <div className="flex flex-row gap-sm text-on-surface-variant text-label-md items-center">
                    <h1>{actual[0].like_count} likes</h1>
                    <Dot />
                    <h1>{`${actual[0].reply_count} replies`}</h1>
                  </div>
                </Link>
              )}
              {essential && (
                <Link
                  href={`/community/${essential.id}`}
                  className="flex flex-col bg-surface-container-high px-md py-lg rounded-xl basis-1/2 gap-sm border-1 border-outline-variant cursor-pointer transition hover:border-secondary"
                >
                  <div className="px-sm bg-secondary text-on-primary text-label-md font-semibold w-23 rounded-sm justify-center">
                    <h1>ESSENTIAL</h1>
                  </div>
                  <h1 className="text-headline-md font-serif">
                    {essential.title}
                  </h1>
                  <div className="flex flex-row gap-sm text-on-surface-variant text-label-md items-center">
                    <h1>{essential.like_count} likes</h1>
                    <Dot />
                    <h1>{essential.reply_count} replies</h1>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex flex-row justify-between border-b-1 border-outline-variant pb-md">
            <h1 className="font-serif text-headline-md">All Discussions</h1>
            <div className="flex flex-row gap-sm">
              <button
                onClick={() => {
                  setOrder("Newest");
                  setNum("1");
                }}
              >
                <h1
                  className={`px-md rounded-3xl py-1 transition cursor-pointer ${newest ? "bg-surface-container-high text-on-primary-fixed-variant font-bold" : "text-on-surface-variant"}`}
                >
                  Newest
                </h1>
              </button>
              <button
                onClick={() => {
                  setOrder("Hot");
                  setNum("1");
                }}
              >
                <h1
                  className={`px-md rounded-3xl py-1 transition cursor-pointer ${Hot ? "bg-surface-container-high text-on-primary-fixed-variant font-bold" : "text-on-surface-variant"}`}
                >
                  Hot
                </h1>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-margin">
          {currentItems.map((discussion) => (
            <div key={discussion.id}>
              <Panel discussion={discussion} />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-on-surface-variant text-body-md">
              No discussions match these filters yet.
            </p>
          )}
        </div>

        {numButtons > 1 && (
          <div className="flex flex-row gap-sm items-center justify-content-center place-content-center">
            <button
              onClick={() => {
                if (+num !== 1) setNum(`${+num - 1}`);
              }}
            >
              <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
                <ChevronLeft />
              </div>
            </button>
            {buttons.map((button) => button)}
            <button
              onClick={() => {
                if (+num < numButtons) setNum(`${+num + 1}`);
              }}
            >
              <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
                <ChevronRight />
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="basis-1/3 flex flex-col ml-margin gap-margin">
        <div className="h-60 w-full bg-surface-container-lowest place-content-center justify-center items-center p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-lg">
          <h1 className="font-serif text-headline-md">Your Status</h1>
          <h1 className="flex text-primary-container p-md bg-surface-container-low font-serif text-headline-md rounded-full items-center justify-center border-surface-container-highest border-1 hover:border-primary cursor-pointer transition">
            Login to see your status
          </h1>
        </div>

        <Link href={"/community/write"}>
          <div className="h-60 w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="font-serif text-headline-md">Have a question?</h1>
            <h1 className="text-on-surface-variant text-body-lg">
              Get Help with your IAs, EE, or subject doubts from the
              community.
            </h1>
            <div className="bg-on-primary-fixed-variant w-full h-12 rounded-xl flex flex-row gap-md items-center justify-center mt-sm cursor-pointer hover:drop-shadow-xl/10">
              <SquarePen size={25} className="text-on-primary" />
              <h1 className="text-on-primary font-semibold text-body-lg">
                Start a Discussion
              </h1>
            </div>
          </div>
        </Link>

        <div className="h-60 w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
          <h1 className="font-serif text-headline-md">Top Contributors</h1>
          <div className="bg-surface-container-low w-full h-24 rounded-xl flex items-center justify-center">
            <h1 className="font-semibold text-headline-md font-serif text-on-primary-fixed">
              Coming Soon...
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

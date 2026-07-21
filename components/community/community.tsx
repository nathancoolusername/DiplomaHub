"use client";
import Link from "next/link";
import Image from "next/image";
import FilterDropdown from "./drop-down";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  Dot,
  SquarePen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Discussion, UserProfile } from "@/app/lib/types";
import type { TopContributor } from "@/app/lib/actions/profile";
import {
  getDiscussionsPage,
  type DiscussionSort,
} from "@/app/lib/actions/discussions";
import Panel, { typeTags } from "./discussion-panel";
import { SubjectTags, YEAR_OPTIONS } from "../pills";
import { initialsFor } from "@/app/lib/initials";

const optionsSubject = ["All Subjects", ...Object.keys(SubjectTags)];
const opttionsType = ["All Types", ...Object.keys(typeTags)];
const optionsYear = ["Any Year", ...YEAR_OPTIONS];
const PAGE_SIZE = 6;
const SORT_MAP: Record<string, DiscussionSort> = {
  Newest: "newest",
  Hot: "hot",
};

const DIPLOMA_PRO_THRESHOLD = 1000;

type Props = {
  initialItems: Discussion[];
  initialTotalCount: number;
  trending: Discussion[];
  currentUserProfile: UserProfile | null;
  topContributors: TopContributor[];
};

export default function CommunityPage({
  initialItems,
  initialTotalCount,
  trending,
  currentUserProfile,
  topContributors,
}: Props) {
  const [selectedS, setSelectedS] = useState(optionsSubject[0]);
  const [selectedT, setSelectedT] = useState(opttionsType[0]);
  const [selectedY, setSelectedY] = useState(optionsYear[0]);
  const [order, setOrder] = useState("Newest");
  const [num, setNum] = useState(1);

  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  const handleClickS = (selectedS: string) => {
    setSelectedS(selectedS);
    setNum(1);
  };
  const handleClickT = (selectedS: string) => {
    setSelectedT(selectedS);
    setNum(1);
  };
  const handleClickY = (selectedS: string) => {
    setSelectedY(selectedS);
    setNum(1);
  };
  const newest = order == "Newest";
  const Hot = order == "Hot";

  // "Trending This Week" looks at the top hot discussions board-wide,
  // independent of whatever filters/sort/page the main list below is on.
  const actual = trending.filter(
    (discussion) => discussion.type_tag != "Resource",
  );
  const essential = trending.find(
    (discussion) => discussion.type_tag == "Resource",
  );

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;

    async function fetchPage() {
      setLoading(true);
      const result = await getDiscussionsPage({
        subject: selectedS === optionsSubject[0] ? undefined : selectedS,
        type: selectedT === opttionsType[0] ? undefined : selectedT,
        year: selectedY === optionsYear[0] ? undefined : selectedY,
        sort: SORT_MAP[order],
        page: num,
        pageSize: PAGE_SIZE,
      });
      if (cancelled) return;
      if (result.success) {
        setItems(result.data.items);
        setTotalCount(result.data.totalCount);
      }
      setLoading(false);
    }

    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [selectedS, selectedT, selectedY, order, num]);

  const numButtons = Math.ceil(totalCount / PAGE_SIZE);
  const buttons: React.ReactNode[] = [];
  for (let i = 1; i <= numButtons; i++) {
    const isActive = num === i;
    const showPage = i <= 3 || i === numButtons || Math.abs(i - num) <= 1;

    if (showPage) {
      buttons.push(
        <button
          onClick={() => setNum(i)}
          className={`border-1 border-outline-variant h-10 w-9 items-center rounded cursor-pointer ${isActive ? "bg-primary text-on-primary" : "hover:bg-surface-container-high transition"}`}
          key={i}
        >
          {i}
        </button>,
      );
    } else if (
      (i === 4 && num > 4) ||
      (i === numButtons - 1 && Math.abs(i - num) > 1)
    ) {
      buttons.push(<h1 key={`ellipsis-${i}`}>...</h1>);
    }
  }

  return (
    <div className="bg-surface-container-low flex flex-col lg:flex-row py-margin px-md md:px-10 xl:px-30">
      <div className="flex flex-col gap-margin lg:basis-2/3">
        <div className="flex-col flex w-full">
          <h1 className="font-serif text-headline-md">Filter Discussions</h1>
          <div className="flex flex-col sm:flex-row mt-margin gap-margin">
            <div className="flex flex-col gap-sm sm:basis-2/7">
              <h1 className="text-on-surface-variant text-body-md">Subject</h1>
              <FilterDropdown
                options={optionsSubject}
                selected={selectedS}
                handleClick={handleClickS}
              />
            </div>
            <div className="flex flex-col gap-sm sm:basis-2/7">
              <h1 className="text-on-surface-variant text-body-md">Type</h1>
              <FilterDropdown
                options={opttionsType}
                selected={selectedT}
                handleClick={handleClickT}
              />
            </div>
            <div className="flex flex-col gap-sm sm:basis-2/7">
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
                setNum(1);
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
            <div className="flex flex-col sm:flex-row mt-margin gap-lg">
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
                  setNum(1);
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
                  setNum(1);
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

        <div
          className={`flex flex-col gap-margin transition-opacity ${loading ? "opacity-50" : ""}`}
        >
          {items.map((discussion) => (
            <div key={discussion.id}>
              <Panel discussion={discussion} />
            </div>
          ))}
          {!loading && items.length === 0 && (
            <p className="text-on-surface-variant text-body-md">
              No discussions match these filters yet.
            </p>
          )}
        </div>

        {numButtons > 1 && (
          <div className="flex flex-row gap-sm items-center justify-content-center place-content-center">
            <button
              onClick={() => {
                if (num !== 1) setNum(num - 1);
              }}
            >
              <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
                <ChevronLeft />
              </div>
            </button>
            {buttons.map((button) => button)}
            <button
              onClick={() => {
                if (num < numButtons) setNum(num + 1);
              }}
            >
              <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
                <ChevronRight />
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="lg:basis-1/3 flex flex-col mt-margin lg:mt-0 lg:ml-margin gap-margin">
        {currentUserProfile ? (
          <div className="w-full bg-surface-container-lowest p-md border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="font-serif text-headline-md">Your Status</h1>
            <div className="flex flex-row items-center gap-md">
              {currentUserProfile.avatar_url ? (
                <Image
                  src={currentUserProfile.avatar_url}
                  width={56}
                  height={56}
                  alt={currentUserProfile.display_name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-surface-container-low border-1 border-outline-variant flex items-center justify-center text-primary font-bold text-headline-md">
                  {initialsFor(currentUserProfile.display_name)}
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="font-bold text-body-lg">
                  {currentUserProfile.display_name}
                </h1>
                <h1 className="text-on-surface-variant text-label-md">
                  {currentUserProfile.ib_year}
                </h1>
              </div>
            </div>

            {currentUserProfile.is_pro ? (
              <div className="flex flex-row items-center justify-center bg-surface-container-low text-primary rounded-xl py-sm font-bold">
                Diploma Pro
              </div>
            ) : (
              <>
                <div className="flex flex-row justify-between text-label-md text-on-surface-variant">
                  <span>
                    {currentUserProfile.points} / {DIPLOMA_PRO_THRESHOLD} points
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(100, (currentUserProfile.points / DIPLOMA_PRO_THRESHOLD) * 100)}%`,
                    }}
                  />
                </div>
                <h1 className="text-on-surface-variant text-label-md italic">
                  {Math.max(
                    0,
                    DIPLOMA_PRO_THRESHOLD - currentUserProfile.points,
                  )}{" "}
                  points until Diploma Pro
                </h1>
              </>
            )}

            <Link href={`/profile/${currentUserProfile.id}`}>
              <div className="bg-primary text-on-primary rounded-xl py-sm text-center font-semibold cursor-pointer hover:opacity-90 transition">
                View Profile
              </div>
            </Link>
          </div>
        ) : (
          <div className="h-60 w-full bg-surface-container-lowest place-content-center justify-center items-center p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-lg">
            <h1 className="font-serif text-headline-md">Your Status</h1>
            <Link href={"/login"}>
              <h1 className="flex text-primary-container p-md bg-surface-container-low font-serif text-headline-md rounded-full items-center justify-center border-surface-container-highest border-1 hover:border-primary cursor-pointer transition">
                Login to see your status
              </h1>
            </Link>
          </div>
        )}

        <Link href={"/community/write"}>
          <div className="h-60 w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="font-serif text-headline-md">Have a question?</h1>
            <h1 className="text-on-surface-variant text-body-lg">
              Get Help with your IAs, EE, or subject doubts from the community.
            </h1>
            <div className="bg-on-primary-fixed-variant w-full h-12 rounded-xl flex flex-row gap-md items-center justify-center mt-sm cursor-pointer hover:drop-shadow-xl/10">
              <SquarePen size={25} className="text-on-primary" />
              <h1 className="text-on-primary font-semibold text-body-lg">
                Start a Discussion
              </h1>
            </div>
          </div>
        </Link>

        <div className="w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
          <h1 className="font-serif text-headline-md">Top Contributors</h1>
          {topContributors.length === 0 ? (
            <div className="bg-surface-container-low w-full h-24 rounded-xl flex items-center justify-center">
              <h1 className="font-semibold text-headline-md font-serif text-on-primary-fixed">
                No contributors yet
              </h1>
            </div>
          ) : (
            <div className="flex flex-col gap-md">
              {topContributors.map((contributor, i) => (
                <div
                  key={contributor.id}
                  className="flex flex-row items-center gap-md"
                >
                  <h1 className="text-primary font-bold w-6">{i + 1}</h1>
                  {contributor.avatar_url ? (
                    <Image
                      src={contributor.avatar_url}
                      width={36}
                      height={36}
                      alt={contributor.display_name}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-surface-container-low flex items-center justify-center text-primary font-bold text-label-md">
                      {initialsFor(contributor.display_name)}
                    </div>
                  )}
                  <div className="flex flex-col flex-1">
                    <h1 className="font-bold text-body-md">
                      {contributor.display_name}
                    </h1>
                    <h1 className="text-on-surface-variant text-label-sm">
                      {contributor.points.toLocaleString()} XP
                    </h1>
                  </div>
                  {contributor.is_pro && (
                    <span className="text-label-lg bg-primary-container text-on-primary px-sm py-1 rounded-md font-semibold">
                      Diploma Pro
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

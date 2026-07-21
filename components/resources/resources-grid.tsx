"use client";
import { useEffect, useRef, useState } from "react";
import SortDropdown from "../articles/drop-down";
import Panel from "../home/article-section/article-panel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Resource } from "@/app/lib/types";
import {
  getResourcesPage,
  type ResourceSort,
} from "@/app/lib/actions/resources";
import { SubjectTags, ActiveSubjectTags, ResourceTypeTag, YEAR_OPTIONS } from "../pills";

export type FileType = "PDF" | "DOCX" | "PPTX" | "XLSX" | "Link" | "Other";

type Props = {
  initialItems: Resource[];
  initialTotalCount: number;
};

const PAGE_SIZE = 6;

const options = ["Newest", "Oldest", "Most Liked", "Most Downloaded"];
const SORT_MAP: Record<string, ResourceSort> = {
  Newest: "newest",
  Oldest: "oldest",
  "Most Liked": "most_liked",
  "Most Downloaded": "most_downloaded",
};
const opttionsType = ["All Types", ...Object.keys(ResourceTypeTag)];
const optionsYear = ["Any Year", ...YEAR_OPTIONS];

export default function ResourceGrid({ initialItems, initialTotalCount }: Props) {
  const [type, setType] = useState("All Types");
  const [year, setYear] = useState("Any Year");
  const [selected, setSelected] = useState("Most Downloaded");
  const [active, setActive] = useState("All");
  const [num, setNum] = useState(1);

  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  const handleClick = (select: string) => {
    setSelected(select);
    setNum(1);
  };
  const handleClickT = (select: string) => {
    setType(select);
    setNum(1);
  };
  const handleClickY = (select: string) => {
    setYear(select);
    setNum(1);
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // Page 1 with default filters was already fetched server-side and
      // passed in as initialItems — skip the redundant duplicate fetch.
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;

    async function fetchPage() {
      setLoading(true);
      const result = await getResourcesPage({
        subject: active === "All" ? undefined : active,
        type: type === opttionsType[0] ? undefined : type,
        year: year === optionsYear[0] ? undefined : year,
        sort: SORT_MAP[selected],
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
  }, [active, type, year, selected, num]);

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
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-lg rounded-xl gap-margin">
        <div className="flex flex-col gap-md">
          <h1>Subject Areas</h1>
          <div className="flex flex-row gap-sm flex-wrap">
            <button
              onClick={() => {
                setActive("All");
                setNum(1);
              }}
              className="cursor-pointer m-1"
            >
              {active == "All" ? (
                <span className="px-md py-sm rounded-xl text-label-md bg-primary text-on-primary font-bold uppercase">
                  All
                </span>
              ) : (
                <span className="px-md py-sm rounded-xl text-label-md bg-surface-container text-primary font-bold uppercase">
                  All
                </span>
              )}
            </button>
            {Object.keys(SubjectTags).map((pill) => {
              const isActive = active === pill;
              return (
                <button
                  onClick={() => {
                    setActive(pill);
                    setNum(1);
                  }}
                  key={pill}
                  className="cursor-pointer my-1"
                >
                  {isActive ? ActiveSubjectTags[pill] : SubjectTags[pill]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-margin w-full">
          <div className="flex flex-col gap-sm sm:basis-1/3">
            <h1 className="text-on-surface-variant">Resource Type</h1>
            <div>
              <SortDropdown
                options={opttionsType}
                selected={type}
                handleClick={handleClickT}
                placeholder="Select Type"
              />
            </div>
          </div>
          <div className="flex flex-col gap-sm sm:basis-1/3">
            <h1 className="text-on-surface-variant">Year</h1>
            <div>
              <SortDropdown
                options={optionsYear}
                selected={year}
                handleClick={handleClickY}
                placeholder="Select Year"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm sm:basis-1/3">
            <h1 className="text-on-surface-variant">Sort by</h1>
            <div>
              <SortDropdown
                options={options}
                selected={selected}
                handleClick={handleClick}
                placeholder="Sort by"
              />
            </div>
          </div>
          <button
            className="self-end cursor-pointer"
            onClick={() => {
              setType(opttionsType[0]);
              setYear(optionsYear[0]);
              setNum(1);
            }}
          >
            <div className="bg-on-primary-fixed-variant items-center flex justify-center h-10 w-20 self-end rounded-xl hover:drop-shadow-xl/10">
              <h1 className="text-on-primary text-body-md">Clear</h1>
            </div>
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        {items.map((resource) => (
          <div key={resource.id}>
            <Panel resource={resource} />
          </div>
        ))}
        {!loading && items.length === 0 && (
          <p className="text-on-surface-variant text-body-md">
            No resources match these filters yet.
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
  );
}

"use client";
import { useState } from "react";
import SortDropdown from "./drop-down";
import Panel from "./article-panel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SubjectTags, ActiveSubjectTags } from "../pills";

type GridArticle = {
  id: string;
  slug: string;
  title: string;
  content: string;
  cover_image_url?: string | null;
  subject_tag: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  author?: {
    display_name?: string;
    is_pro?: boolean;
  };
};

type Props = {
  data: GridArticle[];
};

export default function ArticleGrid({ data }: Props) {
  const options = ["Newest", "Oldest", "Most Liked", "Most Viewed"];
  const [selected, setSelected] = useState("Newest");
  const handleClick = (select: string) => setSelected(select);
  const [active, setActive] = useState("All");
  const [num, setNum] = useState("1");
  const buttons = [];
  const filtered = data.filter((article) => {
    if (active == "All") {
      return true;
    } else {
      return article.subject_tag === active;
    }
  });
  if (selected == "Newest") {
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else if (selected == "Oldest") {
    filtered.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  } else if (selected == "Most Viewed") {
    filtered.sort((a, b) => b.view_count - a.view_count);
  } else if (selected == "Most Liked") {
    filtered.sort((a, b) => b.like_count - a.like_count);
  }
  const currentItems = filtered.slice((+num - 1) * 6, +num * 6);
  let numButtons = Math.ceil(filtered.length / 6);
  for (let i = 1; i < numButtons + 1; i++) {
    const isActive = +num === i;
    if (i < 4) {
      buttons.push(
        <button
          onClick={() => {
            setNum(`${i}`);
          }}
          className={`border-1 border-outline-variant h-10 w-9 items-center rounded  cursor-pointer ${isActive ? `bg-primary text-on-primary` : `hover:bg-surface-container-high transition`}`}
          key={i}
        >
          {i}
        </button>,
      );
    } else if (i == 4) {
      buttons.push(<h1 key={i}>...</h1>);
    } else if (i === 12) {
      buttons.push(
        <button
          onClick={() => {
            setNum(`${i}`);
          }}
          className={`border-1 border-outline-variant h-10 w-9 items-center rounded  cursor-pointer ${isActive ? `bg-primary text-on-primary` : `hover:bg-surface-container-high transition`}`}
          key={i}
        >
          {i}
        </button>,
      );
    }
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-col gap-margin">
        <div className="flex flex-row gap-sm flex-wrap">
          <button
            onClick={() => {
              setActive("All");
              setNum("1");
            }}
            className="cursor-pointer"
          >
            {active == "All" ? (
              <span
                className={`px-md py-sm rounded-xl text-label-md bg-primary text-on-primary font-bold uppercase`}
              >
                All
              </span>
            ) : (
              <span
                className={`px-md py-sm rounded-xl text-label-md bg-surface-container text-primary font-bold uppercase`}
              >
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
                  setNum("1");
                }}
                key={pill}
                className="cursor-pointer my-1"
              >
                {isActive ? ActiveSubjectTags[pill] : SubjectTags[pill]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-row gap-sm items-center">
          <h1 className="text-on-surface-variant">Sort by:</h1>
          <div>
            <SortDropdown
              options={options}
              selected={selected}
              handleClick={handleClick}
              placeholder="Sort by"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {currentItems.map((article) => {
          if (active == "All" || active == article.subject_tag) {
            return (
              <div key={article.id}>
                <Panel article={article}>
                  {article.subject_tag && SubjectTags[article.subject_tag]}
                </Panel>
              </div>
            );
          }
        })}
      </div>
      <div className="flex flex-row gap-sm items-center justify-content-center place-content-center">
        <button
          onClick={() => {
            if (+num !== 1) {
              setNum(`${+num - 1}`);
            }
          }}
        >
          <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
            <ChevronLeft />
          </div>
        </button>
        {buttons.map((button) => button)}
        <button
          onClick={() => {
            if (+num < numButtons) {
              setNum(`${+num + 1}`);
            }
          }}
        >
          <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
            <ChevronRight />
          </div>
        </button>
      </div>
    </div>
  );
}

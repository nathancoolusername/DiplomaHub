"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  getLeaderboardPage,
  type TopContributor,
} from "@/app/lib/actions/profile";
import { Avatar } from "@/components/avatar";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 20;

type Props = {
  initialItems: TopContributor[];
  initialTotalCount: number;
  currentUserId: string | null;
};

export default function LeaderboardList({
  initialItems,
  initialTotalCount,
  currentUserId,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // Page 1 with no search was already fetched server-side and passed
      // in as initialItems — skip the redundant duplicate fetch.
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;

    // See resources-grid.tsx for why this is debounced rather than
    // cancelled via AbortController.
    const timeoutId = setTimeout(() => {
      async function fetchPage() {
        setLoading(true);
        const result = await getLeaderboardPage({
          search: search.trim() || undefined,
          page,
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
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, page]);

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-row items-center gap-sm border-1 border-outline-variant rounded-lg px-3 py-2 bg-surface-container-lowest">
        <Search size={18} className="text-on-surface-variant shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full outline-none text-body-md"
          placeholder="Search by name..."
        />
      </div>

      <div
        className={`flex flex-col bg-surface-container-lowest border-1 border-outline-variant rounded-xl overflow-hidden transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        {items.length === 0 && !loading && (
          <p className="p-lg text-on-surface-variant text-body-md">
            No users match that search.
          </p>
        )}
        {items.map((user, i) => {
          const rank = (page - 1) * PAGE_SIZE + i + 1;
          const isYou = user.id === currentUserId;
          return (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className={`flex flex-row items-center gap-md px-lg py-md border-b-1 border-outline-variant last:border-b-0 hover:bg-surface-container transition ${isYou ? "bg-primary-container/30" : ""}`}
            >
              <span className="text-primary font-bold w-8 shrink-0 text-body-lg">
                {rank}
              </span>
              <Avatar
                src={user.avatar_url}
                name={user.display_name}
                size={44}
                className={isYou ? "ring-2 ring-primary" : ""}
              />
              <div className="flex flex-col flex-1 min-w-0">
                <p className="font-bold text-body-md truncate">
                  {user.display_name}
                  {isYou && (
                    <span className="text-primary font-semibold"> (You)</span>
                  )}
                </p>
                <p className="text-on-surface-variant text-label-sm">
                  {user.points.toLocaleString()} XP
                </p>
              </div>
              {user.is_pro && (
                <span className="text-label-lg bg-primary-container text-on-primary px-sm py-1 rounded-md font-semibold shrink-0">
                  Diploma Pro
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <Pagination
        page={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}

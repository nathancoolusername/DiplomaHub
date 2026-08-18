"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/app/lib/actions/notifications";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/app/lib/relativeTime";

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      const result = await getUnreadNotificationCount();
      if (!cancelled && result.success) setUnreadCount(result.data);
    }

    // A background/inactive tab has no user to notify — polling it every
    // 30s anyway was pure wasted Vercel function invocations that scaled
    // with "tabs left open," not with actual usage. Pausing while hidden
    // and catching up immediately on return keeps active tabs just as
    // fresh while cutting that idle cost entirely.
    function startPolling() {
      if (interval) return;
      poll();
      interval = setInterval(poll, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    }

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setLoading(true);
      const result = await getNotifications();
      if (result.success) setNotifications(result.data);
      setLoading(false);
    }
  }

  async function handleItemClick(n: Notification) {
    setIsOpen(false);
    if (!n.read) {
      setNotifications(
        (prev) =>
          prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev,
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(n.id);
    }
  }

  async function handleMarkAllRead() {
    setNotifications(
      (prev) => prev?.map((x) => ({ ...x, read: true })) ?? prev,
    );
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative p-sm rounded-xl hover:bg-surface-container transition cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 max-h-[70vh] overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md z-20 sm:absolute sm:inset-x-auto sm:left-auto sm:right-0 sm:top-full sm:mt-xs sm:w-80 sm:max-h-100">
          <div className="flex flex-row justify-between items-center px-md py-sm border-b border-outline-variant sticky top-0 bg-surface-container-lowest">
            <h2 className="font-serif font-bold text-body-md">Notifications</h2>
            {notifications && notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-label-sm text-primary font-semibold cursor-pointer hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && (
            <p className="p-md text-on-surface-variant text-body-md">
              Loading...
            </p>
          )}

          {!loading && notifications?.length === 0 && (
            <p className="p-md text-on-surface-variant text-body-md">
              No notifications yet.
            </p>
          )}

          {!loading &&
            notifications?.map((n) => (
              <Link key={n.id} href={n.link}>
                <div
                  onClick={() => handleItemClick(n)}
                  className={`flex flex-row gap-sm items-start px-md py-sm border-b border-outline-variant last:border-b-0 hover:bg-surface-container transition cursor-pointer ${
                    n.read ? "" : "bg-primary-container/20"
                  }`}
                >
                  <Avatar
                    src={n.actor?.avatar_url}
                    name={n.actor?.display_name ?? "DiplomaHub"}
                    size={28}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-label-md break-words">{n.message}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-auto mt-1" />
                  )}
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { History, MessageSquare, SquarePen, Trash2 } from "lucide-react";
import type { BroChatSummary } from "./useBroChat";

function when(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Chats": the student's past chats to reopen (or delete). The current one is marked. */
export function BroChatsMenu({
  chats,
  currentId,
  onOpen,
  onDelete,
  align = "right",
  label = "Chats",
}: {
  chats: BroChatSummary[];
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  align?: "left" | "right";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Esc closes the menu first, not the whole Bro bar.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  if (chats.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
      >
        <History size={14} /> {label}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Your chats with Bro"
          className={`absolute top-full mt-xs z-20 w-72 max-h-80 overflow-y-auto rounded-xl border border-outline-variant bg-surface-raised shadow-xl py-xs ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {chats.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-xs px-sm ${c.id === currentId ? "bg-surface-container" : "hover:bg-surface-container-low"}`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (c.id !== currentId) onOpen(c.id);
                }}
                className="flex-1 min-w-0 text-left py-sm cursor-pointer"
              >
                <span className="block truncate text-body-md text-on-surface">{c.title}</span>
                <span className="block text-label-sm text-on-surface-variant">
                  {c.id === currentId ? "Open now · " : ""}
                  {when(c.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete “${c.title}”? This can't be undone.`)) onDelete(c.id);
                }}
                aria-label={`Delete chat: ${c.title}`}
                className="p-xs text-on-surface-variant opacity-60 hover:opacity-100 hover:text-error cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Past chats as a list inside the Bro bar (its big view), not a dropdown:
 * the most recent ones first, the rest behind "Show all".
 */
export function BroChatList({
  chats,
  currentId,
  onOpen,
  onDelete,
  limit = 8,
}: {
  chats: BroChatSummary[];
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  if (chats.length === 0) {
    return <p className="m-auto text-body-md text-on-surface-variant">No past chats yet.</p>;
  }
  const shown = all ? chats : chats.slice(0, limit);
  return (
    <div className="flex flex-col gap-xs">
      <ul className="flex flex-col gap-xs">
        {shown.map((c) => (
          <li key={c.id}>
            <div
              className={`flex items-center gap-sm rounded-xl border px-md py-sm ${
                c.id === currentId ? "border-primary bg-surface-container" : "border-outline-variant hover:border-primary hover:bg-surface-container-low"
              }`}
            >
              <MessageSquare size={16} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
              <button type="button" onClick={() => onOpen(c.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                <span className="block truncate text-body-md text-on-surface">{c.title}</span>
                <span className="block text-label-sm text-on-surface-variant">
                  {c.id === currentId ? "Current chat · " : ""}
                  {when(c.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete “${c.title}”? This can't be undone.`)) onDelete(c.id);
                }}
                aria-label={`Delete chat: ${c.title}`}
                className="p-xs text-on-surface-variant opacity-60 hover:opacity-100 hover:text-error cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!all && chats.length > limit && (
        <button type="button" onClick={() => setAll(true)} className="self-center text-label-md font-semibold text-primary hover:underline cursor-pointer py-xs">
          Show all {chats.length} chats
        </button>
      )}
    </div>
  );
}

/** Groups chats by how recent they are, like most chat apps. */
function groupChats(chats: BroChatSummary[]): { label: string; chats: BroChatSummary[] }[] {
  const today = new Date().setHours(0, 0, 0, 0);
  const groups = [
    { label: "Today", chats: [] as BroChatSummary[] },
    { label: "Yesterday", chats: [] as BroChatSummary[] },
    { label: "Previous 7 days", chats: [] as BroChatSummary[] },
    { label: "Previous 30 days", chats: [] as BroChatSummary[] },
    { label: "Older", chats: [] as BroChatSummary[] },
  ];
  for (const c of chats) {
    const days = Math.floor((today - new Date(c.updatedAt).setHours(0, 0, 0, 0)) / 86_400_000);
    groups[days <= 0 ? 0 : days === 1 ? 1 : days < 7 ? 2 : days < 30 ? 3 : 4].chats.push(c);
  }
  return groups.filter((g) => g.chats.length);
}

/**
 * Past chats as a sidebar on the left of /bro, on laptops and wider:
 * New chat at the top, then the chats grouped by date.
 */
export function BroChatSidebar({
  chats,
  currentId,
  onOpen,
  onDelete,
  onNew,
}: {
  chats: BroChatSummary[];
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <nav aria-label="Your chats with Bro" className="hidden lg:flex flex-col w-[260px] shrink-0 py-md min-h-0">
      <button
        type="button"
        onClick={onNew}
        title="New chat (Ctrl/⌘ Shift O)"
        className="inline-flex items-center justify-center gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm text-label-lg font-semibold text-on-surface hover:border-primary hover:text-primary cursor-pointer"
      >
        <SquarePen size={16} aria-hidden="true" /> New chat
      </button>
      <div className="flex-1 min-h-0 overflow-y-auto mt-md -mx-xs px-xs flex flex-col gap-md">
        {chats.length === 0 ? (
          <p className="text-label-md text-on-surface-variant px-sm">Your chats will show up here.</p>
        ) : (
          groupChats(chats).map((g) => (
            <section key={g.label} className="flex flex-col gap-[2px]">
              <h2 className="text-label-sm font-semibold text-on-surface-variant px-sm pb-xs">{g.label}</h2>
              {g.chats.map((c) => {
                const current = c.id === currentId;
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center rounded-lg ${current ? "bg-surface-container" : "hover:bg-surface-container-low"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!current) onOpen(c.id);
                      }}
                      aria-current={current ? "page" : undefined}
                      title={c.title}
                      className={`flex-1 min-w-0 text-left px-sm py-[7px] truncate text-body-md cursor-pointer ${current ? "text-on-surface font-semibold" : "text-on-surface"}`}
                    >
                      {c.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete “${c.title}”? This can't be undone.`)) onDelete(c.id);
                      }}
                      aria-label={`Delete chat: ${c.title}`}
                      className="p-xs mr-xs text-on-surface-variant opacity-0 group-hover:opacity-70 focus-visible:opacity-100 hover:opacity-100! hover:text-error cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </nav>
  );
}

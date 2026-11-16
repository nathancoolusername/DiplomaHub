"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { switchTheme } from "../theme-transition";
import Link from "next/link";
import { ArrowRight, BookOpen, Settings2, CalendarCheck, CalendarClock, FolderPen, FolderPlus, Gift, X, CalendarDays, CalendarPlus, Check, Copy, FileDown, Link2, List, Pencil, Play, Share2, Timer, Trash2 } from "lucide-react";
import { addBroHubCard, applyBroChangesCard, cancelBroChangesCard, editBroHubCard, redeemBroCodeCard, settleBroSettingsCard, shareBroHubCard } from "@/app/lib/actions/bro-cards";
import { codeLink, formatCode } from "@/lib/codes";
import { HUB_KIND_LABEL, type BroCard, type HubCard, type HubCardItem, type HubChangesCard, type HubItemSnapshot, type CodeCard, type RedeemCard, type SettingsCard, type ResourcesCard, type SetCard } from "@/lib/bro/cards";
import { broLink } from "@/lib/bro/links";
import { closeBro } from "./bro-visibility";

// The previews on Bro's replies: what Bro built (a set) or proposes (Hub
// items). Clean, scannable, one obvious button. Links close the bar so the
// page underneath is what the student sees next.

const card = "w-full min-w-[260px] sm:min-w-[340px] max-w-[460px] rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden";

export function BroCardView({ card: c, messageId, index, onChange }: { card: BroCard; messageId?: number; index: number; onChange: (c: BroCard) => void }) {
  if (c.type === "set") return <SetCardView card={c} />;
  if (c.type === "resources") return <ResourcesCardView card={c} />;
  if (c.type === "code") return <CodeCardView card={c} />;
  if (c.type === "settings") return <SettingsCardView card={c} messageId={messageId} index={index} onChange={onChange} />;
  if (c.type === "redeem") return <RedeemCardView card={c} messageId={messageId} index={index} onChange={onChange} />;
  if (c.type === "hub_changes") return <HubChangesCardView card={c} messageId={messageId} index={index} onChange={onChange} />;
  return <HubCardView card={c} messageId={messageId} index={index} onChange={onChange} />;
}

function SetCardView({ card: c }: { card: SetCard }) {
  return (
    <div className={card}>
      <div className="px-md pt-sm pb-xs flex flex-col gap-xs">
        <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">{c.subjectName} · practice set</p>
        <p className="font-serif font-bold text-body-lg text-on-surface leading-snug">{c.title}</p>
        <p className="inline-flex flex-wrap items-center gap-x-sm text-label-md text-on-surface-variant">
          <span>{c.questionCount} questions</span>
          {c.timed && (
            <span className="inline-flex items-center gap-0.5">
              <Timer size={12} aria-hidden="true" /> timed
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-xs pt-xs">
          {c.topics.map((t) => (
            <span key={t} className="rounded-full bg-surface-container px-sm py-0.5 text-label-sm text-on-surface">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-sm px-md py-sm border-t border-outline-variant bg-surface-container-low">
        <Link
          href={`/practice/sets/${c.setId}/play`}
          onClick={closeBro}
          className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90"
        >
          <Play size={14} aria-hidden="true" /> Start set
        </Link>
        <Link
          href={`/practice/sets/${c.setId}`}
          onClick={closeBro}
          className="inline-flex items-center gap-xs rounded-full px-sm py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary"
        >
          <Pencil size={13} aria-hidden="true" /> Edit
        </Link>
        <a
          href={`/practice/sets/${c.setId}/pdf?print=1`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-xs rounded-full px-sm py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary"
        >
          <FileDown size={13} aria-hidden="true" /> PDF
        </a>
      </div>
    </div>
  );
}

/** DiplomaHub resources Bro found: title, what it is, and Open. */
function ResourcesCardView({ card: c }: { card: ResourcesCard }) {
  return (
    <div className={card}>
      <p className="px-md pt-sm text-label-sm font-semibold uppercase tracking-wide text-primary">From DiplomaHub resources</p>
      <ul className="px-md py-xs flex flex-col">
        {c.items.map((r) => (
          <li key={r.id} className="flex items-center gap-sm py-xs border-b border-outline-variant last:border-b-0">
            <BookOpen size={16} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-semibold text-on-surface truncate" title={r.title}>
                {r.title}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {r.typeTag} · {r.subjectTag}
              </p>
            </div>
            <Link
              href={`/resources/${r.id}`}
              onClick={closeBro}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-sm py-0.5 text-label-md font-semibold text-primary hover:bg-primary hover:text-on-primary"
            >
              Open <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function dayParts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
    day: d.toLocaleDateString("en-GB", { day: "numeric" }),
    month: d.toLocaleDateString("en-GB", { month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

const KIND_DOT: Record<HubCardItem["kind"], string> = { test: "bg-tertiary", mock: "bg-tertiary", deadline: "bg-error", study: "bg-primary" };

function HubCardView({ card: c, messageId, index, onChange }: { card: HubCard; messageId?: number; index: number; onChange: (c: BroCard) => void }) {
  const [busy, setBusy] = useState<"add" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const added = c.status === "added";
  const isPlan = !!c.title && c.items.length > 1;
  const [view, setView] = useState<"calendar" | "list">(isPlan && canCalendar(c.items) ? "calendar" : "list");

  const saveItems = async (items: HubCardItem[]): Promise<string | null> => {
    if (messageId === undefined) return "One sec, the card is still saving.";
    const res = await editBroHubCard(messageId, index, items);
    if (!res.success) return res.error;
    onChange(res.data);
    return null;
  };

  const run = async (what: "add" | "share") => {
    if (messageId === undefined) return;
    setBusy(what);
    setError(null);
    const res = what === "add" ? await addBroHubCard(messageId, index) : await shareBroHubCard(messageId, index);
    setBusy(null);
    if (!res.success) return setError(res.error);
    onChange(res.data);
  };

  const first = dayParts(c.items[0].start);
  const last = dayParts(c.items[c.items.length - 1].start);

  return (
    <div className={card}>
      <div className="px-md pt-sm flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">{added ? "In your Hub" : isPlan ? "Plan for your Hub" : "For your Hub"}</p>
          {isPlan && (
            <>
              <p className="font-serif font-bold text-body-lg text-on-surface leading-snug">{c.title}</p>
              <p className="text-label-sm text-on-surface-variant">
                {c.items.length} items · {first.day} {first.month}
                {first.day + first.month !== last.day + last.month ? ` – ${last.day} ${last.month}` : ""}
              </p>
            </>
          )}
        </div>
        {isPlan && canCalendar(c.items) && (
          <div className="inline-flex shrink-0 rounded-full border border-outline-variant p-0.5" role="radiogroup" aria-label="View">
            {(["calendar", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                aria-label={v === "calendar" ? "Calendar" : "List"}
                onClick={() => setView(v)}
                className={`rounded-full p-1 cursor-pointer ${view === v ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
              >
                {v === "calendar" ? <CalendarDays size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "calendar" ? (
        <MiniCalendar items={c.items} />
      ) : (
        <ItemList items={c.items} added={added} onSave={!added && messageId !== undefined ? saveItems : undefined} />
      )}
      {!added && view === "calendar" && (
        <button type="button" onClick={() => setView("list")} className="mx-md mb-xs inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline cursor-pointer">
          <Pencil size={12} aria-hidden="true" /> Edit items
        </button>
      )}

      <div className="flex flex-wrap items-center gap-sm px-md py-sm border-t border-outline-variant bg-surface-container-low">
        {!added ? (
          <button
            type="button"
            onClick={() => void run("add")}
            disabled={busy !== null || messageId === undefined}
            className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            <CalendarPlus size={14} aria-hidden="true" />{" "}
            {busy === "add" ? "Adding…" : messageId === undefined ? "One sec…" : c.items.length === 1 ? "Add to Hub" : `Add all ${c.items.length} to Hub`}
          </button>
        ) : (
          <>
            <span className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface">
              <CalendarCheck size={14} aria-hidden="true" /> Added
            </span>
            <Link href="/hub" onClick={closeBro} className="inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline">
              Open Hub <ArrowRight size={13} aria-hidden="true" />
            </Link>
            {isPlan && !c.code && (
              <button
                type="button"
                onClick={() => void run("share")}
                disabled={busy !== null}
                className="ml-auto inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50 cursor-pointer"
              >
                <Share2 size={13} aria-hidden="true" /> {busy === "share" ? "Making a code…" : "Get a share code"}
              </button>
            )}
          </>
        )}
        {c.code && <ShareCode code={c.code} />}
        {error && (
          <span role="alert" className="basis-full text-label-sm text-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}


function ItemList({ items, added, onSave }: { items: HubCardItem[]; added: boolean; onSave?: (items: HubCardItem[]) => Promise<string | null> }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (next: HubCardItem[]) => {
    if (!onSave) return;
    setBusy(true);
    setError(null);
    const err = await onSave(next);
    setBusy(false);
    if (err) setError(err);
    else setEditing(null);
  };

  return (
    <ul className="px-md py-xs flex flex-col">
      {items.map((it, i) => {
        if (editing === i && onSave) {
          return (
            <ItemEditor
              key={i}
              item={it}
              busy={busy}
              error={error}
              onCancel={() => {
                setEditing(null);
                setError(null);
              }}
              onSave={(edited) => void save(items.map((x, j) => (j === i ? edited : x)))}
            />
          );
        }
        const d = dayParts(it.start);
        const mins = Math.round((Date.parse(it.end) - Date.parse(it.start)) / 60000);
        return (
          <li key={i} className="group flex items-center gap-md py-xs border-b border-outline-variant last:border-b-0">
            <div className="w-11 shrink-0 text-center leading-tight">
              <p className="text-label-sm text-on-surface-variant uppercase">{d.weekday}</p>
              <p className="font-serif font-bold text-body-lg text-on-surface">{d.day}</p>
              <p className="text-label-sm text-on-surface-variant">{d.month}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-semibold text-on-surface truncate">{it.title}</p>
              <p className="text-label-sm text-on-surface-variant">
                {HUB_KIND_LABEL[it.kind]}
                {it.subjectName ? ` · ${it.subjectName}` : ""}
                {it.allDay ? " · all day" : ` · ${d.time}${it.kind === "study" ? `, ${mins} min` : ""}`}
              </p>
              {it.practiceSetId && (
                <p className="text-label-sm text-primary truncate">Opens your set{it.practiceSetTitle ? `: ${it.practiceSetTitle}` : ""}</p>
              )}
            </div>
            {added && <Check size={16} className="text-primary shrink-0" aria-label="Added" />}
            {onSave && editing === null && (
              <span className="flex shrink-0 gap-0.5">
                <button type="button" onClick={() => setEditing(i)} aria-label={`Edit ${it.title}`} className="p-1 text-on-surface-variant hover:text-primary cursor-pointer">
                  <Pencil size={14} />
                </button>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => void save(items.filter((_, j) => j !== i))}
                    disabled={busy}
                    aria-label={`Remove ${it.title}`}
                    className="p-1 text-on-surface-variant hover:text-error cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </span>
            )}
          </li>
        );
      })}
      {error && editing === null && (
        <li role="alert" className="py-xs text-label-sm text-error">
          {error}
        </li>
      )}
    </ul>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const localTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const DURATIONS = [30, 45, 60, 90, 120, 180];
const field = "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-1 text-body-md text-on-surface outline-none focus:border-primary min-w-0";

/** Inline editor for one proposed item: name, kind, date, all day or a time and length. */
function ItemEditor({
  item,
  busy,
  error,
  onCancel,
  onSave,
}: {
  item: HubCardItem;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (item: HubCardItem) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [kind, setKind] = useState(item.kind);
  const [date, setDate] = useState(localDate(item.start));
  const [allDay, setAllDay] = useState(item.allDay);
  const [time, setTime] = useState(item.allDay ? "16:00" : localTime(item.start));
  const startMins = Math.round((Date.parse(item.end) - Date.parse(item.start)) / 60000);
  const [minutes, setMinutes] = useState(item.allDay ? 60 : DURATIONS.includes(startMins) ? startMins : 60);

  const submit = () => {
    const [y, m, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const start = allDay ? new Date(y, m - 1, d, 0, 0) : new Date(y, m - 1, d, h, mi);
    const end = allDay ? new Date(y, m - 1, d, 23, 59) : new Date(start.getTime() + minutes * 60_000);
    onSave({ ...item, title, kind, allDay, start: start.toISOString(), end: end.toISOString() });
  };

  return (
    <li className="py-sm border-b border-outline-variant last:border-b-0 flex flex-col gap-xs">
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-label="Name" className={field} />
      <div className="flex flex-wrap items-center gap-xs">
        <select value={kind} onChange={(e) => setKind(e.target.value as HubCardItem["kind"])} aria-label="Kind" className={field}>
          {(Object.keys(HUB_KIND_LABEL) as HubCardItem["kind"][]).map((k) => (
            <option key={k} value={k}>
              {HUB_KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className={field} />
        <label className="inline-flex items-center gap-1 text-label-md text-on-surface-variant">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All day
        </label>
        {!allDay && (
          <>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Start time" className={field} />
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label="Length" className={field}>
              {DURATIONS.map((n) => (
                <option key={n} value={n}>
                  {n < 60 ? `${n} min` : `${n / 60} h`.replace(".5", "½")}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-label-sm text-error">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-sm">
        <button type="button" onClick={onCancel} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer px-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !title.trim() || !date}
          className="rounded-full bg-primary text-on-primary px-md py-1 text-label-md font-semibold disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </li>
  );
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** A calendar fits up to four weeks; longer plans show as a list. */
function canCalendar(items: HubCardItem[]): boolean {
  const span = Date.parse(items[items.length - 1].start) - Date.parse(items[0].start);
  return span <= 27 * 86_400_000;
}

/** Monday-first weeks covering the plan; each day shows a dot per item, and tapping a day lists them. */
function MiniCalendar({ items }: { items: HubCardItem[] }) {
  const byDay = new Map<string, HubCardItem[]>();
  for (const it of items) {
    const k = dayKey(new Date(it.start));
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }
  const start = new Date(items[0].start);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(items[items.length - 1].start);
  end.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (const d = new Date(start); d <= end || days.length % 7 !== 0; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const [selected, setSelected] = useState(dayKey(new Date(items[0].start)));
  const today = dayKey(new Date());
  const picked = byDay.get(selected) ?? [];

  return (
    <div className="px-md py-sm flex flex-col gap-sm">
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-label-sm text-on-surface-variant">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const k = dayKey(d);
          const its = byDay.get(k) ?? [];
          const isSel = k === selected;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelected(k)}
              disabled={its.length === 0}
              aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}: ${its.length ? its.map((x) => x.title).join(", ") : "nothing"}`}
              aria-pressed={isSel}
              className={`h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 ${
                isSel ? "bg-primary/10 ring-1 ring-primary" : its.length ? "hover:bg-surface-container cursor-pointer" : ""
              }`}
            >
              <span className={`text-label-md tabular-nums ${k === today ? "font-bold text-primary" : its.length ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>{d.getDate()}</span>
              <span className="flex gap-0.5 h-1.5">
                {its.slice(0, 3).map((x, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${KIND_DOT[x.kind]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {picked.length > 0 && (
        <ul className="rounded-xl bg-surface-container-low px-sm py-xs flex flex-col gap-xs">
          {picked.map((it, i) => (
            <li key={i} className="flex items-center gap-sm text-label-md">
              <span className={`w-2 h-2 rounded-full shrink-0 ${KIND_DOT[it.kind]}`} aria-hidden="true" />
              <span className="tabular-nums text-on-surface-variant w-11 shrink-0">{it.allDay ? "All day" : dayParts(it.start).time}</span>
              <span className="flex-1 min-w-0 truncate text-on-surface font-semibold">{it.title}</span>
              <span className="text-on-surface-variant shrink-0">{HUB_KIND_LABEL[it.kind]}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="flex flex-wrap gap-md text-label-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" /> Tests and mocks</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Study</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Deadlines</span>
      </p>
    </div>
  );
}

/** The plan's share code, with copy buttons for the code and the link. */
function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const copy = async (what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(what === "code" ? formatCode(code) : codeLink(window.location.origin, code));
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked: the code is on screen to copy by hand.
    }
  };
  return (
    <div className="basis-full flex flex-wrap items-center gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest px-sm py-xs">
      <span className="text-label-sm text-on-surface-variant">Share code</span>
      <span className="font-mono font-bold text-body-lg tracking-widest text-on-surface">{formatCode(code)}</span>
      <span className="ml-auto inline-flex gap-xs">
        <button type="button" onClick={() => void copy("code")} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline cursor-pointer">
          {copied === "code" ? <Check size={13} /> : <Copy size={13} />} {copied === "code" ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={() => void copy("link")} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline cursor-pointer">
          {copied === "link" ? <Check size={13} /> : <Link2 size={13} />} {copied === "link" ? "Copied" : "Link"}
        </button>
      </span>
    </div>
  );
}

/** A link in Bro's reply: real DiplomaHub pages become button chips; anything else stays plain text. */
export function BroLinkChip({ href, children }: { href?: string; children?: React.ReactNode }) {
  const to = broLink(href);
  if (!to) return <>{children}</>;
  return (
    <Link
      href={to}
      onClick={closeBro}
      className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-sm py-px align-baseline text-label-md font-semibold text-primary no-underline hover:bg-primary hover:text-on-primary"
    >
      {children}
      <ArrowRight size={12} aria-hidden="true" />
    </Link>
  );
}

/** When an item happens, short: "Wed 19 Nov, 09:00" or "Wed 19 Nov, all day". */
function when(s: HubItemSnapshot): string {
  const p = dayParts(s.start);
  return `${p.weekday} ${p.day} ${p.month}, ${s.allDay ? "all day" : p.time}`;
}

/** What changes on one item, in words: only the parts that differ. */
function itemDiff(b: HubItemSnapshot, a: HubItemSnapshot): string[] {
  const out: string[] = [];
  if (a.title !== b.title) out.push(`Rename to “${a.title}”`);
  const mins = (x: HubItemSnapshot) => Math.round((Date.parse(x.end) - Date.parse(x.start)) / 60000);
  if (when(a) !== when(b)) out.push(`${when(b)} → ${when(a)}`);
  else if (!a.allDay && mins(a) !== mins(b)) out.push(`${mins(b)} → ${mins(a)} min`);
  if (a.kind && a.kind !== b.kind) out.push(`Make it a ${HUB_KIND_LABEL[a.kind].toLowerCase()}`);
  if (a.done !== undefined && a.done !== b.done) out.push(a.done ? "Tick it off" : "Reopen it");
  if (a.timer !== undefined && a.timer !== b.timer) out.push(a.timer ? "Countdown on Home: on" : "Countdown on Home: off");
  if (a.subjectId !== undefined && a.subjectId !== b.subjectId) out.push(a.subjectName ? `Subject: ${a.subjectName}` : "No subject");
  if (a.notes !== undefined && a.notes !== b.notes) out.push(a.notes ? `Notes: “${a.notes.length > 80 ? `${a.notes.slice(0, 77)}…` : a.notes}”` : "Clear the notes");
  if (a.stages && JSON.stringify(a.stages) !== JSON.stringify(b.stages ?? [])) out.push(a.stages.length ? `Checklist: ${a.stages.join(" · ")}` : "Clear the checklist");
  return out;
}

const listTitles = (t?: string[]) => (!t?.length ? "" : t.length <= 3 ? t.join(", ") : `${t.slice(0, 3).join(", ")} and ${t.length - 3} more`);

const CODE_LABEL: Record<CodeCard["codeType"], string> = { practice_set: "Practice set", hub_item: "Hub item", hub_set: "Hub set" };

/** Settings Bro proposes: each one before → after, then Apply or Cancel. */
function SettingsCardView({ card: c, messageId, index, onChange }: { card: SettingsCard; messageId?: number; index: number; onChange: (c: BroCard) => void }) {
  const [busy, setBusy] = useState<"apply" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setTheme } = useTheme();
  const run = async (apply: boolean) => {
    if (messageId === undefined || busy) return;
    setBusy(apply ? "apply" : "cancel");
    setError(null);
    const res = await settleBroSettingsCard(messageId, index, apply);
    setBusy(null);
    if (!res.success) return setError(res.error);
    // A new theme shows straight away, with the same transition as the theme switcher.
    const theme = apply ? c.ops.find((o) => o.op === "theme") : undefined;
    if (theme && theme.op === "theme") void switchTheme(setTheme, theme.value);
    onChange(res.data);
  };
  return (
    <div className={card}>
      <p className="px-md pt-sm text-label-sm font-semibold uppercase tracking-wide text-primary">
        {c.status === "applied" ? "Settings changed" : "Change your settings"}
      </p>
      <ul className={`px-md py-xs flex flex-col ${c.status === "cancelled" ? "opacity-60" : ""}`}>
        {c.ops.map((o, i) => (
          <li key={i} className="flex items-start gap-sm py-xs border-b border-outline-variant last:border-b-0">
            <Settings2 size={16} className="shrink-0 mt-0.5 text-on-surface-variant" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-semibold text-on-surface">{o.label}</p>
              <p className="text-label-sm text-on-surface-variant">
                <span className="line-through">{o.before}</span> → <span className="font-semibold text-on-surface">{o.after}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-sm px-md py-sm border-t border-outline-variant bg-surface-container-low">
        {c.status === "applied" ? (
          <span className="inline-flex items-center gap-xs text-label-md font-semibold text-primary">
            <Check size={14} aria-hidden="true" /> Done
          </span>
        ) : c.status === "cancelled" ? (
          <span className="text-label-md text-on-surface-variant">Cancelled. Nothing changed.</span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void run(true)}
              disabled={!!busy || messageId === undefined}
              className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
            >
              <Check size={14} aria-hidden="true" /> {busy === "apply" ? "Applying…" : messageId === undefined ? "One sec…" : "Apply"}
            </button>
            <button
              type="button"
              onClick={() => void run(false)}
              disabled={!!busy || messageId === undefined}
              className="inline-flex items-center gap-xs rounded-full px-sm py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary disabled:opacity-60 cursor-pointer"
            >
              <X size={13} aria-hidden="true" /> Cancel
            </button>
          </>
        )}
        {error && (
          <span role="alert" className="basis-full text-label-sm text-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/** A share code Bro made: what it shares, the code, copy buttons. */
function CodeCardView({ card: c }: { card: CodeCard }) {
  return (
    <div className={card}>
      <div className="px-md pt-sm pb-sm flex flex-col gap-sm">
        <div>
          <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">{CODE_LABEL[c.codeType]} · share code</p>
          <p className="font-serif font-bold text-body-lg text-on-surface leading-snug">{c.title}</p>
          <p className="text-label-sm text-on-surface-variant">
            {c.codeType === "hub_set"
              ? `${c.count ?? ""} items. Friends keep your dates or start it on a day they pick.`
              : c.codeType === "practice_set"
                ? "Friends get their own copy, same questions and settings."
                : "Friends get it on their Hub as a to-do."}
          </p>
        </div>
        <ShareCode code={c.code} />
      </div>
    </div>
  );
}

/** A code the student gave Bro: done, failed, or (a Hub set) keep the dates or start on a day. */
function RedeemCardView({ card: c, messageId, index, onChange }: { card: RedeemCard; messageId?: number; index: number; onChange: (c: BroCard) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startOn, setStartOn] = useState("");
  const run = async (day: string | null) => {
    if (messageId === undefined || busy) return;
    setBusy(true);
    setError(null);
    const res = await redeemBroCodeCard(messageId, index, day, Intl.DateTimeFormat().resolvedOptions().timeZone);
    setBusy(false);
    if (!res.success) return setError(res.error);
    onChange(res.data);
  };
  const p = c.preview;
  const range = p ? `${dayParts(p.firstStart).day} ${dayParts(p.firstStart).month} – ${dayParts(p.lastEnd).day} ${dayParts(p.lastEnd).month}` : "";
  return (
    <div className={card}>
      <div className="px-md pt-sm pb-xs flex items-start gap-sm">
        <Gift size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">Code {formatCode(c.code)}</p>
          {c.status === "done" && c.result && <p className="text-body-md font-semibold text-on-surface">{c.result.text}</p>}
          {c.status === "failed" && <p className="text-body-md text-on-surface-variant">{c.error}</p>}
          {c.status === "needs_choice" && p && (
            <>
              <p className="font-serif font-bold text-body-lg text-on-surface leading-snug">{p.name}</p>
              <p className="text-label-sm text-on-surface-variant">
                {p.count} items · {range}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-sm px-md py-sm border-t border-outline-variant bg-surface-container-low">
        {c.status === "done" && c.result ? (
          <Link href={c.result.href} onClick={closeBro} className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90">
            Open <ArrowRight size={13} aria-hidden="true" />
          </Link>
        ) : c.status === "needs_choice" ? (
          <>
            <button
              type="button"
              onClick={() => void run(null)}
              disabled={busy || messageId === undefined}
              className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              <CalendarPlus size={14} aria-hidden="true" /> {busy ? "Adding…" : "Keep the dates"}
            </button>
            <span className="inline-flex items-center gap-xs">
              <input
                type="date"
                value={startOn}
                onChange={(e) => setStartOn(e.target.value)}
                aria-label="Start the plan on"
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-1 text-label-md text-on-surface"
              />
              <button
                type="button"
                onClick={() => void run(startOn)}
                disabled={busy || !startOn || messageId === undefined}
                className="rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50 cursor-pointer"
              >
                Start on this day
              </button>
            </span>
          </>
        ) : (
          <Link href="/codes" onClick={closeBro} className="inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline">
            Your codes <ArrowRight size={13} aria-hidden="true" />
          </Link>
        )}
        {error && (
          <span role="alert" className="basis-full text-label-sm text-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/** Changes Bro proposes to what's already in the Hub: before → after, then Apply or Cancel. */
function HubChangesCardView({ card: c, messageId, index, onChange }: { card: HubChangesCard; messageId?: number; index: number; onChange: (c: BroCard) => void }) {
  const [busy, setBusy] = useState<"apply" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deletes = c.items.filter((i) => i.action === "delete").length + c.sets.filter((st) => st.action === "delete" && st.deleteItems).reduce((n, st) => n + st.itemCount, 0);

  async function run(what: "apply" | "cancel") {
    if (messageId === undefined || busy) return;
    setBusy(what);
    setError(null);
    const res = what === "apply" ? await applyBroChangesCard(messageId, index) : await cancelBroChangesCard(messageId, index);
    setBusy(null);
    if (!res.success) return setError(res.error);
    onChange(res.data);
  }

  const done = c.status !== "proposed";
  return (
    <div className={card}>
      <p className="px-md pt-sm text-label-sm font-semibold uppercase tracking-wide text-primary">Changes to your Hub</p>
      <ul className={`px-md py-xs flex flex-col ${c.status === "cancelled" ? "opacity-60" : ""}`}>
        {c.items.map((it) => (
          <li key={it.id} className="flex items-start gap-sm py-xs border-b border-outline-variant last:border-b-0">
            {it.action === "delete" ? (
              <Trash2 size={16} className="shrink-0 mt-0.5 text-error" aria-hidden="true" />
            ) : (
              <CalendarClock size={16} className="shrink-0 mt-0.5 text-on-surface-variant" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-body-md font-semibold text-on-surface truncate ${it.action === "delete" ? "line-through decoration-error/70" : ""}`} title={it.before.title}>
                {it.before.title}
              </p>
              {it.action === "delete" ? (
                <p className="text-label-sm text-error">{when(it.before)} · {c.status === "applied" ? "deleted" : "will be deleted"}</p>
              ) : (
                it.after &&
                itemDiff(it.before, it.after).map((d) => (
                  <p key={d} className="text-label-sm text-on-surface-variant">
                    {d}
                  </p>
                ))
              )}
            </div>
          </li>
        ))}
        {c.sets.map((st) => (
          <li key={st.id} className="flex items-start gap-sm py-xs border-b border-outline-variant last:border-b-0">
            {st.action === "delete" ? (
              <Trash2 size={16} className="shrink-0 mt-0.5 text-error" aria-hidden="true" />
            ) : st.action === "create" ? (
              <FolderPlus size={16} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
            ) : (
              <FolderPen size={16} className="shrink-0 mt-0.5 text-on-surface-variant" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-body-md font-semibold text-on-surface truncate ${st.action === "delete" ? "line-through decoration-error/70" : ""}`}>Set: {st.name}</p>
              <p className={`text-label-sm ${st.action === "delete" ? "text-error" : "text-on-surface-variant"}`}>
                {st.action === "create"
                  ? `New set with ${st.itemCount} item${st.itemCount === 1 ? "" : "s"}: ${listTitles(st.itemTitles)}`
                  : st.action === "add_items"
                    ? `Add ${listTitles(st.itemTitles)}`
                    : st.action === "remove_items"
                      ? `Take out ${listTitles(st.itemTitles)} (they stay in your Hub)`
                      : st.action === "rename"
                  ? `Rename to “${st.newName}”`
                  : st.deleteItems
                    ? `Delete the set and its ${st.itemCount} item${st.itemCount === 1 ? "" : "s"}`
                    : `Delete the set (its ${st.itemCount} item${st.itemCount === 1 ? "" : "s"} stay in your Hub)`}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-sm px-md py-sm border-t border-outline-variant bg-surface-container-low">
        {c.status === "applied" ? (
          <>
            <span className="inline-flex items-center gap-xs text-label-md font-semibold text-primary">
              <Check size={14} aria-hidden="true" /> Done
            </span>
            <Link href="/hub" onClick={closeBro} className="inline-flex items-center gap-xs rounded-full px-sm py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary">
              Open Hub <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </>
        ) : c.status === "cancelled" ? (
          <span className="text-label-md text-on-surface-variant">Cancelled. Nothing changed.</span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => run("apply")}
              disabled={!!busy || messageId === undefined}
              className={`inline-flex items-center gap-xs rounded-full px-md py-xs text-label-md font-semibold disabled:opacity-60 ${deletes ? "bg-error text-on-error hover:bg-error/90" : "bg-primary text-on-primary hover:bg-primary/90"}`}
            >
              <Check size={14} aria-hidden="true" /> {busy === "apply" ? "Applying…" : deletes ? `Apply${deletes ? ` (deletes ${deletes})` : ""}` : "Apply changes"}
            </button>
            <button
              type="button"
              onClick={() => run("cancel")}
              disabled={!!busy || messageId === undefined}
              className="inline-flex items-center gap-xs rounded-full px-sm py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary disabled:opacity-60"
            >
              <X size={13} aria-hidden="true" /> Cancel
            </button>
          </>
        )}
        {!done && messageId === undefined && <span className="text-label-sm text-on-surface-variant">Saving…</span>}
      </div>
      {error && <p className="px-md pb-sm text-label-sm text-error">{error}</p>}
    </div>
  );
}

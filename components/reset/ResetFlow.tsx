"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { ArrowRight, CalendarCheck, CalendarDays, Check, ClipboardList, ListChecks, Plus, TrendingUp, Users, X } from "lucide-react";
import type { WeeklyReset } from "@/lib/data";
import { finishResetAction } from "@/app/hub/reset/actions";
import { dayKey, resetWeekStart } from "@/lib/reset-week";
import { Spinner } from "@/components/spinner";

type Draft = { key: number; subjectId: string; subjectName: string; subtopicIds: string[]; title: string; reason: string; day: string; time: string; minutes: number; before: string | null };

const MINUTES = [15, 20, 25, 30, 45, 60];
const DAY = 86_400_000;
const card = "rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md";
const noop = () => () => {};

const fmtDay = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtWhen = (iso: string) => new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** The next 8 days from today, as YYYY-MM-DD. */
function nextDays(): string[] {
  const t = new Date();
  return Array.from({ length: 8 }, (_, i) => dayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() + i)));
}

/** Spreads the sessions over the coming days, each before its test (if it has one). */
function initialDrafts(plan: WeeklyReset["plan"]): Draft[] {
  const days = nextDays();
  // Tomorrow, the day after, then later in the week; today only if nothing else fits.
  const spread = [1, 2, 4, 3, 5];
  return plan.map((p, i) => {
    const latest = p.before ? dayKey(new Date(new Date(p.before).getTime() - DAY)) : days[days.length - 1];
    const choices = days.filter((d) => d <= latest);
    const wanted = days[spread[i] ?? 1];
    const day = choices.includes(wanted) ? wanted : (choices.filter((d) => d > days[0]).slice(-1)[0] ?? days[0]);
    return { key: i, ...p, day, time: "17:00" };
  });
}

type SquadLink = { id: string; name: string };

export function ResetFlow({ data, briefSlot, preview = false, squads = [] }: { data: WeeklyReset; briefSlot?: React.ReactNode; /** /dev/reset: nothing is saved. */ preview?: boolean; squads?: SquadLink[] }) {
  // Dates depend on the student's time zone: only render once in the browser.
  const ready = useSyncExternalStore(noop, () => true, () => false);
  if (!ready)
    return (
      <div className="flex justify-center py-xl">
        <Spinner size={24} />
      </div>
    );
  return <Flow data={data} briefSlot={briefSlot} preview={preview} squads={squads} />;
}

function Flow({ data, briefSlot, preview, squads }: { data: WeeklyReset; briefSlot?: React.ReactNode; preview: boolean; squads: SquadLink[] }) {
  const weekStart = useMemo(() => resetWeekStart(), []);
  const days = useMemo(() => nextDays(), []);
  const [drafts, setDrafts] = useState<Draft[]>(() => initialDrafts(data.plan));
  const [removed, setRemoved] = useState<Draft[]>([]);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ added: number; sets: number } | null>(null);
  const alreadyDone = data.doneWeeks.includes(weekStart);
  const { lastWeek, thisWeek } = data;

  const update = (key: number, patch: Partial<Draft>) => setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const remove = (x: Draft) => {
    setDrafts((d) => d.filter((y) => y.key !== x.key));
    setRemoved((r) => [...r, x]);
  };
  const restore = (x: Draft) => {
    setRemoved((r) => r.filter((y) => y.key !== x.key));
    setDrafts((d) => [...d, x].sort((a, b) => a.key - b.key));
  };

  const finish = () =>
    start(async () => {
      setError(null);
      try {
        const sessions = drafts.map((d) => {
          const startAt = new Date(`${d.day}T${d.time}:00`);
          return { subjectId: d.subjectId, subtopicIds: d.subtopicIds, title: d.title, startAt: startAt.toISOString(), endAt: new Date(startAt.getTime() + d.minutes * 60_000).toISOString() };
        });
        setDone(preview ? { added: sessions.length, sets: drafts.filter((d) => d.subtopicIds.length).length } : await finishResetAction(weekStart, sessions));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't add them just now. Try again.");
      }
    });

  if (done)
    return (
      <section className={`${card} items-center text-center py-xl`}>
        <span className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
          <CalendarCheck size={28} />
        </span>
        <h2 className="font-serif font-bold text-headline-lg text-on-surface">Your week is set.</h2>
        <p className="text-body-lg text-on-surface-variant max-w-140">
          {done.added === 0
            ? "Nothing added this time, and that's fine. See you next Sunday."
            : `${done.added} session${done.added === 1 ? "" : "s"} on your Hub${done.sets ? `, ${done.sets} with a practice set ready to start` : ""}. See you next Sunday.`}
        </p>
        <div className="flex flex-wrap justify-center gap-sm">
          <Link href="/hub" className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90">
            Open the Hub <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {squads.length > 0 ? (
            <Link href={`/squads/${squads[0].id}`} className="inline-flex items-center gap-xs rounded-lg border-2 border-primary text-primary px-lg py-sm font-semibold hover:bg-primary-fixed">
              <Users size={16} aria-hidden="true" /> See who in {squads[0].name} has planned theirs
            </Link>
          ) : (
            <Link href="/squads" className="inline-flex items-center gap-xs rounded-lg border-2 border-primary text-primary px-lg py-sm font-semibold hover:bg-primary-fixed">
              <Users size={16} aria-hidden="true" /> Do it with friends: start a squad
            </Link>
          )}
        </div>
        {squads.length > 0 && <p className="text-label-sm text-on-surface-variant">Your squad now sees that you&apos;ve planned your week.</p>}
      </section>
    );

  return (
    <div className="flex flex-col gap-lg">
      {alreadyDone && (
        <p className="rounded-xl bg-secondary-container text-on-secondary-container px-md py-sm text-label-md flex items-center gap-xs" role="status">
          <Check size={16} aria-hidden="true" /> You&apos;ve already planned the week of {fmtDay(weekStart)}. Doing it again adds more sessions.
        </p>
      )}
      {briefSlot}

      {/* 1 · Last week */}
      <section className={card} aria-labelledby="reset-last">
        <Step n={1} id="reset-last" icon={<TrendingUp size={18} />} title="Last week" />
        <div className="flex flex-wrap gap-sm">
          <Stat value={String(lastWeek.answered)} label="questions answered" />
          <Stat value={lastWeek.accuracy === null ? "–" : `${Math.round(lastWeek.accuracy * 100)}%`} label="of marks earned" />
          <Stat value={String(lastWeek.sets.length)} label={`set${lastWeek.sets.length === 1 ? "" : "s"} finished`} />
          {lastWeek.wonBack !== null && <Stat value={String(lastWeek.wonBack)} label="marks won back" />}
        </div>
        {lastWeek.lost.length > 0 && (
          <div className="flex flex-col gap-xs">
            <p className="text-label-md font-semibold text-on-surface">Where the marks went</p>
            {lastWeek.lost.map((l) => (
              <div key={`${l.subjectId}:${l.subtopicCode}`} className="flex items-center gap-sm">
                <span className="flex-1 min-w-0 truncate text-body-md text-on-surface">
                  {l.name} <span className="text-label-sm text-on-surface-variant">· {l.subjectName}</span>
                </span>
                <div className="w-28 h-2 rounded-full bg-surface-container-high overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(((l.possible - l.lost) / l.possible) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-label-md tabular-nums text-on-surface-variant">
                  {l.lost} of {l.possible} lost
                </span>
              </div>
            ))}
          </div>
        )}
        {lastWeek.results.length > 0 && (
          <div className="flex flex-col gap-xs">
            <p className="text-label-md font-semibold text-on-surface">Results you logged</p>
            <ul className="flex flex-wrap gap-xs">
              {lastWeek.results.map((r) => (
                <li key={r.id} className="rounded-full bg-surface-container px-sm py-px text-label-md text-on-surface">
                  {r.title}
                  {r.grade ? ` · ${r.grade}` : r.percent !== null ? ` · ${Math.round(r.percent)}%` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {lastWeek.toLog.length > 0 && (
          <Link href="/progress" className="self-start inline-flex items-center gap-xs rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed">
            <ClipboardList size={14} aria-hidden="true" /> How did {lastWeek.toLog.length === 1 ? `your ${lastWeek.toLog[0].title}` : `your ${lastWeek.toLog.length} tests`} go? Log it on Progress
          </Link>
        )}
        {lastWeek.answered === 0 && lastWeek.results.length === 0 && lastWeek.toLog.length === 0 && (
          <p className="text-body-md text-on-surface-variant">A quiet week. That&apos;s fine: this is where it starts.</p>
        )}
      </section>

      {/* 2 · This week */}
      <section className={card} aria-labelledby="reset-this">
        <Step n={2} id="reset-this" icon={<CalendarDays size={18} />} title="This week" />
        {thisWeek.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            No tests or deadlines on your Hub in the next 8 days.{" "}
            <Link href="/hub?add=1" className="font-semibold text-primary hover:underline">
              Add one
            </Link>{" "}
            if something&apos;s coming.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant">
            {thisWeek.map((i) => (
              <li key={i.id} className="flex items-center gap-sm py-xs">
                <span className={`rounded-full px-sm py-px text-label-sm font-semibold ${i.kind === "test" || i.kind === "mock" ? "bg-on-surface text-surface" : "bg-surface-container text-on-surface-variant"}`}>
                  {i.kind === "mock" ? "Mock" : i.kind === "test" ? "Test" : "Deadline"}
                </span>
                <span className="flex-1 min-w-0 truncate text-body-md text-on-surface">{i.title}</span>
                <span className="text-label-md text-on-surface-variant tabular-nums">{fmtWhen(i.startsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3 · Sessions */}
      <section className={card} aria-labelledby="reset-plan">
        <Step n={3} id="reset-plan" icon={<ListChecks size={18} />} title={drafts.length ? `${drafts.length === 1 ? "One session" : `${drafts.length} sessions`} that count` : "Sessions"} />
        {data.plan.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            Not enough practice yet to suggest topics. Do a set or two this week and next Sunday&apos;s plan is built from them.{" "}
            <Link href="/practice" className="font-semibold text-primary hover:underline">
              Go to Practice
            </Link>
          </p>
        ) : (
          <>
            <p className="text-body-md text-on-surface-variant">Short and specific. Change the day, time or length, or drop one.</p>
            <ul className="flex flex-col gap-sm">
              {drafts.map((d) => {
                const latest = d.before ? dayKey(new Date(new Date(d.before).getTime() - DAY)) : days[days.length - 1];
                return (
                  <li key={d.key} className="rounded-2xl bg-surface-container-low p-md flex flex-col gap-sm">
                    <div className="flex items-start gap-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-semibold text-on-surface">
                          {d.subjectName}: {d.title}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {d.reason}
                          {d.subtopicIds.length ? " · a short practice set opens from the Hub" : ""}
                        </p>
                      </div>
                      <button type="button" onClick={() => remove(d)} aria-label={`Drop ${d.title}`} className="p-xs rounded-lg text-on-surface-variant hover:text-primary cursor-pointer">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-sm text-label-md">
                      <select
                        value={d.day}
                        onChange={(e) => update(d.key, { day: e.target.value })}
                        aria-label="Day"
                        className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-on-surface"
                      >
                        {days
                          .filter((x) => x <= latest)
                          .map((x, i) => (
                            <option key={x} value={x}>
                              {i === 0 ? "Today" : fmtDay(x)}
                            </option>
                          ))}
                      </select>
                      <input
                        type="time"
                        value={d.time}
                        onChange={(e) => e.target.value && update(d.key, { time: e.target.value })}
                        aria-label="Start time"
                        className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-on-surface"
                      />
                      <select
                        value={d.minutes}
                        onChange={(e) => update(d.key, { minutes: Number(e.target.value) })}
                        aria-label="Length"
                        className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-on-surface"
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>
                            {m} min
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                );
              })}
            </ul>
            {removed.length > 0 && (
              <div className="flex flex-wrap gap-xs">
                {removed.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => restore(r)}
                    className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-sm py-px text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
                  >
                    <Plus size={12} aria-hidden="true" /> {r.title}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p className="text-label-md text-error">{error}</p>}
        <div className="flex flex-wrap items-center gap-sm pt-xs">
          <button
            type="button"
            onClick={finish}
            disabled={busy}
            className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {busy && <Spinner size={14} />}
            {drafts.length ? `Add ${drafts.length === 1 ? "it" : `all ${drafts.length}`} to my Hub` : "Done for this week"}
          </button>
          {drafts.length > 0 && <span className="text-label-sm text-on-surface-variant">Free. You can move them on the Hub later.</span>}
        </div>
      </section>
    </div>
  );
}

function Step({ n, id, icon, title }: { n: number; id: string; icon: React.ReactNode; title: string }) {
  return (
    <h2 id={id} className="flex items-center gap-sm font-serif font-bold text-headline-md text-on-surface">
      <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">Step {n}: </span>
      {title}
    </h2>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-md py-sm">
      <p className="font-serif font-bold text-headline-md text-primary tabular-nums leading-none">{value}</p>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
    </div>
  );
}

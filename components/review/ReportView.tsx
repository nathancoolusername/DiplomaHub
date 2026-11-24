"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Circle, ExternalLink, Info, MessageCircle, Printer, TrendingUp } from "lucide-react";
import { draftFileUrlAction, setPrioritiesDoneAction } from "@/app/review/actions";
import type { ReviewDraft } from "@/lib/data/supabase/reviews";
import { reportTotal, type CommentKind, type Report } from "@/lib/review/report";
import type { CriteriaView } from "@/lib/review/view-types";
import { Segmented } from "@/components/shared/Segmented";
import { AnnotatedDocument, type IndexedComment } from "./AnnotatedDocument";
import { openBro } from "@/components/shared/bro/bro-visibility";

const fmt = (low: number, high: number) => (low === high ? `${low}` : `${low}–${high}`);

const KIND_STYLE: Record<CommentKind, { label: string; className: string }> = {
  strength: { label: "Works", className: "bg-primary-fixed text-on-primary-fixed" },
  issue: { label: "Fix", className: "bg-error-container text-on-error-container" },
  suggestion: { label: "Idea", className: "bg-surface-container-high text-on-surface" },
};

/** A finished review: total, priorities, criterion cards and comments pinned to pages. */
export function ReportView({
  draft,
  previousVersion,
  criteria,
  fileUrl,
}: {
  draft: ReviewDraft;
  previousVersion: number | null;
  criteria: CriteriaView;
  /** A signed link to the PDF, to show it with the comments on it. */
  fileUrl: string | null;
}) {
  const report = draft.report as Report;
  const byId = useMemo(() => Object.fromEntries(criteria.criteria.map((c) => [c.id, c])), [criteria]);
  const total = reportTotal(report, Object.fromEntries(criteria.criteria.map((c) => [c.id, c.max])));
  const skipped = report.criteria.filter((c) => c.not_assessed).map((c) => byId[c.id]?.name).filter(Boolean);

  return (
    <div className="flex flex-col gap-md">
      <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
        <div className="flex flex-wrap items-end justify-between gap-md">
          <div>
            <p className="text-label-md text-on-surface-variant">Draft {draft.version} · estimated mark</p>
            <p className="font-serif font-bold text-display-lg text-primary tabular-nums leading-none">
              {fmt(total.low, total.high)}
              <span className="text-headline-md text-on-surface-variant"> / {total.max ?? criteria.total}</span>
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="print:hidden inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-label-md text-on-surface hover:border-primary">
            <Printer size={14} aria-hidden="true" /> Print or save as PDF
          </button>
        </div>
        <p className="text-body-lg text-on-surface">{report.summary}</p>
        {report.progress.summary && previousVersion !== null && (
          <div className="rounded-xl bg-surface-container-low p-md flex gap-sm">
            <TrendingUp size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-body-md text-on-surface">
              <span className="font-semibold">Since draft {previousVersion}: </span>
              {report.progress.summary}
            </p>
          </div>
        )}
        <p className="text-label-sm text-on-surface-variant flex gap-xs">
          <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          An estimate to help you improve, not a final mark: your teacher and the IB moderators decide.
          {` Marked against the official criteria (${criteria.source}).`}
          {skipped.length > 0 && ` Not marked: ${skipped.join(", ")} (not in your file), so the total is out of ${total.max}.`}
        </p>
      </section>

      <Priorities draft={draft} report={report} byId={byId} />

      <Comments draftId={draft.id} report={report} byId={byId} fileUrl={fileUrl} />

      <section aria-label="Criteria" className="grid gap-md md:grid-cols-2">
        {report.criteria.map((c) => {
          const info = byId[c.id];
          if (!info) return null;
          return (
            <article key={c.id} className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-sm break-inside-avoid">
              <div className="flex items-baseline justify-between gap-sm">
                <h3 className="font-serif font-bold text-headline-md text-on-surface">
                  {criteria.criteria.length > 1 && /^[A-G]$/.test(info.id) ? `${info.id}. ` : ""}
                  {info.name}
                </h3>
                {c.not_assessed ? (
                  <span className="text-label-md text-on-surface-variant shrink-0">Not marked</span>
                ) : (
                  <span className="font-serif font-bold text-headline-md text-primary tabular-nums shrink-0">
                    {fmt(c.mark_low, c.mark_high)}
                    <span className="text-body-md text-on-surface-variant">/{info.max}</span>
                  </span>
                )}
              </div>
              {!c.not_assessed && (
                <div className="h-1.5 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(c.mark_high / info.max) * 100}%` }} />
                </div>
              )}
              <p className="text-label-sm text-on-surface-variant">{info.summary}</p>
              <p className="text-body-md text-on-surface">{c.why}</p>
              {c.strengths.length > 0 && <List title="What works" items={c.strengths} />}
              {c.to_raise.length > 0 && <List title="To raise it" items={c.to_raise} />}
            </article>
          );
        })}
      </section>


      {report.notes.length > 0 && (
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-xs">
          <h3 className="text-label-md font-semibold text-on-surface">Notes</h3>
          <ul className="list-disc pl-lg text-body-md text-on-surface-variant">
            {report.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-label-md font-semibold text-on-surface">{title}</p>
      <ul className="list-disc pl-lg text-body-md text-on-surface-variant flex flex-col gap-0.5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Priorities({ draft, report, byId }: { draft: ReviewDraft; report: Report; byId: Record<string, { name: string }> }) {
  const [done, setDone] = useState<number[]>(draft.donePriorities);
  const [, start] = useTransition();
  if (report.priorities.length === 0) return null;
  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    start(async () => {
      await setPrioritiesDoneAction(draft.id, next);
    });
  };
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-sm">
      <h2 className="font-serif font-bold text-headline-md text-on-surface">Your next three changes</h2>
      <p className="text-label-sm text-on-surface-variant">The changes most likely to gain marks. Tick them off as you go; your next draft&apos;s review checks them too.</p>
      <ol className="flex flex-col gap-sm">
        {report.priorities.map((p, i) => {
          const on = done.includes(i);
          return (
            <li key={i}>
              <button type="button" onClick={() => toggle(i)} aria-pressed={on} className="w-full text-left flex gap-sm rounded-xl p-sm hover:bg-surface-container-low">
                {on ? <CheckCircle2 size={20} className="text-primary shrink-0" aria-hidden="true" /> : <Circle size={20} className="text-on-surface-variant shrink-0" aria-hidden="true" />}
                <span className="flex flex-col gap-0.5">
                  <span className={`text-body-md font-semibold ${on ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
                    {i + 1}. {p.title}
                    {byId[p.criterion_id] && <span className="font-normal text-label-sm text-on-surface-variant"> · {byId[p.criterion_id].name}</span>}
                  </span>
                  <span className="text-body-md text-on-surface-variant">{p.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Comments({ draftId, report, byId, fileUrl }: { draftId: string; report: Report; byId: Record<string, { name: string }>; fileUrl: string | null }) {
  const [filter, setFilter] = useState<string>("all");
  const [mode, setMode] = useState<"page" | "list">(fileUrl ? "page" : "list");
  const [opening, setOpening] = useState(false);
  const shown = useMemo(
    () =>
      report.comments
        .map((c, idx) => ({ ...c, idx }))
        .filter((c) => filter === "all" || c.criterion_id === filter)
        .sort((a, b) => a.page - b.page),
    [report.comments, filter],
  );
  // Opens Bro with this comment; the server loads it (and the review's reasoning) from the student's own draft.
  const ask = (c: IndexedComment) =>
    openBro({
      newChat: true,
      review: { draftId, comment: c.idx },
      prompt: `Can you help me with this comment on page ${c.page} of my draft (${name(c.criterion_id)})? "${c.comment}"`,
    });
  if (report.comments.length === 0) return null;

  async function openPage(page: number) {
    setOpening(true);
    const r = await draftFileUrlAction(draftId);
    setOpening(false);
    if (r.ok && r.data) window.open(`${r.data}#page=${page}`, "_blank", "noopener");
  }

  const ids = [...new Set(report.comments.map((c) => c.criterion_id))];
  const name = (id: string) => byId[id]?.name ?? "General";
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="font-serif font-bold text-headline-md text-on-surface">{mode === "page" ? "Your draft, with comments" : "Comments on your work"}</h2>
        <div className="flex flex-wrap items-center gap-sm print:hidden">
          {fileUrl && (
            <Segmented
              label="Show comments"
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: "page", label: "On the page" },
                { value: "list", label: "As a list" },
              ]}
            />
          )}
          <select
            aria-label="Show comments for"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-label-md text-on-surface"
          >
            <option value="all">All criteria</option>
            {ids.map((id) => (
              <option key={id} value={id}>
                {name(id)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {mode === "page" && fileUrl && (
        <div className="print:hidden">
          <AnnotatedDocument fileUrl={fileUrl} comments={shown} criterionName={name} onAsk={ask} />
        </div>
      )}
      <ul className={`flex-col gap-sm ${mode === "list" ? "flex" : "hidden print:flex"}`}>
        {shown.map((c, i) => (
          <li key={`${c.page}-${i}`} className="rounded-xl border border-outline-variant p-md flex flex-col gap-xs break-inside-avoid">
            <div className="flex flex-wrap items-center gap-sm">
              <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${KIND_STYLE[c.kind].className}`}>{KIND_STYLE[c.kind].label}</span>
              <button type="button" disabled={opening} onClick={() => openPage(c.page)} className="inline-flex items-center gap-xs text-label-sm text-primary hover:underline print:no-underline">
                Page {c.page} <ExternalLink size={12} className="print:hidden" aria-hidden="true" />
              </button>
              <span className="text-label-sm text-on-surface-variant">{name(c.criterion_id)}</span>
            </div>
            {c.quote && <blockquote className="border-l-2 border-primary pl-sm text-label-md italic text-on-surface-variant">&ldquo;{c.quote}&rdquo;</blockquote>}
            <p className="text-body-md text-on-surface">{c.comment}</p>
            <button type="button" onClick={() => ask(c)} className="print:hidden self-start inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline">
              <MessageCircle size={14} aria-hidden="true" /> Ask Bro about this
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

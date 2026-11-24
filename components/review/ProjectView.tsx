"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, FileUp, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { createClient } from "@/app/lib/supabase/client";
import { deleteDraftAction, deleteProjectAction, setLevelAction, startUploadAction, updateProjectAction } from "@/app/review/actions";
import type { ReviewAllowance, ReviewDraft, ReviewProject } from "@/lib/data/supabase/reviews";
import { KIND_LABELS, QUESTION_LABEL, type ReviewLevel } from "@/lib/review/labels";
import { Segmented } from "@/components/shared/Segmented";
import type { CriteriaView } from "@/lib/review/view-types";
import { reportTotal } from "@/lib/review/report";
import { ReportView } from "./ReportView";

const BUCKET = "coursework";
const fmtTotal = (low: number, high: number) => (low === high ? `${low}` : `${low}–${high}`);

export function ProjectView({
  project,
  criteria,
  allowance,
  subjectName,
  selectedId,
  fileUrl,
  level,
}: {
  project: ReviewProject;
  criteria: CriteriaView;
  allowance: ReviewAllowance;
  subjectName: string | null;
  selectedId: string | null;
  /** Signed link to the selected draft's PDF (finished reviews only). */
  fileUrl: string | null;
  /** The level used for marking (the project's, else their subjects', else SL). */
  level: ReviewLevel;
}) {
  const router = useRouter();
  const maxById = Object.fromEntries(criteria.criteria.map((c) => [c.id, c.max]));
  const draft = project.drafts.find((d) => d.id === selectedId) ?? project.drafts[0] ?? null;
  const previous = draft ? (project.drafts.find((d) => d.version < draft.version && d.status === "done") ?? null) : null;

  // While a review runs, look for the result every few seconds.
  const marking = project.drafts.some((d) => d.status === "marking");
  useEffect(() => {
    if (!marking) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [marking, router]);

  return (
    <div className="flex flex-col gap-lg">
      <Link href="/review" className="self-start inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
        <ArrowLeft size={14} aria-hidden="true" /> All projects
      </Link>
      <ProjectHeader project={project} subjectName={subjectName} />

      <div className="grid gap-lg lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-md">
          <UploadCard projectId={project.id} hasDrafts={project.drafts.length > 0} />
          {project.drafts.length > 0 && (
            <nav aria-label="Drafts" className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-sm flex flex-col gap-0.5">
              {project.drafts.map((d) => {
                const t = d.report ? reportTotal(d.report, maxById) : null;
                const active = d.id === draft?.id;
                return (
                  <Link
                    key={d.id}
                    href={`/review/${project.id}?d=${d.id}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-md py-sm flex items-center justify-between gap-sm ${active ? "bg-primary-fixed text-on-primary-fixed" : "hover:bg-surface-container"}`}
                  >
                    <span className="flex flex-col min-w-0">
                      <span className="text-label-md font-semibold">Draft {d.version}</span>
                      <span className="text-label-sm text-on-surface-variant truncate">{d.fileName}</span>
                    </span>
                    <span className="text-label-md tabular-nums shrink-0">
                      {d.status === "marking" ? <Spinner size={14} /> : t ? `${fmtTotal(t.low, t.high)}/${t.max ?? criteria.total}` : d.status === "failed" ? "–" : ""}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}
          {project.kind === "ia" && <LevelSwitch projectId={project.id} level={level} />}
          <p className="text-label-sm text-on-surface-variant">
            {criteria.label}
            {criteria.level ? ` (${criteria.level})` : ""}: {criteria.total} marks.
            {criteria.limits.note ? ` ${criteria.limits.note}` : ""}
          </p>
        </aside>

        <main className="min-w-0 flex flex-col gap-md">
          {!draft ? (
            <section className="rounded-2xl border border-dashed border-outline-variant p-xl text-center flex flex-col items-center gap-sm">
              <FileUp size={28} className="text-primary" aria-hidden="true" />
              <p className="font-serif font-bold text-headline-md text-on-surface">Upload your first draft</p>
              <p className="text-body-md text-on-surface-variant max-w-[460px]">
                Save it as a PDF first (Word: File → Save as → PDF; Google Docs: File → Download → PDF). We check it for free before you use a review.
              </p>
            </section>
          ) : (
            <DraftPanel key={draft.id} projectId={project.id} draft={draft} previous={previous} criteria={criteria} allowance={allowance} fileUrl={fileUrl} />
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectHeader({ project, subjectName }: { project: ReviewProject; subjectName: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [question, setQuestion] = useState(project.question);
  const [pending, start] = useTransition();

  if (editing)
    return (
      <form
        className="flex flex-col gap-sm"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await updateProjectAction(project.id, title, question);
            if (r.ok) setEditing(false);
          });
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} aria-label="Name" className="rounded-lg border border-outline-variant bg-surface px-md py-sm text-headline-md font-serif font-bold text-on-surface" />
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={400} aria-label={QUESTION_LABEL[project.kind]} placeholder={QUESTION_LABEL[project.kind]} className="rounded-lg border border-outline-variant bg-surface px-md py-sm text-body-md text-on-surface min-h-[64px]" />
        <div className="flex gap-sm">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold">
            {pending && <Spinner size={14} />} Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-md py-xs text-label-md text-on-surface-variant hover:text-on-surface">
            Cancel
          </button>
        </div>
      </form>
    );

  return (
    <header className="flex flex-col gap-xs">
      <span className="text-label-md text-on-surface-variant">
        {KIND_LABELS[project.kind]}
        {subjectName ? ` · ${subjectName}` : ""}
      </span>
      <div className="flex items-start gap-sm">
        <h1 className="font-serif font-bold text-headline-lg text-on-surface flex-1">{project.title}</h1>
        <button type="button" onClick={() => setEditing(true)} className="p-xs rounded-lg text-on-surface-variant hover:text-primary" aria-label="Edit name and question">
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="p-xs rounded-lg text-on-surface-variant hover:text-error"
          aria-label="Delete project"
          onClick={() => {
            if (!confirm("Delete this project, all its drafts and reviews? This can't be undone.")) return;
            start(async () => {
              const r = await deleteProjectAction(project.id);
              if (r.ok) router.push("/review");
            });
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      {project.question ? (
        <p className="text-body-md text-on-surface-variant">
          <span className="font-semibold">{QUESTION_LABEL[project.kind]}:</span> {project.question}
        </p>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="self-start text-label-md text-primary hover:underline">
          Add your {QUESTION_LABEL[project.kind].toLowerCase().replace(" (word for word)", "")}
        </button>
      )}
    </header>
  );
}

type UploadStep = "idle" | "uploading" | "checking";

function UploadCard({ projectId, hasDrafts }: { projectId: string; hasDrafts: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>("idle");
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setStep("uploading");
    const r = await startUploadAction(projectId, file.name, file.size);
    if (!r.ok) {
      setError(r.error);
      setStep("idle");
      return;
    }
    const up = await createClient().storage.from(BUCKET).uploadToSignedUrl(r.data.path, r.data.token, file, { contentType: "application/pdf" });
    if (up.error) {
      setError("The upload didn't go through. Check your connection and try again.");
      setStep("idle");
      router.refresh();
      return;
    }
    setStep("checking");
    await runCheck(r.data.draftId).catch(() => null);
    setStep("idle");
    router.push(`/review/${projectId}?d=${r.data.draftId}`, { scroll: false });
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-md flex flex-col gap-sm">
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />
      <button
        type="button"
        disabled={step !== "idle"}
        onClick={() => input.current?.click()}
        className="inline-flex items-center justify-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {step === "idle" ? <FileUp size={16} aria-hidden="true" /> : <Spinner size={14} />}
        {step === "uploading" ? "Uploading…" : step === "checking" ? "Checking the file…" : hasDrafts ? "Upload a new draft" : "Upload a draft (PDF)"}
      </button>
      {error && (
        <p role="alert" className="text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

async function runCheck(draftId: string): Promise<boolean> {
  const res = await fetch(`/api/review/${draftId}/check`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  return res.ok;
}

function DraftPanel({
  projectId,
  draft,
  previous,
  criteria,
  allowance,
  fileUrl,
}: {
  projectId: string;
  draft: ReviewDraft;
  previous: ReviewDraft | null;
  criteria: CriteriaView;
  allowance: ReviewAllowance;
  fileUrl: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startDelete] = useTransition();

  async function startReview() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/review/${draft.id}/start`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "Couldn't start the review.");
    }
    setPending(false);
    router.refresh();
  }

  async function recheck() {
    setPending(true);
    const ok = await runCheck(draft.id);
    if (!ok) setError("The file couldn't be checked. Try uploading it again.");
    setPending(false);
    router.refresh();
  }

  const del = (
    <button
      type="button"
      className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-error"
      onClick={() => {
        if (!confirm(`Delete draft ${draft.version} and its review? It won't give the review back.`)) return;
        startDelete(async () => {
          await deleteDraftAction(projectId, draft.id);
          router.push(`/review/${projectId}`);
        });
      }}
    >
      <Trash2 size={14} aria-hidden="true" /> Delete draft
    </button>
  );

  if (draft.status === "done" && draft.report)
    return (
      <>
        <ReportView draft={draft} previousVersion={previous?.version ?? null} criteria={criteria} fileUrl={fileUrl} />
        <div className="flex justify-end print:hidden">{del}</div>
      </>
    );

  if (draft.status === "marking") return <MarkingPanel claimedAt={draft.claimedAt} />;

  if (draft.status === "uploading")
    return (
      <Panel>
        <p className="text-body-md text-on-surface">This upload didn&apos;t finish.</p>
        <div className="flex gap-md items-center">
          <button type="button" onClick={recheck} disabled={pending} className="inline-flex items-center gap-xs text-label-md text-primary font-semibold">
            {pending && <Spinner size={14} />} Check it again
          </button>
          {del}
        </div>
        {error && <p className="text-label-sm text-error">{error}</p>}
      </Panel>
    );

  const pc = draft.precheck;
  const canStart = !!pc?.readable && (allowance.remaining === null || allowance.remaining > 0);
  const words = criteria.limits.words;
  const overWords = words && pc ? pc.word_estimate > words : false;
  const pagesOff = pc && criteria.limits.pagesMax ? pc.page_count > criteria.limits.pagesMax || pc.page_count < (criteria.limits.pagesMin ?? 0) : false;

  return (
    <Panel>
      <h2 className="font-serif font-bold text-headline-md text-on-surface">
        Draft {draft.version} · {draft.status === "failed" ? "the review didn't finish" : "ready to review"}
      </h2>
      {draft.status === "failed" && (
        <p className="text-body-md text-on-surface-variant">
          {draft.error ?? "Something went wrong."} It didn&apos;t use one of your reviews. Try again.
        </p>
      )}
      {pc && (
        <ul className="flex flex-col gap-xs">
          <CheckRow ok={pc.readable} text={pc.readable ? "We can read it" : "We couldn't read this file. Export it as a PDF again (not a scan) and re-upload."} />
          <CheckRow ok={pc.matches_kind} text={pc.matches_kind ? `Looks like the right kind of work (${criteria.label})` : `This may not be the right file: ${pc.matches_reason}`} />
          {words ? (
            <CheckRow ok={!overWords} text={`About ${pc.word_estimate.toLocaleString("en-GB")} words (limit ${words.toLocaleString("en-GB")})${overWords ? ". Examiners stop reading at the limit." : ""}`} />
          ) : null}
          {criteria.limits.pagesMax ? <CheckRow ok={!pagesOff} text={`${pc.page_count} pages (${criteria.limits.pagesMin}–${criteria.limits.pagesMax})`} /> : <CheckRow ok text={`${pc.page_count} pages`} />}
          <CheckRow ok={!pc.has_identifying_info} text={pc.has_identifying_info ? `Your name or school appears (${pc.identifying_detail}). Remove it before you submit.` : "No name or school on it"} />
          {pc.issues.map((i) => (
            <CheckRow key={i} ok={false} text={i} />
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-md pt-xs">
        <button
          type="button"
          onClick={startReview}
          disabled={!canStart || pending}
          className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Spinner size={14} /> : draft.status === "failed" ? <RotateCcw size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
          {draft.status === "failed" ? "Try the review again" : "Review this draft"}
        </button>
        <span className="text-label-sm text-on-surface-variant">
          {allowance.remaining === null
            ? "Unlimited reviews"
            : allowance.remaining > 0
              ? `Uses 1 of your ${allowance.remaining} left this month. Takes 2–4 minutes.`
              : "You've used this month's 6 reviews."}
        </span>
        {del}
      </div>
      {error && (
        <p role="alert" className="text-label-sm text-error">
          {error}
        </p>
      )}
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">{children}</section>;
}

function CheckRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-sm text-body-md text-on-surface">
      {ok ? <Check size={18} className="text-primary shrink-0 mt-0.5" aria-label="OK" /> : <AlertTriangle size={18} className="text-error shrink-0 mt-0.5" aria-label="Check this" />}
      <span>{text}</span>
    </li>
  );
}

const STAGES = ["Reading your work", "Marking each criterion", "Checking the marks like a moderator", "Writing your feedback"];
/** Rough timings (seconds) from real reviews: most finish in 2 to 3 minutes. */
const STAGE_ENDS = [20, 90, 150];
const TYPICAL_SECONDS = 160;

/** Shown while a review runs: what's happening, roughly how long is left, and that leaving is fine. */
function MarkingPanel({ claimedAt }: { claimedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = claimedAt ? Math.max(0, (now - Date.parse(claimedAt)) / 1000) : 0;
  const stage = STAGE_ENDS.findIndex((end) => secs < end);
  const current = stage === -1 ? STAGES.length - 1 : stage;
  const progress = Math.min(0.95, secs / TYPICAL_SECONDS);
  const left = Math.max(0, Math.ceil((TYPICAL_SECONDS - secs) / 60));

  return (
    <section aria-live="polite" className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
      <div className="flex flex-col gap-xs">
        <p className="flex items-center gap-sm text-label-md font-semibold text-primary">
          <Spinner size={16} /> Reviewing
        </p>
        <h2 className="font-serif font-bold text-headline-lg text-on-surface">Bro is reviewing your draft</h2>
        <p className="text-body-md text-on-surface-variant">
          {secs < TYPICAL_SECONDS ? `About ${left} minute${left === 1 ? "" : "s"} left.` : "Almost there. Longer pieces take a little more time."}
        </p>
      </div>

      <div className="h-2 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
        <div className="h-full bg-primary rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <ol className="flex flex-col gap-sm">
        {STAGES.map((st, i) => (
          <li key={st} className={`flex items-center gap-sm text-body-md ${i <= current ? "text-on-surface" : "text-on-surface-variant opacity-60"}`}>
            {i < current ? <Check size={16} className="text-primary" aria-hidden="true" /> : i === current ? <Spinner size={14} /> : <span className="w-4" />}
            {st}
          </li>
        ))}
      </ol>

      <div className="rounded-xl bg-surface-container-low p-md flex flex-col gap-sm">
        <p className="text-body-md font-semibold text-on-surface">You don&apos;t need to wait here</p>
        <p className="text-body-md text-on-surface-variant">
          The review carries on if you close this page or your laptop. Come back any time: it will be waiting in this project, under Coursework review.
        </p>
        <div className="flex flex-wrap gap-sm pt-xs">
          <Link href="/review" className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary">
            <ArrowLeft size={14} aria-hidden="true" /> All projects
          </Link>
          <Link href="/practice" className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary">
            Practise while you wait
          </Link>
        </div>
      </div>
    </section>
  );
}

/** SL/HL for an IA project: filled in from their subjects, changeable here. Used for the next review. */
function LevelSwitch({ projectId, level }: { projectId: string; level: ReviewLevel }) {
  const router = useRouter();
  const [value, setValue] = useState<ReviewLevel>(level);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-sm">
      <span className="text-label-md font-semibold text-on-surface">Level</span>
      <Segmented
        label="Level"
        size="sm"
        value={value}
        onChange={(v) => {
          setValue(v);
          start(async () => {
            const r = await setLevelAction(projectId, v);
            if (!r.ok) setValue(level);
            router.refresh();
          });
        }}
        options={[
          { value: "SL", label: "SL" },
          { value: "HL", label: "HL" },
        ]}
      />
      {pending && <Spinner size={12} />}
    </div>
  );
}

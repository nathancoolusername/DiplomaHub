"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, FileUp, Upload, X } from "lucide-react";
import {
  importDeadlineBank,
  previewDeadlineImport,
  type DeadlineImportResult,
  type DeadlinePreview,
} from "@/app/lib/actions/admin-deadline";
import type { BankFile } from "@/lib/deadline/bank";

const BTN = "inline-flex items-center gap-xs rounded-lg px-md py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer";
const CARD = "rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex flex-col gap-md";

/**
 * Loads prompts in bulk from JSON files (the content/deadline format): upload
 * → see exactly what would change → import. Day to day the bank is edited
 * in the editor above; this is for the first load or a big batch of new prompts.
 */
export function DeadlineBank() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<BankFile[] | null>(null);
  const [readErrors, setReadErrors] = useState<string[]>([]);
  const [retire, setRetire] = useState(false);
  const [preview, setPreview] = useState<DeadlinePreview | null>(null);
  const [result, setResult] = useState<DeadlineImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, start] = useTransition();

  function runPreview(next: BankFile[], retireMissing: boolean) {
    setPreview(null);
    setResult(null);
    setError(null);
    start(async () => {
      const r = await previewDeadlineImport(next, retireMissing);
      if (r.success) setPreview(r.data);
      else setError(r.error);
    });
  }

  async function readFiles(list: FileList | null) {
    if (!list?.length) return;
    const read: BankFile[] = [];
    const errs: string[] = [];
    for (const f of [...list].filter((f) => f.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name))) {
      try {
        const prompts = JSON.parse(await f.text());
        if (Array.isArray(prompts)) read.push({ file: f.name, prompts });
        else errs.push(`${f.name}: not a list of prompts (skipped)`);
      } catch {
        errs.push(`${f.name}: not valid JSON (skipped)`);
      }
    }
    if (!read.length && !errs.length) errs.push("No .json files in that selection.");
    setReadErrors(errs);
    setFiles(read.length ? read : null);
    if (read.length) runPreview(read, retire);
    else setPreview(null);
  }

  function runImport() {
    if (!files) return;
    setError(null);
    start(async () => {
      const r = await importDeadlineBank(files, retire);
      if (r.success) {
        setResult(r.data);
        setPreview(null);
        router.refresh();
      } else setError(r.error);
    });
  }

  const d = preview?.diff;
  const nothingToDo = d && !d.touched.length && !d.retired.length;
  const promptCount = files?.reduce((n, f) => n + f.prompts.length, 0) ?? 0;

  return (
    <section className={CARD} aria-labelledby="dl-bank">
      <div className="flex flex-col gap-xs">
        <h3 id="dl-bank" className="font-serif font-bold text-headline-sm text-on-surface">Load prompts from files</h3>
        <p className="text-body-md text-on-surface-variant max-w-160">
          For the first load, or a big batch of new prompts in the bank’s JSON format. You’ll see what changes before anything is saved;
          prompts and answers already here keep their stats.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void readFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed p-lg text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-outline-variant"
        }`}
      >
        <FileUp size={28} className="text-on-surface-variant" aria-hidden="true" />
        <p className="text-body-md text-on-surface">
          Drop the bank’s <strong>.json</strong> files here, or{" "}
          <button type="button" onClick={() => input.current?.click()} className="font-semibold text-primary underline cursor-pointer">
            choose files
          </button>
        </p>
        <p className="text-label-md text-on-surface-variant">Answers you added or changed in the editor are replaced by what’s in the files.</p>
        <input ref={input} type="file" accept=".json,application/json" multiple className="sr-only" onChange={(e) => { void readFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {readErrors.map((e) => (
        <p key={e} className="text-label-md text-error flex items-center gap-xs"><AlertTriangle size={14} aria-hidden="true" />{e}</p>
      ))}

      {files && (
        <div className="flex flex-col gap-md">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-body-md text-on-surface">
              <strong>{files.length}</strong> file{files.length === 1 ? "" : "s"}, <strong>{promptCount}</strong> prompts
              <span className="text-on-surface-variant"> · {files.map((f) => f.file).join(", ")}</span>
            </p>
            <label className="inline-flex items-center gap-xs text-label-md text-on-surface-variant cursor-pointer">
              <input type="checkbox" checked={retire} onChange={(e) => { setRetire(e.target.checked); runPreview(files, e.target.checked); }} />
              Also switch off prompts that aren’t in these files
            </label>
          </div>

          {pending && !preview && <p className="text-body-md text-on-surface-variant">Comparing with the database…</p>}

          {preview && preview.problems.length > 0 && (
            <div className="rounded-xl bg-error-container text-on-error-container p-md flex flex-col gap-xs">
              <p className="font-semibold">Fix these in the files first ({preview.problems.length}):</p>
              <ul className="list-disc pl-lg text-body-md">{preview.problems.slice(0, 20).map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}

          {d && (
            <div className="flex flex-col gap-md">
              {nothingToDo ? (
                <p className="text-body-md text-on-surface inline-flex items-center gap-xs"><Check size={16} className="text-primary" aria-hidden="true" />The game already has exactly these files.</p>
              ) : (
                <>
                  <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-sm">
                    {[
                      ["New prompts", d.newPrompts.length],
                      ["Changed prompts", d.changedPrompts.length],
                      ["Answers added", d.added],
                      ["Answers changed", d.changed],
                      ["Answers removed", d.removed],
                      ["Prompts switched off", d.retired.length],
                    ].map(([label, n]) => (
                      <li key={label} className="rounded-xl border border-outline-variant p-sm">
                        <p className="text-label-md text-on-surface-variant">{label}</p>
                        <p className="font-serif font-bold text-headline-md tabular-nums">{n}</p>
                      </li>
                    ))}
                  </ul>
                  {d.removed > 0 && (
                    <p className="text-label-md text-on-surface-variant flex items-start gap-xs">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      Removed answers stop counting in games (their past plays are kept). Answers added in the editor count as removed if the files don’t have them.
                    </p>
                  )}
                  {d.retired.length > 0 && (
                    <p className="text-label-md text-on-surface-variant">Switched off: {d.retired.join(", ")}</p>
                  )}
                  {d.lines.length > 0 && (
                    <details className="rounded-xl border border-outline-variant">
                      <summary className="cursor-pointer px-md py-sm text-label-md font-semibold">Answer changes by prompt ({d.lines.length})</summary>
                      <ul className="flex flex-col divide-y divide-outline-variant max-h-96 overflow-y-auto">
                        {d.lines.map((l) => (
                          <li key={l.slug} className="px-md py-sm text-body-md flex flex-col gap-xs">
                            <span className="font-semibold">{l.slug}</span>
                            {l.added.length > 0 && <span className="text-primary">+ {l.added.join(", ")}</span>}
                            {l.changed.length > 0 && <span className="text-on-surface-variant">~ {l.changed.join(", ")}</span>}
                            {l.removed.length > 0 && <span className="text-error">− {l.removed.join(", ")}</span>}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex flex-wrap items-center gap-sm">
                    <button type="button" onClick={runImport} disabled={pending} className={`${BTN} bg-primary text-on-primary`}>
                      <Upload size={16} aria-hidden="true" />
                      {pending ? "Importing…" : `Import ${d.touched.length} prompt${d.touched.length === 1 ? "" : "s"}`}
                    </button>
                    <button type="button" onClick={() => { setFiles(null); setPreview(null); }} disabled={pending} className={`${BTN} text-on-surface-variant`}>
                      <X size={16} aria-hidden="true" />
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-primary/10 p-md flex flex-col gap-xs">
          <p className="font-semibold text-on-surface inline-flex items-center gap-xs">
            <Check size={16} className="text-primary" aria-hidden="true" />
            Imported {result.sent} prompts: {result.prompts_new} new, {result.prompts_changed} changed; answers +{result.answers_added} ~{result.answers_changed} −{result.answers_removed}
            {result.prompts_retired ? `; ${result.prompts_retired} switched off` : ""}.
          </p>
          {result.warnings.length > 0 && (
            <>
              <p className="text-body-md text-on-surface-variant">Worth fixing in the files (the game’s own rules found these):</p>
              <ul className="list-disc pl-lg text-body-md">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </>
          )}
        </div>
      )}
      {error && <p className="text-body-md text-error flex items-center gap-xs"><AlertTriangle size={16} aria-hidden="true" />{error}</p>}
    </section>
  );
}

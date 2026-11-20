"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, ArrowRightToLine, Check, Plus, Power, Search, Trash2, Undo2 } from "lucide-react";
import {
  saveDeadlinePrompt,
  setDeadlinePromptActive,
  tryDeadlineAnswer,
  type DeadlineTry,
} from "@/app/lib/actions/admin-deadline";
import type { Answer, DbPrompt } from "@/lib/deadline/bank";
import { TIERS } from "@/lib/deadline/config";

const BTN = "inline-flex items-center gap-xs rounded-lg px-md py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer";
const INPUT = "border border-outline-variant rounded-lg px-sm py-xs w-full bg-surface-container-lowest text-body-md text-on-surface";
const CELL_INPUT = "w-full rounded-md border border-transparent bg-transparent px-xs py-0.5 text-body-md text-on-surface hover:border-outline-variant focus:border-outline-variant focus:bg-surface-container-lowest outline-none";

type Filter = "all" | "todo" | "off";
const VERDICT: Record<DeadlineTry["result"], { ok: boolean; label: string }> = {
  exact: { ok: true, label: "accepted" },
  typo: { ok: true, label: "accepted as a typo of" },
  sound: { ok: true, label: "accepted as sounding like" },
  prefix: { ok: true, label: "accepted as the start of" },
  wrong: { ok: false, label: "wrong" },
  ambiguous: { ok: false, label: "rejected: it's equally close to two answers" },
  denied: { ok: false, label: "rejected by the deny list" },
};

const reviewed = (p: DbPrompt) => p.extra?.reviewed === true;
const splitAliases = (s: string) => s.split(";").map((x) => x.trim()).filter(Boolean);
const blank = (): DbPrompt => ({ slug: "", subject: "", text: "", fuzzy: true, deny: [], active: true, file: null, position: null, extra: {}, answers: [] });

/**
 * Admin → Deadline → prompts: the bank, edited in place. Each save goes
 * through the same checks as an import and keeps answer stats. The try box
 * runs the game's own matcher on the saved prompt.
 */
export function DeadlineEditor({ initial }: { initial: DbPrompt[] }) {
  const [prompts, setPrompts] = useState(initial);
  const [slug, setSlug] = useState<string | null>(initial[0]?.slug ?? null);
  const [draft, setDraft] = useState<DbPrompt | null>(initial[0] ? structuredClone(initial[0]) : null);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string; warnings?: string[] } | null>(null);
  const [pending, start] = useTransition();

  // A bulk upload refreshes the page: take the new bank (React's "adjust state on prop change").
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setPrompts(initial);
  }
  const saved = prompts.find((p) => p.slug === slug) ?? null;
  const dirty = isNew || (!!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved));

  const subjects = useMemo(() => [...new Set(prompts.map((p) => p.subject))].sort(), [prompts]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((p) =>
      (filter === "all" ? true : filter === "off" ? !p.active : p.active && !reviewed(p))
      && (!q || p.slug.includes(q) || p.text.toLowerCase().includes(q) || p.answers.some((a) => a[0].toLowerCase().includes(q))));
  }, [prompts, query, filter]);
  const groups = useMemo(() => {
    const m = new Map<string, DbPrompt[]>();
    for (const p of visible) m.set(p.subject, [...(m.get(p.subject) ?? []), p]);
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);
  const done = prompts.filter((p) => p.active && reviewed(p)).length;
  const on = prompts.filter((p) => p.active).length;

  function open(next: DbPrompt) {
    if (dirty && !confirm("Leave without saving your changes?")) return;
    setSlug(next.slug);
    setDraft(structuredClone(next));
    setIsNew(false);
    setMsg(null);
  }
  function startNew() {
    if (dirty && !confirm("Leave without saving your changes?")) return;
    setSlug(null);
    setDraft(blank());
    setIsNew(true);
    setMsg(null);
  }
  const edit = (fn: (d: DbPrompt) => void) => setDraft((d) => { if (!d) return d; const n = structuredClone(d); fn(n); return n; });
  const editAnswer = (i: number, fn: (a: Answer) => void) => edit((d) => fn(d.answers[i]));

  function save(opts: { markReviewed?: boolean; next?: boolean } = {}) {
    if (!draft) return;
    const toSave = structuredClone(draft);
    if (opts.markReviewed) toSave.extra = { ...toSave.extra, reviewed: true };
    start(async () => {
      const r = await saveDeadlinePrompt(toSave);
      if (!r.success) return setMsg({ ok: false, text: r.error });
      const p = r.data.prompt;
      setPrompts((ps) => (ps.some((x) => x.slug === p.slug) ? ps.map((x) => (x.slug === p.slug ? p : x)) : [...ps, p]));
      setIsNew(false);
      setMsg({ ok: true, text: "Saved.", warnings: r.data.warnings });
      if (opts.next) {
        const order = groups.flatMap(([, ps]) => ps);
        const after = order.slice(order.findIndex((x) => x.slug === p.slug) + 1).find((x) => x.active && !reviewed(x));
        if (after && !r.data.warnings.length) { setSlug(after.slug); setDraft(structuredClone(after)); setMsg(null); return; }
      }
      setSlug(p.slug);
      setDraft(structuredClone(p));
    });
  }

  function toggleActive() {
    if (!saved) return;
    start(async () => {
      const r = await setDeadlinePromptActive(saved.slug, !saved.active);
      if (!r.success) return setMsg({ ok: false, text: r.error });
      const flip = (p: DbPrompt) => (p.slug === saved.slug ? { ...p, active: !p.active } : p);
      setPrompts((ps) => ps.map(flip));
      setDraft((d) => (d ? flip(d) : d));
      setMsg({ ok: true, text: saved.active ? "Switched off: it won't come up in new games." : "Switched on." });
    });
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest grid lg:grid-cols-[300px_1fr] min-h-[600px]" aria-label="Prompts">
      {/* ── The list ── */}
      <div className="border-b lg:border-b-0 lg:border-r border-outline-variant flex flex-col min-h-0">
        <div className="p-md flex flex-col gap-sm border-b border-outline-variant">
          <div className="flex items-center justify-between gap-sm">
            <p className="text-label-md text-on-surface-variant"><strong className="text-on-surface">{done}</strong> of {on} reviewed</p>
            <button type="button" onClick={startNew} className={`${BTN} px-sm text-primary`}><Plus size={14} aria-hidden="true" />New prompt</button>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden" aria-hidden="true">
            <div className="h-full bg-primary" style={{ width: `${on ? (100 * done) / on : 0}%` }} />
          </div>
          <label className="relative">
            <span className="sr-only">Search prompts and answers</span>
            <Search size={14} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts and answers" className={`${INPUT} pl-xl`} />
          </label>
          <div className="flex gap-xs" role="group" aria-label="Show">
            {(["all", "todo", "off"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
                className={`rounded-full px-sm py-0.5 text-label-md font-semibold ${filter === f ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}>
                {f === "all" ? "All" : f === "todo" ? "To review" : "Switched off"}
              </button>
            ))}
          </div>
        </div>
        <ul className="overflow-y-auto max-h-72 lg:max-h-[calc(100vh-260px)] py-xs">
          {groups.map(([subject, ps]) => (
            <li key={subject}>
              <p className="px-md pt-sm pb-xs text-label-sm uppercase tracking-wide text-on-surface-variant">{subject}</p>
              <ul>
                {ps.map((p) => (
                  <li key={p.slug}>
                    <button type="button" onClick={() => open(p)} aria-current={p.slug === slug ? "true" : undefined}
                      className={`w-full text-left px-md py-xs flex items-center gap-xs text-body-md ${p.slug === slug ? "bg-primary/10" : "hover:bg-surface-container"} ${p.active ? "text-on-surface" : "text-on-surface-variant line-through"}`}>
                      <span className={`shrink-0 w-4 ${reviewed(p) ? "text-primary" : "text-transparent"}`} aria-label={reviewed(p) ? "reviewed" : undefined}><Check size={14} /></span>
                      <span className="truncate">{p.text}</span>
                      <span className="ml-auto text-label-sm text-on-surface-variant tabular-nums">{p.answers.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {!groups.length && <li className="px-md py-sm text-body-md text-on-surface-variant">Nothing matches.</li>}
        </ul>
      </div>

      {/* ── The prompt ── */}
      {draft ? (
        <PromptForm
          key={isNew ? "new" : slug}
          draft={draft}
          isNew={isNew}
          dirty={dirty}
          pending={pending}
          subjects={subjects}
          savedActive={saved?.active ?? true}
          msg={msg}
          edit={edit}
          editAnswer={editAnswer}
          onSave={save}
          onRevert={() => { if (saved) setDraft(structuredClone(saved)); else startNew(); setMsg(null); }}
          onToggleActive={toggleActive}
        />
      ) : (
        <div className="p-lg text-body-md text-on-surface-variant">The bank is empty. Upload the files below, or start a new prompt.</div>
      )}
    </section>
  );
}

function PromptForm({
  draft, isNew, dirty, pending, subjects, savedActive, msg, edit, editAnswer, onSave, onRevert, onToggleActive,
}: {
  draft: DbPrompt;
  isNew: boolean;
  dirty: boolean;
  pending: boolean;
  subjects: string[];
  savedActive: boolean;
  msg: { ok: boolean; text: string; warnings?: string[] } | null;
  edit: (fn: (d: DbPrompt) => void) => void;
  editAnswer: (i: number, fn: (a: Answer) => void) => void;
  onSave: (o?: { markReviewed?: boolean; next?: boolean }) => void;
  onRevert: () => void;
  onToggleActive: () => void;
}) {
  const [newAnswer, setNewAnswer] = useState("");
  const [newRarity, setNewRarity] = useState(4);
  const [newDeny, setNewDeny] = useState("");
  const [tryText, setTryText] = useState("");
  const [verdict, setVerdict] = useState<(DeadlineTry & { typed: string }) | { error: string } | null>(null);
  const [trying, startTry] = useTransition();
  const tryRef = useRef<HTMLInputElement>(null);

  function addAnswer(text: string, rarity: number) {
    const t = text.trim();
    if (!t) return;
    if (draft.answers.some((a) => a[0].toLowerCase() === t.toLowerCase())) return;
    edit((d) => { d.answers.push([t, rarity]); });
    setNewAnswer("");
  }
  function runTry(e: React.FormEvent) {
    e.preventDefault();
    const t = tryText.trim();
    if (!t || isNew) return;
    startTry(async () => {
      const r = await tryDeadlineAnswer(draft.slug, t);
      setVerdict(r.success ? { ...r.data, typed: t } : { error: r.error });
    });
  }
  const hit = verdict && "result" in verdict && verdict.answer;

  return (
    <div className="p-md md:p-lg flex flex-col gap-md min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-sm">
        <label className="flex flex-col gap-xs">
          <span className="sr-only">Prompt</span>
          <input value={draft.text} onChange={(e) => edit((d) => { d.text = e.target.value; })} placeholder="Name a…"
            className="font-serif font-bold text-headline-md text-on-surface bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none" />
        </label>
        <div className="flex flex-wrap items-center gap-md text-label-md text-on-surface-variant">
          <label className="inline-flex items-center gap-xs">
            Slug
            {isNew
              ? <input value={draft.slug} onChange={(e) => edit((d) => { d.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); })} placeholder="bio-organelle" className={`${INPUT} w-44`} />
              : <code className="text-on-surface">{draft.slug}</code>}
          </label>
          <label className="inline-flex items-center gap-xs">
            Subject
            <input list="dl-subjects" value={draft.subject} onChange={(e) => edit((d) => { d.subject = e.target.value.trim().toLowerCase(); })} className={`${INPUT} w-36`} />
            <datalist id="dl-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label className="inline-flex items-center gap-xs cursor-pointer" title="Off for prompts where a typo changes the meaning (numbers)">
            <input type="checkbox" checked={draft.fuzzy} onChange={(e) => edit((d) => { d.fuzzy = e.target.checked; })} />
            Accept typos
          </label>
          {!savedActive && <span className="rounded-full bg-error-container text-on-error-container px-sm">Switched off</span>}
          {draft.extra?.reviewed === true && <span className="rounded-full bg-primary/10 text-primary px-sm">Reviewed</span>}
          {typeof draft.extra?.note === "string" && <span className="italic">Note: {draft.extra.note}</span>}
        </div>
      </div>

      {/* Try it */}
      <form onSubmit={runTry} className="flex flex-col gap-xs rounded-xl bg-surface-container p-sm">
        <label className="flex items-center gap-sm">
          <span className="text-label-md font-semibold text-on-surface-variant shrink-0">Try an answer</span>
          <input ref={tryRef} value={tryText} onChange={(e) => { setTryText(e.target.value); setVerdict(null); }}
            placeholder={isNew ? "Save the prompt first" : dirty ? "Tests the saved version (save first to test your edits)" : "Type it like a student would, then Enter"}
            disabled={isNew} className={INPUT} />
        </label>
        {trying && <p className="text-label-md text-on-surface-variant">Checking…</p>}
        {verdict && "error" in verdict && <p className="text-label-md text-error">{verdict.error}</p>}
        {verdict && "result" in verdict && (
          <p className={`text-body-md flex flex-wrap items-center gap-sm ${VERDICT[verdict.result].ok ? "text-primary" : "text-error"}`}>
            <span>
              <strong>“{verdict.typed}”</strong> {VERDICT[verdict.result].ok ? "✓" : "✗"} {VERDICT[verdict.result].label}
              {verdict.answer && <> <strong>{verdict.answer}</strong></>}
            </span>
            {!VERDICT[verdict.result].ok && (
              <button type="button" onClick={() => { addAnswer(verdict.typed, newRarity); setVerdict(null); setTryText(""); }} className={`${BTN} border border-outline-variant text-on-surface`}>
                <Plus size={14} aria-hidden="true" />Add “{verdict.typed}” as an answer
              </button>
            )}
          </p>
        )}
      </form>

      {/* Deny list */}
      <div className="flex flex-wrap items-center gap-xs">
        <span className="text-label-md font-semibold text-on-surface-variant" title="Close to a real answer but wrong. Checked before typo tolerance.">Deny</span>
        {draft.deny.map((d, i) => (
          <span key={d} className="inline-flex items-center rounded-full border border-outline-variant pl-sm text-label-md">
            {d}
            <button type="button" aria-label={`Remove ${d} from the deny list`} onClick={() => edit((x) => { x.deny.splice(i, 1); })} className="px-xs text-on-surface-variant hover:text-error cursor-pointer">×</button>
          </span>
        ))}
        <input value={newDeny} onChange={(e) => setNewDeny(e.target.value)} placeholder="+ add"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const t = newDeny.trim();
            if (t && !draft.deny.includes(t)) edit((x) => { x.deny.push(t); });
            setNewDeny("");
          }}
          className="w-28 bg-transparent text-label-md outline-none border-b border-transparent focus:border-outline-variant" />
      </div>

      {/* Answers */}
      <div className="flex flex-wrap items-center gap-sm">
        <form onSubmit={(e) => { e.preventDefault(); addAnswer(newAnswer, newRarity); }} className="flex flex-wrap items-center gap-sm">
          <input value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder="Add an answer" className={`${INPUT} w-56`} />
          <Rarity value={newRarity} onChange={setNewRarity} />
          <button type="submit" className={`${BTN} border border-outline-variant text-on-surface`}><Plus size={14} aria-hidden="true" />Add</button>
        </form>
        <p className="ml-auto text-label-md text-on-surface-variant">{draft.answers.length} answers</p>
        <button type="button" onClick={() => edit((d) => { d.answers.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])); })} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer">Sort by rarity</button>
        <button type="button" onClick={() => edit((d) => { d.answers.sort((a, b) => a[0].localeCompare(b[0])); })} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer">A–Z</button>
      </div>
      <div className="overflow-x-auto -mx-md md:mx-0">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant">
              <th className="px-xs py-xs font-semibold w-[28%]">Answer</th>
              <th className="px-xs py-xs font-semibold">Other spellings (separate with ;)</th>
              <th className="px-xs py-xs font-semibold">Rarity</th>
              <th className="px-xs py-xs font-semibold" title="No typo tolerance for this answer">Exact</th>
              <th className="px-xs py-xs"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {draft.answers.map((a, i) => (
              <tr key={i} className={`border-b border-outline-variant/60 ${hit === a[0] ? "bg-primary/10" : ""}`}>
                <td className="px-xs py-0.5">
                  <input aria-label="Answer" value={a[0]} onChange={(e) => editAnswer(i, (x) => { x[0] = e.target.value; })} className={`${CELL_INPUT} font-semibold`} />
                </td>
                <td className="px-xs py-0.5">
                  <AliasInput value={a[2] ?? []} onChange={(v) => editAnswer(i, (x) => { x[2] = v; })} />
                </td>
                <td className="px-xs py-0.5"><Rarity value={a[1]} onChange={(r) => editAnswer(i, (x) => { x[1] = r; })} /></td>
                <td className="px-xs py-0.5">
                  <input type="checkbox" aria-label="Exact only" checked={a[3] === "x"} onChange={(e) => editAnswer(i, (x) => { x[2] = x[2] ?? []; x[3] = e.target.checked ? "x" : undefined; })} />
                </td>
                <td className="px-xs py-0.5 whitespace-nowrap text-right">
                  <button type="button" title="Wrong: move it to the deny list" aria-label={`Move ${a[0]} to the deny list`}
                    onClick={() => edit((d) => { d.answers.splice(i, 1); if (!d.deny.includes(a[0])) d.deny.push(a[0]); })}
                    className="p-xs text-on-surface-variant hover:text-error cursor-pointer"><ArrowRightToLine size={14} /></button>
                  <button type="button" title="Delete" aria-label={`Delete ${a[0]}`} onClick={() => edit((d) => { d.answers.splice(i, 1); })}
                    className="p-xs text-on-surface-variant hover:text-error cursor-pointer"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save */}
      <div className="sticky bottom-0 -mx-md md:-mx-lg px-md md:px-lg py-sm bg-surface-container-lowest/95 backdrop-blur border-t border-outline-variant flex flex-wrap items-center gap-sm">
        <button type="button" onClick={() => onSave({ markReviewed: true, next: true })} disabled={pending} className={`${BTN} bg-primary text-on-primary`}>
          <Check size={16} aria-hidden="true" />{pending ? "Saving…" : "Save, mark reviewed & next"}
        </button>
        <button type="button" onClick={() => onSave()} disabled={pending || !dirty} className={`${BTN} border border-outline-variant text-on-surface`}>Save</button>
        <button type="button" onClick={onRevert} disabled={pending || !dirty} className={`${BTN} text-on-surface-variant`}><Undo2 size={14} aria-hidden="true" />Undo changes</button>
        {!isNew && (
          <button type="button" onClick={onToggleActive} disabled={pending} className={`${BTN} ml-auto text-on-surface-variant`}>
            <Power size={14} aria-hidden="true" />{savedActive ? "Switch off" : "Switch on"}
          </button>
        )}
        {dirty && <span className="text-label-md text-on-surface-variant">Unsaved changes</span>}
      </div>
      {msg && (
        <div className={`text-body-md flex flex-col gap-xs ${msg.ok ? "text-primary" : "text-error"}`} role="status">
          <p className="inline-flex items-center gap-xs">{msg.ok ? <Check size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}{msg.text}</p>
          {msg.warnings && msg.warnings.length > 0 && (
            <ul className="list-disc pl-lg text-on-surface-variant">{msg.warnings.map((w) => <li key={w}>{w.replace(/^[^:]+: /, "")}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Other spellings, edited as text ("a; b; c") and committed on blur. */
function AliasInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join("; "));
  const joined = value.join("; ");
  const [seen, setSeen] = useState(joined);
  if (seen !== joined) {
    setSeen(joined);
    setText(joined);
  }
  return (
    <input aria-label="Other spellings" value={text} onChange={(e) => setText(e.target.value)}
      onBlur={() => { const v = splitAliases(text); if (JSON.stringify(v) !== JSON.stringify(value)) onChange(v); }}
      className={`${CELL_INPUT} text-on-surface-variant`} />
  );
}

/** 1–7, coloured like the game's tiers. */
function Rarity({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" role="radiogroup" aria-label="Rarity">
      {[1, 2, 3, 4, 5, 6, 7].map((r) => (
        <button key={r} type="button" role="radio" aria-checked={value === r} aria-label={`${r} (${TIERS[r].label})`} onClick={() => onChange(r)}
          style={value === r ? { background: TIERS[r].color, color: "#fff", borderColor: "transparent" } : undefined}
          className="w-6 h-6 rounded-md border border-outline-variant text-label-sm text-on-surface-variant tabular-nums cursor-pointer">
          {r}
        </button>
      ))}
    </span>
  );
}

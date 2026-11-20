"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, EyeOff, Flag, Plus, Users } from "lucide-react";
import { resolveMissingAnswer, resolveTypoAccept, type MissingFix } from "@/app/lib/actions/admin-deadline";
import type { MissingGroup, ReviewPrompt, TypoGroup } from "@/app/lib/admin-deadline-stats";
import { TIERS } from "@/lib/deadline/config";

const BTN = "inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer";
const INPUT = "border border-outline-variant rounded-lg px-sm py-xs bg-surface-container-lowest text-body-md text-on-surface";
const MATCH: Record<string, string> = { typo: "as a typo of", sound: "as sounding like", prefix: "as the first word of" };
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  return m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

/**
 * Admin → Deadline → Missing answers. Per prompt: what players typed that was
 * rejected (flagged "That's right!" first), with one-tap fixes; and answers
 * the game accepted only as a typo, sound-alike or first word.
 */
export function DeadlineReview({ prompts }: { prompts: ReviewPrompt[] }) {
  const [view, setView] = useState<"missing" | "typos">("missing");
  const missing = prompts.reduce((n, p) => n + p.missing.length, 0);
  const typos = prompts.reduce((n, p) => n + p.typos.length, 0);
  const shown = prompts.filter((p) => (view === "missing" ? p.missing.length : p.typos.length));
  return (
    <div className="flex flex-col gap-md">
      <div className="inline-flex self-start rounded-full border border-outline-variant bg-surface-container-lowest p-0.5" role="group" aria-label="Show">
        {([["missing", `Rejected answers (${missing})`], ["typos", `Typo accepts (${typos})`]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setView(k)} aria-pressed={view === k}
            className={`rounded-full px-md py-1 text-label-md font-semibold cursor-pointer ${view === k ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}>{label}</button>
        ))}
      </div>
      <p className="text-body-md text-on-surface-variant max-w-[48rem]">
        {view === "missing"
          ? "What players typed that the game rejected, grouped. Flagged ones (“That's right!”) and ones typed by several players come first. Adding one is live for the next prompt that comes up."
          : "Answers the game accepted only as a typo, a sound-alike or the first word of a longer answer. Keep them as proper spellings, deny them, or mark them fine."}
      </p>
      {shown.length === 0 && (
        <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
          {view === "missing" ? "Nothing waiting. Rejected answers show up here after games." : "No typo accepts to look at."}
        </p>
      )}
      {shown.map((p) => (
        <section key={p.slug} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-md flex flex-col gap-sm">
          <h3 className="font-serif font-bold text-headline-sm text-on-surface">
            {p.text} <span className="font-sans text-label-sm font-normal text-on-surface-variant">{p.slug}{!p.active && " · switched off"}</span>
          </h3>
          <ul className="flex flex-col divide-y divide-outline-variant">
            {view === "missing"
              ? p.missing.map((m) => <MissingRow key={m.norm} slug={p.slug} answers={p.answers} m={m} />)
              : p.typos.map((t) => <TypoRow key={`${t.key}|${t.answer}`} slug={p.slug} t={t} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function useFix() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ success: true; data: { warnings: string[] } } | { success: false; error: string }>, done: string) =>
    start(async () => {
      const r = await fn();
      if (!r.success) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: r.data.warnings.length ? `${done} Heads up: ${r.data.warnings.map((w) => w.replace(/^[^:]+: /, "")).join("; ")}` : done });
      router.refresh();
    });
  return { pending, msg, run };
}

function MissingRow({ slug, answers, m }: { slug: string; answers: string[]; m: MissingGroup }) {
  const [text, setText] = useState(m.raw);
  const [rarity, setRarity] = useState(5);
  const [alias, setAlias] = useState(m.closest[0] ?? "");
  const { pending, msg, run } = useFix();
  const fix = (f: MissingFix, done: string) => run(() => resolveMissingAnswer(slug, m.norm, f), done);
  return (
    <li className="py-sm flex flex-col gap-xs">
      <div className="flex flex-wrap items-baseline gap-x-md gap-y-xs">
        <span className="font-semibold text-body-lg text-on-surface">“{m.raw}”</span>
        <span className="text-label-md text-on-surface-variant inline-flex items-center gap-sm">
          {m.appealed > 0 && <span className="inline-flex items-center gap-0.5 rounded-full bg-error text-on-error px-sm font-semibold"><Flag size={11} aria-hidden="true" />flagged {m.appealed}×</span>}
          <span className="inline-flex items-center gap-0.5"><Users size={12} aria-hidden="true" />{m.players} player{m.players === 1 ? "" : "s"}</span>
          <span>{m.count}× · {ago(m.lastAt)}</span>
          {m.reasons.includes("ambiguous") && <span>too close to two answers</span>}
          {m.reasons.includes("denied") && <span>on the deny list</span>}
        </span>
        {m.closest.length > 0 && <span className="text-label-md text-on-surface-variant">nearest: {m.closest.join(", ")}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-xs">
        <input aria-label="Answer text" value={text} onChange={(e) => setText(e.target.value)} className={`${INPUT} w-52`} />
        <span className="inline-flex gap-0.5" role="radiogroup" aria-label="Rarity for a new answer">
          {[1, 2, 3, 4, 5, 6, 7].map((r) => (
            <button key={r} type="button" role="radio" aria-checked={rarity === r} onClick={() => setRarity(r)}
              style={rarity === r ? { background: TIERS[r].color, color: "#fff", borderColor: "transparent" } : undefined}
              className="w-6 h-6 rounded-md border border-outline-variant text-label-sm text-on-surface-variant cursor-pointer">{r}</button>
          ))}
        </span>
        <button type="button" disabled={pending} onClick={() => fix({ kind: "answer", text, rarity }, `Added “${text}” (+${rarity}).`)} className={`${BTN} bg-primary text-on-primary`}>
          <Plus size={14} aria-hidden="true" />New answer
        </button>
        <span className="text-label-md text-on-surface-variant">or a spelling of</span>
        <select aria-label="Which answer it's a spelling of" value={alias} onChange={(e) => setAlias(e.target.value)} className={`${INPUT} max-w-48`}>
          {m.closest.length > 0 && <optgroup label="Nearest">{m.closest.map((a) => <option key={`n-${a}`} value={a}>{a}</option>)}</optgroup>}
          <optgroup label="All answers">{answers.map((a) => <option key={a} value={a}>{a}</option>)}</optgroup>
        </select>
        <button type="button" disabled={pending || !alias} onClick={() => fix({ kind: "alias", text, answer: alias }, `“${text}” now counts as ${alias}.`)} className={`${BTN} border border-outline-variant text-on-surface`}>
          <Check size={14} aria-hidden="true" />Add spelling
        </button>
        <button type="button" disabled={pending} onClick={() => fix({ kind: "deny", text }, `“${text}” is on the deny list.`)} className={`${BTN} text-on-surface-variant hover:text-error`}>
          <Ban size={14} aria-hidden="true" />Deny
        </button>
        <button type="button" disabled={pending} onClick={() => fix({ kind: "ignore" }, "Ignored.")} className={`${BTN} text-on-surface-variant`}>
          <EyeOff size={14} aria-hidden="true" />Ignore
        </button>
      </div>
      {msg && <p className={`text-label-md ${msg.ok ? "text-primary" : "text-error"}`} role="status">{msg.text}</p>}
    </li>
  );
}

function TypoRow({ slug, t }: { slug: string; t: TypoGroup }) {
  const { pending, msg, run } = useFix();
  return (
    <li className="py-sm flex flex-wrap items-center justify-between gap-sm">
      <span className="text-body-md text-on-surface">
        <strong>“{t.raw}”</strong> <span className="text-on-surface-variant">accepted {MATCH[t.matchedBy] ?? t.matchedBy}</span> <strong>{t.answer}</strong>
        <span className="text-label-md text-on-surface-variant"> · {t.count}× · {ago(t.lastAt)}</span>
      </span>
      <span className="flex flex-wrap gap-xs">
        <button type="button" disabled={pending} onClick={() => run(() => resolveTypoAccept(slug, t.raw, t.answer, "ok"), "Marked fine.")} className={`${BTN} border border-outline-variant text-on-surface`}>
          <Check size={14} aria-hidden="true" />Fine
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => resolveTypoAccept(slug, t.raw, t.answer, "alias"), `“${t.raw}” is now a spelling of ${t.answer}.`)} className={`${BTN} border border-outline-variant text-on-surface`}>
          <Plus size={14} aria-hidden="true" />Make it a spelling
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => resolveTypoAccept(slug, t.raw, t.answer, "deny"), `“${t.raw}” is denied from now on.`)} className={`${BTN} text-on-surface-variant hover:text-error`}>
          <Ban size={14} aria-hidden="true" />Wrong: deny
        </button>
      </span>
      {msg && <p className={`w-full text-label-md ${msg.ok ? "text-primary" : "text-error"}`} role="status">{msg.text}</p>}
    </li>
  );
}

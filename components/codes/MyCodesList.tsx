import Link from "next/link";
import { CalendarDays, CalendarRange, Crown, ListChecks } from "lucide-react";
import type { MyCode } from "@/lib/data";
import { codeLink, formatCode, type CodeType } from "@/lib/codes";
import { links } from "@/lib/practice/links";
import { CopyButton } from "./CopyButton";

const ICON: Record<CodeType, React.ReactNode> = {
  practice_set: <ListChecks size={16} aria-hidden="true" />,
  hub_item: <CalendarDays size={16} aria-hidden="true" />,
  hub_set: <CalendarRange size={16} aria-hidden="true" />,
  pro_trial: <Crown size={16} aria-hidden="true" />,
  school: <ListChecks size={16} aria-hidden="true" />,
};
const TYPE_LABEL: Record<CodeType, string> = { practice_set: "Set", hub_item: "Hub item", hub_set: "Hub set", pro_trial: "Pro trial", school: "School" };

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function uses(c: MyCode): string {
  return c.maxUses === null ? `${c.useCount}` : `${c.useCount} / ${c.maxUses}`;
}

function status(c: MyCode, now: number): { text: string; tone: string } | null {
  if (c.expiresAt && Date.parse(c.expiresAt) <= now) return { text: "Expired", tone: "bg-surface-container text-on-surface-variant" };
  if (c.maxUses !== null && c.useCount >= c.maxUses) return { text: "Used up", tone: "bg-surface-container text-on-surface-variant" };
  if (c.expiresAt) return { text: `Until ${shortDate(c.expiresAt)}`, tone: "bg-tertiary-container text-on-tertiary-container" };
  return null;
}

/** "My codes": everything the student has shared, with copy buttons and use counts. */
export function MyCodesList({ codes, origin, now }: { codes: MyCode[]; origin: string; now: number }) {
  if (codes.length === 0) {
    return (
      <div className="flex flex-col items-start gap-sm rounded-xl border border-dashed border-outline-variant px-lg py-lg">
        <p className="text-body-md text-on-surface">You haven&apos;t shared anything yet.</p>
        <p className="text-label-md text-on-surface-variant">
          Press <span className="font-semibold text-on-surface">Share</span> on a set (after you finish it, or in My sets) or on a Hub item, or{" "}
          <span className="font-semibold text-on-surface">Share a set</span> on the Hub for a whole plan. Its code shows up here.
        </p>
        <div className="flex flex-wrap gap-sm pt-xs">
          <Link href={links.practice()} className="text-label-md font-semibold text-primary hover:underline">
            Go to Practice
          </Link>
          <span className="text-outline" aria-hidden="true">·</span>
          <Link href={links.hub()} className="text-label-md font-semibold text-primary hover:underline">
            Go to the Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface-container-lowest">
      {codes.map((c) => {
        const st = status(c, now);
        const href = c.setId ? links.setQuestions(c.setId) : c.hubItemId ? links.hub() : null; // a Hub set is a copy: nothing to open
        const name = c.type === "pro_trial" ? (c.note ?? "DiplomaPro trial") : (c.title ?? "No longer available");
        return (
          <li key={c.code} className="flex flex-col sm:flex-row sm:items-center gap-sm px-md py-sm">
            <div className="flex items-center gap-sm flex-1 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                {ICON[c.type]}
              </span>
              <div className="flex flex-col min-w-0">
                {href ? (
                  <Link href={href} className="text-body-md font-semibold text-on-surface truncate hover:text-primary">
                    {name}
                  </Link>
                ) : (
                  <span className="text-body-md font-semibold text-on-surface truncate">{name}</span>
                )}
                <span className="text-label-sm text-on-surface-variant">
                  {TYPE_LABEL[c.type]}
                  {c.itemCount !== null ? ` · ${c.itemCount} item${c.itemCount === 1 ? "" : "s"}` : ""} · shared {shortDate(c.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-sm flex-wrap sm:flex-nowrap">
              {st && <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${st.tone}`}>{st.text}</span>}
              <span className="text-label-md text-on-surface-variant tabular-nums whitespace-nowrap" title="Times redeemed">
                {uses(c)} {c.useCount === 1 && c.maxUses === null ? "use" : "uses"}
              </span>
              <span className="inline-flex items-center gap-xs rounded-lg bg-surface-container pl-sm pr-xs py-xs">
                <span className="font-mono text-label-md font-bold tracking-widest text-on-surface">{formatCode(c.code)}</span>
                <CopyButton text={c.code} iconOnly label={`Copy code ${c.code}`} className="p-xs rounded-md text-on-surface-variant hover:text-primary cursor-pointer" />
              </span>
              <CopyButton
                text={codeLink(origin, c.code)}
                label="Link"
                copiedLabel="Copied"
                className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-sm py-xs text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

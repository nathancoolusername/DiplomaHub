"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import { codeLink, formatCode } from "@/lib/codes";
import { links } from "@/lib/practice/links";
import { Dialog } from "@/components/shared/Dialog";
import { CopyButton } from "./CopyButton";

type Shareable = "practice_set" | "hub_item" | "hub_set";
const WHAT: Record<Shareable, { title: string; gets: string }> = {
  practice_set: { title: "Share this set", gets: "their own copy in My sets" },
  hub_item: { title: "Share this Hub item", gets: "it on their own Hub" },
  hub_set: { title: "Your set is ready to share", gets: "the whole plan on their own Hub (your dates, or starting on a day they pick)" },
};

/** The code and link for a set or Hub item, with copy buttons and how often it's been used. */
export function ShareCodeDialog({
  type,
  code,
  title,
  useCount,
  onClose,
  setId,
}: {
  /** A practice set: also offer its printable PDF (the code is printed on it). */
  setId?: string;
  type: Shareable;
  code: string;
  title: string;
  useCount: number;
  onClose: () => void;
}) {
  // Only ever opened by a click, so this renders in the browser.
  const link = typeof window === "undefined" ? null : codeLink(window.location.origin, code);
  const what = WHAT[type];

  return (
    <Dialog title={what.title} onClose={onClose} width="max-w-110">
      <div className="flex flex-col gap-md">
        <p className="text-body-md text-on-surface-variant">
          Friends enter this code on the <span className="font-semibold text-on-surface">Codes</span> page, or open the link, to get {what.gets}: “{title}”.
        </p>
        <div className="self-center flex items-center gap-sm rounded-xl bg-surface-container px-lg py-md">
          <span className="font-mono text-headline-md font-bold tracking-[0.3em] text-on-surface" aria-label={`Code ${code.split("").join(" ")}`}>
            {formatCode(code)}
          </span>
          <CopyButton text={code} iconOnly label="Copy code" className="p-xs rounded-md text-on-surface-variant hover:text-primary cursor-pointer" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-sm">
          <CopyButton text={code} label="Copy code" copiedLabel="Code copied" />
          {link && <CopyButton text={link} label="Copy link" copiedLabel="Link copied" />}
          {type === "practice_set" && setId && (
            <a
              href={`${links.pdf(setId)}?print=1`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary"
            >
              <FileDown size={14} aria-hidden="true" /> PDF
            </a>
          )}
        </div>
        <p className="text-center text-label-md text-on-surface-variant tabular-nums">
          {useCount === 0 ? "Nobody has used it yet." : `Used ${useCount} ${useCount === 1 ? "time" : "times"}.`}{" "}
          <Link href={links.codes()} className="font-semibold text-primary hover:underline">
            All my codes
          </Link>
        </p>
      </div>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MessageCircle } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { locateQuote, type PdfRect, type TextRun } from "@/lib/review/locate";
import type { CommentKind, ReportComment } from "@/lib/review/report";

// The student's PDF, rendered with pdf.js, with each comment's quote
// highlighted on the page and the comment beside it in the margin (stacked
// under the page on narrow screens). Click a highlight or a comment to pair them.

/** `idx`: the comment's place in the report (what "Ask Bro" sends). */
export type IndexedComment = ReportComment & { idx: number };
type Numbered = IndexedComment & { n: number };
const NONE: Numbered[] = [];

const KIND: Record<CommentKind, { label: string; fill: string; line: string; chip: string }> = {
  strength: { label: "Works", fill: "rgba(34,197,94,0.22)", line: "rgb(22,163,74)", chip: "bg-primary-fixed text-on-primary-fixed" },
  issue: { label: "Fix", fill: "rgba(239,68,68,0.20)", line: "rgb(220,38,38)", chip: "bg-error-container text-on-error-container" },
  suggestion: { label: "Idea", fill: "rgba(234,179,8,0.26)", line: "rgb(202,138,4)", chip: "bg-surface-container-high text-on-surface" },
};

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m;
  });
  return pdfjsPromise;
}

export function AnnotatedDocument({
  fileUrl,
  comments,
  criterionName,
  onAsk,
}: {
  fileUrl: string;
  comments: IndexedComment[];
  criterionName: (id: string) => string;
  onAsk?: (c: IndexedComment) => void;
}) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    loadPdfjs()
      .then((pdfjs) => {
        // No WebAssembly decoders: the site's CSP doesn't allow them, and drafts don't need them.
        const t = pdfjs.getDocument({ url: fileUrl, useWasm: false });
        task = t;
        return t.promise;
      })
      .then((d) => {
        if (!cancelled) setDoc(d);
      })
      .catch((e) => {
        console.error("pdf load failed", e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [fileUrl]);

  const numbered: Numbered[] = useMemo(
    () => [...comments].sort((a, b) => a.page - b.page).map((c, i) => ({ ...c, n: i + 1 })),
    [comments],
  );

  const byPage = useMemo(() => {
    const m = new Map<number, Numbered[]>();
    if (!doc) return m;
    for (const c of numbered) {
      const p = Math.min(Math.max(c.page, 1), doc.numPages);
      m.set(p, [...(m.get(p) ?? []), c]);
    }
    return m;
  }, [numbered, doc]);

  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  // Which page is on screen: the last one whose top has passed the box's upper third.
  const onScroll = useCallback(() => {
    const box = scroller.current;
    if (!box) return;
    const line = box.getBoundingClientRect().top + box.clientHeight / 3;
    let current = 1;
    box.querySelectorAll<HTMLElement>("[data-page]").forEach((el) => {
      if (el.getBoundingClientRect().top <= line) current = Number(el.dataset.page);
    });
    setPage(current);
  }, []);

  /** Scrolls the box (not the whole site) so `el` sits a third of the way down. */
  const scrollToEl = useCallback((el: Element | null, offset = 0.3) => {
    const box = scroller.current;
    if (!box || !el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - box.clientHeight * offset;
    box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const goToPage = useCallback((p: number) => scrollToEl(scroller.current?.querySelector(`[data-page="${p}"]`) ?? null, 0), [scrollToEl]);

  const goToComment = useCallback(
    (n: number) => {
      const c = numbered.find((x) => x.n === n);
      if (!c) return;
      setActive(n);
      const box = scroller.current;
      const mark = box?.querySelector(`[data-comment="${n}"]`) ?? null;
      if (mark) scrollToEl(mark);
      else {
        // The page isn't drawn yet: go to it, then to the highlight once it appears.
        goToPage(c.page);
        setTimeout(() => {
          const later = scroller.current?.querySelector(`[data-comment="${n}"]`);
          if (later) scrollToEl(later);
        }, 700);
      }
    },
    [numbered, scrollToEl, goToPage],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!numbered.length) return;
      const next = active === null ? (dir === 1 ? (numbered.find((c) => c.page >= page)?.n ?? 1) : numbered.length) : ((active - 1 + dir + numbered.length) % numbered.length) + 1;
      goToComment(next);
    },
    [active, numbered, page, goToComment],
  );

  if (failed) return <p className="text-body-md text-on-surface-variant">Your draft couldn&apos;t be shown here. The comments are listed below.</p>;
  if (!doc)
    return (
      <p className="flex items-center gap-sm text-body-md text-on-surface-variant">
        <Spinner size={16} /> Opening your draft…
      </p>
    );

  const current = numbered.find((c) => c.n === active) ?? null;
  const btn = "inline-flex items-center justify-center rounded-lg border border-outline-variant h-8 min-w-8 px-xs text-on-surface hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex items-center gap-xs" role="group" aria-label="Pages">
          <button type="button" className={btn} onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronUp size={16} />
          </button>
          <label className="flex items-center gap-xs text-label-md text-on-surface-variant">
            Page
            <select
              value={page}
              onChange={(e) => goToPage(Number(e.target.value))}
              className="rounded-lg border border-outline-variant bg-surface px-xs h-8 text-label-md text-on-surface"
            >
              {Array.from({ length: doc.numPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                  {byPage.get(p)?.length ? ` · ${byPage.get(p)!.length} comment${byPage.get(p)!.length === 1 ? "" : "s"}` : ""}
                </option>
              ))}
            </select>
            of {doc.numPages}
          </label>
          <button type="button" className={btn} onClick={() => goToPage(page + 1)} disabled={page >= doc.numPages} aria-label="Next page">
            <ChevronDown size={16} />
          </button>
        </div>
        {numbered.length > 0 && (
          <div className="flex items-center gap-xs" role="group" aria-label="Comments">
            <button type="button" className={btn} onClick={() => step(-1)} aria-label="Previous comment">
              <ChevronLeft size={16} />
            </button>
            <span className="text-label-md text-on-surface-variant tabular-nums min-w-[96px] text-center" aria-live="polite">
              {active ? `Comment ${active} of ${numbered.length}` : `${numbered.length} comments`}
            </span>
            <button type="button" className={btn} onClick={() => step(1)} aria-label="Next comment">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* On narrow screens the margin is under each page, so show the comment you jumped to here. */}
      {current && (
        <div className="lg:hidden rounded-xl border p-sm flex flex-col gap-xs" style={{ borderColor: KIND[current.kind].line }}>
          <div className="flex items-center gap-xs">
            <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${KIND[current.kind].chip}`}>{KIND[current.kind].label}</span>
            <span className="text-label-sm text-on-surface-variant truncate">
              Page {current.page} · {criterionName(current.criterion_id)}
            </span>
          </div>
          <p className="text-label-md text-on-surface">{current.comment}</p>
          {onAsk && (
            <button type="button" onClick={() => onAsk(current)} className="self-start inline-flex items-center gap-xs text-label-sm font-semibold text-primary hover:underline">
              <MessageCircle size={12} aria-hidden="true" /> Ask Bro about this
            </button>
          )}
        </div>
      )}

      <div
        ref={scroller}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Your draft. Arrow keys left and right move between comments."
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            step(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
        className="h-[70vh] lg:h-[min(80vh,960px)] overflow-y-auto overscroll-contain rounded-xl bg-surface-container-low p-sm sm:p-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex flex-col gap-lg">
          {Array.from({ length: doc.numPages }, (_, i) => i + 1).map((p) => (
            <Page
              key={p}
              doc={doc}
              pageNumber={p}
              comments={byPage.get(p) ?? NONE}
              active={active}
              setActive={setActive}
              criterionName={criterionName}
              onAsk={onAsk}
            />
          ))}
        </div>
      </div>
      <p className="hidden lg:block text-label-sm text-on-surface-variant">Scroll inside the box. ← → jump between comments; click a highlight or a comment to pair them.</p>
    </div>
  );
}

type Anchor = { comment: Numbered; rects: PdfRect[] | null };

function Page({
  doc,
  pageNumber,
  comments,
  active,
  setActive,
  criterionName,
  onAsk,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  comments: Numbered[];
  active: number | null;
  setActive: (n: number | null) => void;
  criterionName: (id: string) => string;
  onAsk?: (c: IndexedComment) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null); // page size at scale 1
  const [visible, setVisible] = useState(pageNumber <= 2);
  const [anchors, setAnchors] = useState<Anchor[]>(() => comments.map((comment) => ({ comment, rects: null })));
  const [viewTransform, setViewTransform] = useState<number[] | null>(null);

  // Page size first (cheap), so the placeholder has the right height.
  useEffect(() => {
    let off = false;
    doc.getPage(pageNumber).then((page) => {
      const v = page.getViewport({ scale: 1 });
      if (!off) setSize({ w: v.width, h: v.height });
    });
    return () => {
      off = true;
    };
  }, [doc, pageNumber]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "800px" });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Find each comment's quote in this page's text.
  useEffect(() => {
    if (!comments.length) return;
    let off = false;
    doc
      .getPage(pageNumber)
      .then((page) => page.getTextContent())
      .then((tc) => {
        const runs = tc.items.filter((it): it is TextRun & (typeof tc.items)[number] => "str" in it) as unknown as TextRun[];
        if (!off) setAnchors(comments.map((comment) => ({ comment, rects: comment.quote ? locateQuote(runs, comment.quote) : null })));
      })
      .catch(() => null);
    return () => {
      off = true;
    };
  }, [doc, pageNumber, comments]);

  // Render the page when it's near the screen, at the column's width.
  useEffect(() => {
    if (!visible || !width || !canvasRef.current) return;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    let off = false;
    doc.getPage(pageNumber).then((page) => {
      if (off) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });
      const ratio = window.devicePixelRatio || 1;
      const canvas = canvasRef.current!;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      task = page.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
      task.promise.catch(() => null);
      setViewTransform(viewport.transform);
    });
    return () => {
      off = true;
      task?.cancel();
    };
  }, [doc, pageNumber, visible, width]);

  const scale = size && width ? width / size.w : 0;
  const height = size ? size.h * scale : width * 1.414;

  // PDF user space → CSS pixels on this page.
  const toCss = useCallback(
    ([x1, y1, x2, y2]: PdfRect) => {
      if (!viewTransform) return null;
      const [a, b, c, d, e, f] = viewTransform;
      const pt = (x: number, y: number) => [a * x + c * y + e, b * x + d * y + f];
      const [px1, py1] = pt(x1, y1);
      const [px2, py2] = pt(x2, y2);
      return { left: Math.min(px1, px2), top: Math.min(py1, py2), width: Math.abs(px2 - px1), height: Math.abs(py2 - py1) };
    },
    [viewTransform],
  );

  const placed = anchors.map((a) => {
    const boxes = (a.rects ?? []).map(toCss).filter((b): b is NonNullable<typeof b> => !!b);
    return { ...a, boxes, top: boxes.length ? Math.min(...boxes.map((b) => b.top)) : 0 };
  });

  return (
    <section data-page={pageNumber} aria-label={`Page ${pageNumber}`} className="grid gap-md lg:grid-cols-[minmax(0,1fr)_280px]">
      <div ref={wrap} className="relative min-w-0">
        <div className="relative rounded-lg overflow-hidden shadow-sm border border-outline-variant bg-white" style={{ height }}>
          <canvas ref={canvasRef} className="block" aria-hidden="true" />
          {placed.flatMap((a) =>
            a.boxes.map((b, i) => (
              <button
                key={`${a.comment.n}-${i}`}
                type="button"
                data-comment={i === 0 ? a.comment.n : undefined}
                aria-label={`Comment ${a.comment.n}`}
                onClick={() => setActive(a.comment.n)}
                className="absolute cursor-pointer rounded-[2px] transition-shadow"
                style={{
                  ...b,
                  background: KIND[a.comment.kind].fill,
                  boxShadow: active === a.comment.n ? `0 0 0 2px ${KIND[a.comment.kind].line}` : `inset 0 -2px 0 ${KIND[a.comment.kind].line}`,
                }}
              />
            )),
          )}
          {placed.map(
            (a) =>
              a.boxes.length > 0 && (
                <span
                  key={`badge-${a.comment.n}`}
                  aria-hidden="true"
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-[10px] font-bold leading-none text-white px-[5px] py-[3px] pointer-events-none"
                  style={{ left: a.boxes[0].left, top: a.boxes[0].top, background: KIND[a.comment.kind].line }}
                >
                  {a.comment.n}
                </span>
              ),
          )}
        </div>
        <span className="absolute bottom-sm right-sm rounded bg-black/50 text-white text-label-sm px-xs">{pageNumber}</span>
      </div>
      <Margin placed={placed} active={active} setActive={setActive} criterionName={criterionName} pageHeight={height} onAsk={onAsk} />
    </section>
  );
}

function Margin({
  placed,
  active,
  setActive,
  criterionName,
  pageHeight,
  onAsk,
}: {
  placed: { comment: Numbered; boxes: unknown[]; top: number }[];
  active: number | null;
  setActive: (n: number | null) => void;
  criterionName: (id: string) => string;
  pageHeight: number;
  onAsk?: (c: IndexedComment) => void;
}) {
  const refs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [layout, setLayout] = useState<{ tops: Record<number, number>; bottom: number }>({ tops: {}, bottom: 0 });
  const tops = layout.tops;
  const order = useMemo(() => [...placed].sort((a, b) => a.top - b.top || a.comment.n - b.comment.n), [placed]);

  // Stack the cards next to their highlights without overlapping (wide screens only).
  useLayoutEffect(() => {
    let y = 0;
    const next: Record<number, number> = {};
    for (const a of order) {
      const h = refs.current.get(a.comment.n)?.offsetHeight ?? 0;
      const t = Math.max(a.top - 8, y);
      next[a.comment.n] = t;
      y = t + h + 8;
    }
    const nextLayout = { tops: next, bottom: y };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- positions come from measuring the rendered cards
    setLayout((prev) => (JSON.stringify(prev) === JSON.stringify(nextLayout) ? prev : nextLayout));
  }, [order, active]);


  if (!order.length) return <div className="hidden lg:block" />;
  return (
    <div className="relative flex flex-col gap-sm lg:block">
      <div className="hidden lg:block" style={{ height: Math.max(pageHeight, layout.bottom) }} aria-hidden="true" />
      {order.map((a) => {
        const k = KIND[a.comment.kind];
        const on = active === a.comment.n;
        return (
          <div
            key={a.comment.n}
            ref={(el) => {
              if (el) refs.current.set(a.comment.n, el);
              else refs.current.delete(a.comment.n);
            }}
            onClick={() => setActive(on ? null : a.comment.n)}
            className={`lg:absolute lg:inset-x-0 cursor-pointer rounded-xl border bg-surface-container-lowest p-sm flex flex-col gap-xs transition-[top,box-shadow] ${on ? "border-transparent" : "border-outline-variant"}`}
            style={{ top: tops[a.comment.n] ?? a.top, boxShadow: on ? `0 0 0 2px ${k.line}` : undefined }}
          >
            <div className="flex items-center gap-xs flex-wrap">
              <span className="rounded-full text-[10px] font-bold text-white px-[6px] py-[2px]" style={{ background: k.line }}>
                {a.comment.n}
              </span>
              <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${k.chip}`}>{k.label}</span>
              <span className="text-label-sm text-on-surface-variant truncate">{criterionName(a.comment.criterion_id)}</span>
            </div>
            {a.boxes.length === 0 && a.comment.quote && <p className="text-label-sm italic text-on-surface-variant">&ldquo;{a.comment.quote}&rdquo;</p>}
            <p className="text-label-md text-on-surface">{a.comment.comment}</p>
            {onAsk && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAsk(a.comment);
                }}
                className="self-start inline-flex items-center gap-xs text-label-sm font-semibold text-primary hover:underline"
              >
                <MessageCircle size={12} aria-hidden="true" /> Ask Bro about this
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

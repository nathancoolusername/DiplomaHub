// Grey pulsing placeholders shaped like the page that's loading (the loading.tsx
// files). Same look as app/hub/loading.tsx. Server-safe.

export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse motion-reduce:animate-none bg-surface-container rounded-xl ${className}`} />;
}

/** The outer wrapper: announces "Loading" to screen readers once. */
export function SkeletonPage({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

/** A card outline with bones inside (cards keep their border so the layout reads straight away). */
export function CardBone({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex flex-col gap-sm ${className}`}>{children}</div>;
}

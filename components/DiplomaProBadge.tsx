// Callers supply their own full className — appending on top of a hardcoded
// base class here would risk Tailwind's generated CSS order silently
// dropping the override (see likeButton.tsx/saveButton.tsx for the same
// class-order gotcha in this codebase).
export function DiplomaProBadge({ className = "" }: { className?: string }) {
  return <span className={className}>Diploma Pro</span>;
}

import Link from "next/link";

// The site wordmark, not a document heading — used in the navbar, footer,
// and every auth page.
export function Logo({
  size = "md",
  prefix = "",
}: {
  size?: "md" | "lg";
  prefix?: string;
}) {
  const sizeClass =
    size === "lg"
      ? "text-display-lg self-center justify-center"
      : "text-headline-md";

  return (
    <Link href="/">
      <span className={`font-serif ${sizeClass} font-bold flex flex-row`}>
        {prefix}Diploma<span className="text-primary">Hub</span>
      </span>
    </Link>
  );
}

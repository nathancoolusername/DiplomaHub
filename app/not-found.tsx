import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-margin py-20 px-md text-center min-h-[60vh]">
      <Compass size={48} className="text-primary" />
      <h1 className="text-headline-lg font-serif font-bold">Page not found</h1>
      <h1 className="text-on-surface-variant text-body-lg max-w-150">
        This page doesn&apos;t exist, or the content behind it was removed or
        unpublished.
      </h1>
      <Link href="/">
        <button className="px-lg py-sm bg-primary text-on-primary rounded-xl font-semibold cursor-pointer hover:opacity-90 transition">
          Go home
        </button>
      </Link>
    </div>
  );
}

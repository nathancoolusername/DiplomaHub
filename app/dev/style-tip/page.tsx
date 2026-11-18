import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StyleTip } from "@/components/StyleTip";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export const metadata: Metadata = { title: "Style tip (dev)", robots: { index: false } };

// Dev-only: the "Make it yours" tip under a real theme picker, without
// signing in or the tips queue. Same anchoring as the nav (right edge of the picker).
export default function StyleTipPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="max-w-[900px] mx-auto px-md py-xl flex justify-end">
      <div className="relative">
        <ThemeSwitcher />
        <StyleTip preview arrowClass="right-[9px]" />
      </div>
    </main>
  );
}

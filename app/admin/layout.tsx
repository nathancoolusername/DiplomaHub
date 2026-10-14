import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId();
  if (!isAdmin(userId)) redirect("/");

  return (
    <div className="bg-surface-container-low min-h-full">
      <div className="max-w-[1400px] mx-auto px-md md:px-lg py-lg flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="text-label-md font-semibold text-primary uppercase tracking-wide">DiplomaHub</p>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Admin</h1>
        </header>
        <AdminNav />
        <main className="flex flex-col gap-lg pb-xl">{children}</main>
      </div>
    </div>
  );
}

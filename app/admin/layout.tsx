import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!isAdmin(user?.id)) redirect("/");

  return (
    <div className="flex flex-col bg-surface-container-low min-h-full px-md md:px-10 xl:px-30 py-lg gap-margin">
      <h1 className="text-display-lg font-serif font-bold">Admin</h1>
      <div className="flex flex-row gap-md border-b-1 border-outline-variant">
        <Link
          href="/admin"
          className="px-lg py-sm text-body-lg font-semibold hover:text-primary transition"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/users"
          className="px-lg py-sm text-body-lg font-semibold hover:text-primary transition"
        >
          Users
        </Link>
        <Link
          href="/admin/content"
          className="px-lg py-sm text-body-lg font-semibold hover:text-primary transition"
        >
          Content
        </Link>
        <Link
          href="/admin/feedback"
          className="px-lg py-sm text-body-lg font-semibold hover:text-primary transition"
        >
          Feedback
        </Link>
      </div>
      {children}
    </div>
  );
}

import { getUsersPage } from "@/app/lib/actions/admin";
import { UsersTable } from "@/components/admin/UsersTable";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminUsersPage() {
  const result = await getUsersPage({ page: 1 });

  if (!result.success) {
    return <p className="text-error">Failed to load users: {result.error}</p>;
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Search accounts, give or take away Pro, set trust scores, clear a profile, or delete an account. The totals and graphs are on Overview."
      />
      <UsersTable initialItems={result.data.items} initialTotalCount={result.data.totalCount} />
    </>
  );
}

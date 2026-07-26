import { getUsersPage } from "@/app/lib/actions/admin";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const result = await getUsersPage({ page: 1 });

  if (!result.success) {
    return <p className="text-red-500">Failed to load users: {result.error}</p>;
  }

  return (
    <UsersTable
      initialItems={result.data.items}
      initialTotalCount={result.data.totalCount}
    />
  );
}

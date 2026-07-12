import { getAllUsersForAdmin } from "@/app/lib/actions/admin";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const result = await getAllUsersForAdmin();

  if (!result.success) {
    return <p className="text-red-500">Failed to load users: {result.error}</p>;
  }

  return <UsersTable users={result.data} />;
}

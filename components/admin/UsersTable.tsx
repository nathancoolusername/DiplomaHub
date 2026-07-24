"use client";

import { useState } from "react";
import Link from "next/link";
import {
  updateAuthorTrustScore,
  setUserPro,
  deleteUserAsAdmin,
  type AdminUserRow,
} from "@/app/lib/actions/admin";
import { isAdmin } from "@/app/lib/admin";
import { Avatar } from "@/components/avatar";
import { Spinner } from "@/components/spinner";

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [items, setItems] = useState(users);
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();
  const filtered = items.filter(
    (u) =>
      u.display_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query),
  );

  function removeUser(id: string) {
    setItems((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="flex flex-col gap-md">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="border rounded-lg px-md py-sm w-full max-w-100"
      />
      <div className="overflow-x-auto bg-surface-container-lowest border-1 border-outline-variant rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-1 border-outline-variant text-on-surface-variant text-label-md uppercase">
              <th className="p-md">User</th>
              <th className="p-md">Points</th>
              <th className="p-md">Trust Score</th>
              <th className="p-md">Pro</th>
              <th className="p-md">Joined</th>
              <th className="p-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <UserRow key={u.id} user={u} onDelete={() => removeUser(u.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onDelete,
}: {
  user: AdminUserRow;
  onDelete: () => void;
}) {
  const [score, setScore] = useState(user.author_trust_score);
  const [isPro, setIsPro] = useState(user.is_pro);
  const [savingScore, setSavingScore] = useState(false);
  const [savingPro, setSavingPro] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveScore() {
    setSavingScore(true);
    setError(null);
    const result = await updateAuthorTrustScore(user.id, score);
    if (!result.success) setError(result.error);
    setSavingScore(false);
  }

  async function handleTogglePro() {
    setSavingPro(true);
    setError(null);
    const nextIsPro = !isPro;
    const result = await setUserPro(user.id, nextIsPro);
    if (result.success) setIsPro(nextIsPro);
    else setError(result.error);
    setSavingPro(false);
  }

  async function handleDelete() {
    if (
      !confirm(
        `Permanently delete ${user.display_name}'s account? This removes their account and everything they created (resources, articles, discussions, comments). This can't be undone.`,
      )
    )
      return;

    setDeleting(true);
    setError(null);
    const result = await deleteUserAsAdmin(user.id);
    if (result.success) onDelete();
    else {
      setError(result.error);
      setDeleting(false);
    }
  }

  return (
    <tr className="border-b-1 border-outline-variant last:border-b-0 align-top">
      <td className="p-md">
        <Link
          href={`/profile/${user.id}`}
          className="flex flex-row items-center gap-sm hover:underline w-fit"
        >
          <Avatar src={user.avatar_url} name={user.display_name} size={32} />
          <div className="flex flex-col">
            <p className="font-bold text-body-md text-primary">
              {user.display_name}
            </p>
            <p className="text-on-surface-variant text-label-sm">
              {user.email}
            </p>
          </div>
        </Link>
      </td>
      <td className="p-md">{user.points.toLocaleString()}</td>
      <td className="p-md">
        <div className="flex flex-row items-center gap-sm">
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-20 border rounded-lg px-sm py-1"
          />
          <button
            onClick={handleSaveScore}
            disabled={savingScore || score === user.author_trust_score}
            className="text-primary font-semibold disabled:opacity-40 cursor-pointer"
          >
            {savingScore ? "Saving..." : "Save"}
          </button>
        </div>
        {error && <p className="text-red-500 text-label-sm mt-xs">{error}</p>}
      </td>
      <td className="p-md">
        <button
          onClick={handleTogglePro}
          disabled={savingPro}
          className={`px-md py-1 rounded-full text-label-md font-semibold cursor-pointer transition disabled:opacity-40 ${
            isPro
              ? "bg-primary-container text-on-primary"
              : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {isPro ? "Pro" : "Free"}
        </button>
      </td>
      <td className="p-md text-on-surface-variant text-label-md">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="p-md">
        {isAdmin(user.id) ? (
          <span className="text-on-surface-variant text-label-sm">—</span>
        ) : (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 font-semibold cursor-pointer hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-xs"
          >
            {deleting && <Spinner size={14} />}
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

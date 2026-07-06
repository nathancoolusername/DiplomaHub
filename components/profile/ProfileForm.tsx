// components/ProfileForm.tsx
"use client";

import { useState } from "react";
import { updateProfile } from "@/app/auth/actions";
import type { User } from "@/app/lib/types";

export function ProfileForm({
  profile,
  email,
}: {
  profile: User;
  email: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateProfile(formData);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-margin h-full py-margin px-gutter bg-surface-container-lowest border-1 border-outline-variant rounded-xl"
    >
      <div>
        <label className="block text-body-lg font-medium mb-1">Email</label>
        <input
          value={email}
          disabled
          className="w-full border rounded-lg px-5 py-4 bg-gray-50 text-on-surface-variant text-body-lg"
        />
      </div>

      <div>
        <label className="block text-body-lg font-medium mb-1">
          Display name
        </label>
        <input
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          required
          className="w-full border text-body-lg rounded-lg px-5 py-4"
        />
      </div>

      <div>
        <label className="block text-body-lg font-medium mb-1">I am a...</label>
        <select
          name="ib_year"
          defaultValue={profile.ib_year ?? ""}
          required
          className="w-full border rounded-lg px-5 py-4"
        >
          <option value="">Select one</option>
          <option value="Pre-IB">Pre-IB</option>
          <option value="DP1">DP1</option>
          <option value="DP2">DP2</option>
          <option value="Alumni">Alumni</option>
          <option value="Educator">Educator</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved!</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

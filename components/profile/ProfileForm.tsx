// components/ProfileForm.tsx
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera } from "lucide-react";
import { updateProfile } from "@/app/auth/actions";
import { uploadAvatar } from "@/app/lib/actions/upload";
import { initialsFor } from "@/app/lib/initials";
import type { UserProfile } from "@/app/lib/types";

export function ProfileForm({
  profile,
  email,
}: {
  profile: UserProfile;
  email: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError(null);
    const result = await uploadAvatar(file);
    if (result.success) {
      setAvatarUrl(result.data.avatarUrl);
    } else {
      setAvatarError(result.error);
    }
    setAvatarUploading(false);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await updateProfile(formData);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/profile/${profile.id}`);
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 flex flex-col gap-margin h-full py-margin px-gutter bg-surface-container-lowest border-1 border-outline-variant rounded-xl"
    >
      <div className="flex flex-col items-center gap-sm">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarUploading}
          className="relative h-24 w-24 rounded-full cursor-pointer disabled:opacity-50"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              width={96}
              height={96}
              alt={profile.display_name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-surface-container border-1 border-outline-variant flex items-center justify-center text-primary font-bold text-headline-lg">
              {initialsFor(profile.display_name)}
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-primary text-on-primary rounded-full p-sm border-2 border-surface-container-lowest">
            <Camera size={16} />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />
        {avatarUploading && (
          <p className="text-sm text-on-surface-variant">Uploading...</p>
        )}
        {avatarError && <p className="text-sm text-red-500">{avatarError}</p>}
      </div>

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

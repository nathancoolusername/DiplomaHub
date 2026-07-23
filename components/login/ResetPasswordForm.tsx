"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { Eye } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/spinner";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [type, setType] = useState("password");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;
    if (password !== confirm) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    const result = await updatePassword(password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/"), 1500);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget));
  }

  return (
    <div className="w-full justify-content-center items-center py-20 px-md bg-surface-container h-full flex flex-col gap-margin">
      <Logo size="lg" />
      <div className="bg-surface-container-lowest p-margin border-1 border-outline-variant rounded-xl flex flex-col gap-margin w-full max-w-120">
        <h1 className="text-headline-lg font-semibold font-serif">
          Choose a new password
        </h1>

        {done ? (
          <p className="text-body-lg text-on-surface-variant">
            Password updated — redirecting you in...
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-body-lg font-medium mb-1">
                New password
              </label>
              <div className="flex flex-row gap-sm">
                <input
                  name="password"
                  type={type}
                  required
                  minLength={6}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    setType((t) => (t === "password" ? "text" : "password"))
                  }
                >
                  <Eye
                    className={`cursor-pointer ${type === "password" ? "text-primary" : ""}`}
                  />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-body-lg font-medium mb-1">
                Confirm new password
              </label>
              <input
                name="confirm"
                type={type}
                required
                minLength={6}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-sm"
            >
              {loading && <Spinner size={16} />}
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

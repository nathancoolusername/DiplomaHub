// app/signup/page.tsx
"use client";
import { useState } from "react";
import { signUp } from "../auth/actions";
import { Eye } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("password");
  const [icon, setIcon] = useState(false);
  const handleToggle = () => {
    if (type === "password") {
      setIcon(false);
      setType("text");
    } else {
      setIcon(true);
      setType("password");
    }
  };

  async function handleSubmit(formData: FormData) {
    setError(null);

    const password = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const result = await signUp(formData);
    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="py-20 px-md bg-surface-container h-full flex flex-col gap-margin items-center">
      <div className="w-full max-w-140 flex flex-col gap-gutter bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant">
        <Logo size="lg" prefix="Join " />
        <h1 className="text-headline-lg font-semibold font-serif">Sign up</h1>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-lg font-bold mb-1">
              Display name
            </label>
            <input
              name="display_name"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">
              Password
            </label>
            <div className="flex flex-row gap-sm">
              <input
                name="password"
                type={type}
                required
                minLength={6}
                className="flex-1 min-w-0 border rounded-lg px-3 py-2"
              />
              <button type="button" onClick={handleToggle}>
                <Eye
                  className={`cursor-pointer ${icon ? "" : "text-primary"}`}
                />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">
              Confirm password
            </label>
            <input
              name="confirm_password"
              type={type}
              required
              minLength={6}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">
              I am a...
            </label>
            <select
              name="ib_year"
              required
              className="w-full border rounded-lg px-3 py-2"
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
            className="w-full py-2 rounded-lg bg-primary cursor-pointer text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

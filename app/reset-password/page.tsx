import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import ResetPasswordForm from "@/components/login/ResetPasswordForm";

export default async function ResetPasswordPage() {
  // Arriving here means /auth/reset-password already exchanged the
  // recovery code for a session — no session means the link was invalid,
  // already used, or expired.
  const userId = await getCurrentUserId();
  if (!userId) redirect("/forgot-password?error=no_code");

  return <ResetPasswordForm />;
}

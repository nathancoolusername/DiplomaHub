import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import ForgotPasswordForm from "@/components/login/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/");

  return <ForgotPasswordForm />;
}

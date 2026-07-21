import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import ForgotPasswordForm from "@/components/login/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <ForgotPasswordForm />;
}

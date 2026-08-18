// app/login/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import LoginForm from "@/components/login/LoginForm";

export default async function LoginPage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/");

  return <LoginForm />;
}

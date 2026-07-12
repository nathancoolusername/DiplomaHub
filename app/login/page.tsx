// app/login/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/get-current-user";
import LoginForm from "@/components/login/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <LoginForm />;
}

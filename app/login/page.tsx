// app/login/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { isSafeNext } from "@/app/lib/isSafeNext";
import LoginForm from "@/components/login/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const userId = await getCurrentUserId();
  const { next } = await searchParams;
  const safeNext = isSafeNext(next);
  if (userId) redirect(safeNext ?? "/");

  return <LoginForm next={safeNext} />;
}

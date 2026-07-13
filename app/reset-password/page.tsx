import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { getAuthenticatedStudent } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const user = await getAuthenticatedStudent();

  return (
    <Suspense>
      <AuthCard mode={user || mode === "update" ? "reset-update" : "reset-request"} />
    </Suspense>
  );
}

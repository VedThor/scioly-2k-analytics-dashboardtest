import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { publicSignupEnabled, redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <Suspense>
      <AuthCard mode="login" publicSignupEnabled={publicSignupEnabled()} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { publicSignupEnabled, redirectIfAuthenticated } from "@/lib/auth";

export default async function SignupPage() {
  await redirectIfAuthenticated();
  if (!publicSignupEnabled()) {
    redirect("/login");
  }

  return (
    <Suspense>
      <AuthCard mode="signup" />
    </Suspense>
  );
}

import { AppShell } from "@/components/layout/AppShell";
import { PracticePageClient } from "@/components/prep/PracticePageClient";
import { getDashboardData } from "@/lib/data";

export default async function PracticePage() {
  const { currentUser, schoolName } = await getDashboardData();

  return (
    <AppShell currentUser={currentUser} schoolName={schoolName}>
      <PracticePageClient />
    </AppShell>
  );
}

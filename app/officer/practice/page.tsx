import { AppShell } from "@/components/layout/AppShell";
import { OfficerPracticePageClient } from "@/components/prep/OfficerPracticePageClient";
import { getDashboardData } from "@/lib/data";

export default async function OfficerPracticePage() {
  const { currentUser, schoolName } = await getDashboardData();

  return (
    <AppShell currentUser={currentUser} schoolName={schoolName}>
      <OfficerPracticePageClient />
    </AppShell>
  );
}

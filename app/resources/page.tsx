import { AppShell } from "@/components/layout/AppShell";
import { ResourcesHubClient } from "@/components/prep/ResourcesHubClient";
import { getDashboardData } from "@/lib/data";

export default async function ResourcesPage() {
  const { currentUser, schoolName } = await getDashboardData();

  return (
    <AppShell currentUser={currentUser} schoolName={schoolName}>
      <ResourcesHubClient />
    </AppShell>
  );
}

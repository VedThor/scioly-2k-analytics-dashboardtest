import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { TestoffEntryForm } from "@/components/testoffs/TestoffEntryForm";
import { requireRole } from "@/lib/data";
import { loadTestoffAdminData } from "@/lib/testoff-data";

export const dynamic = "force-dynamic";

export default async function AdminTestoffsPage() {
  const currentUser = await requireRole("officer");
  const data = await loadTestoffAdminData();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader label="Officer tools" title="Enter testoff scores" description="Create a session, enter raw scores, review the calculated rankings, and publish them to the team. Ties share a rank." />

        <TestoffEntryForm data={data} />
      </div>
    </AppShell>
  );
}

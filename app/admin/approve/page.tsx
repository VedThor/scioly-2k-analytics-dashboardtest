import { ApprovalQueue } from "@/components/admin/ApprovalQueue";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getApprovePageData } from "@/lib/data";

export default async function ApprovePage() {
  const { currentUser, queue } = await getApprovePageData();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader label="Officer tools" title="Practice approval queue" description="Review submitted practice logs. Approved entries update point totals and ratings; every decision is recorded." />
        <ApprovalQueue queue={queue} />
      </div>
    </AppShell>
  );
}

import { ReportCenter } from "@/components/admin/ReportCenter";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { buildAdminReport, type AdminReportFilterInput } from "@/lib/admin-reports";
import { requireRole } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<AdminReportFilterInput>;
}) {
  const [currentUser, search] = await Promise.all([requireRole("admin"), searchParams]);
  const report = await buildAdminReport(search);

  return (
    <AppShell currentUser={currentUser}>
      <div className="min-w-0 space-y-6">
        <PageHeader
          label="Admin tools"
          title="Report center"
          description="Build focused readiness, point, tournament, testoff, and team reports. Filter the records on screen, follow links back to source profiles, then print or download them."
        />
        <ReportCenter report={report} />
      </div>
    </AppShell>
  );
}

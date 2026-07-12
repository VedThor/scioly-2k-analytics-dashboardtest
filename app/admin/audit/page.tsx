import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getAuditPageData } from "@/lib/data";

export default async function AuditPage() {
  const { currentUser, logs } = await getAuditPageData();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader label="Admin tools" title="Audit log" description="Review administrative changes and reverse supported actions. Original records remain visible after an undo." />
        <AuditLogTable logs={logs} currentUser={currentUser} />
      </div>
    </AppShell>
  );
}

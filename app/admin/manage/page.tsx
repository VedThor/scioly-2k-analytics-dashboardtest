import { AccountManager } from "@/components/admin/AccountManager";
import { AdminPointManager } from "@/components/admin/AdminPointManager";
import { AdminManageTabs } from "@/components/admin/AdminManageTabs";
import { CustomCategoryManager } from "@/components/admin/CustomCategoryManager";
import { RosterManager } from "@/components/admin/RosterManager";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getManagePageData } from "@/lib/data";

export default async function ManagePage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; point?: string }>;
}) {
  const { tab, point } = await searchParams;
  const initialTab = tab === "points" || tab === "categories" || tab === "accounts" ? tab : "roster";
  const requestedPointId = Number(point);
  const initialPointId = Number.isInteger(requestedPointId) && requestedPointId > 0 ? requestedPointId : undefined;
  const { currentUser, rosters, students } = await getManagePageData();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader label="Admin tools" title="Manage team" description="Update rosters, add or remove point records, manage practice categories, and edit accounts. Changes are recorded in the audit log." />
        <AdminManageTabs
          roster={<RosterManager rosters={rosters} />}
          points={<AdminPointManager students={students} initialPointId={initialPointId} />}
          categories={<CustomCategoryManager />}
          accounts={(
            <AccountManager
              students={students}
              teams={rosters
                .filter((roster) => roster.id !== "unassigned")
                .map((roster) => ({ id: roster.id, label: roster.label }))}
            />
          )}
          initialTab={initialTab}
        />
      </div>
    </AppShell>
  );
}

import { LibraryManager } from "@/components/admin/LibraryManager";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/data";
import { getLibraryEventOptions, getManagedLibraryItems } from "@/lib/library-data";

export const dynamic = "force-dynamic";

export default async function LibraryManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const [currentUser, params, initialItems, events] = await Promise.all([
    requireRole("officer"),
    searchParams,
    getManagedLibraryItems(),
    getLibraryEventOptions(),
  ]);

  return (
    <AppShell currentUser={currentUser}>
      <div className="min-w-0 space-y-6">
        <PageHeader
          label="Officer tools"
          title="Manage event library"
          description="Add links, guide text, practice questions, and tests to the correct event. Removed items remain restorable, and every change is recorded for admins."
        />
        <LibraryManager initialItems={initialItems} events={events} initialEvent={params.event} />
      </div>
    </AppShell>
  );
}

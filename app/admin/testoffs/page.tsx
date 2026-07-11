import { AppShell } from "@/components/layout/AppShell";
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
        <section className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
          <div className="text-xs font-black uppercase text-cyan-300">Officer Tools</div>
          <h1 className="mt-2 text-4xl font-black italic uppercase leading-none text-white md:text-5xl">
            Testoff Score Entry
          </h1>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Create a weighted session, enter raw scores, and publish server-ranked results to the team testoff board.
            Ties receive the same rank and the next rank is skipped.
          </p>
        </section>

        <TestoffEntryForm data={data} />
      </div>
    </AppShell>
  );
}

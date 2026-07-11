import { ClipboardList, Scale, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatTile } from "@/components/StatTile";
import { TestoffRankings } from "@/components/testoffs/TestoffRankings";
import { getCurrentUser } from "@/lib/data";
import { loadTestoffDashboardData } from "@/lib/testoff-data";
import { roleMeets } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TestoffsPage() {
  const currentUser = await getCurrentUser();
  const data = await loadTestoffDashboardData();
  const selectedSeasonId = data.activeSeasonId ?? data.eventRankings[0]?.seasonId;
  const currentGroups = data.eventRankings.filter((group) => group.seasonId === selectedSeasonId);
  const sessionCount = currentGroups.reduce((sum, group) => sum + group.sessions.length, 0);
  const rankedStudents = new Set(
    currentGroups.flatMap((group) => group.rankings.map((ranking) => ranking.studentId))
  ).size;

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-court-line bg-court-panel p-5 shadow-panel md:p-6">
            <div className="text-xs font-black uppercase tracking-wide text-cyan-300">Event Selection Analytics</div>
            <h1 className="mt-2 text-4xl font-black italic uppercase leading-none text-white md:text-6xl">
              Testoff Rankings
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
              Compare normalized testoff performance within each event. Session weights preserve the importance of
              full testoffs while keeping different maximum scores comparable.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatTile label="Active Events" value={currentGroups.length} detail="With testoff data" />
              <StatTile label="Sessions" value={sessionCount} detail="In the selected season" />
              <StatTile label="Ranked Students" value={rankedStudents} detail="Unique candidates" />
            </div>
          </div>

          <div className="rounded-md border border-court-line bg-court-panel p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-pink-300">
              <Scale className="h-4 w-4" aria-hidden="true" />
              Ranking Method
            </div>
            <h2 className="mt-2 text-2xl font-black italic uppercase text-white">Weighted Composite</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <div className="flex gap-3 rounded-md border border-court-line bg-court-elevated p-3">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                Raw scores become percentages of each session maximum.
              </div>
              <div className="flex gap-3 rounded-md border border-court-line bg-court-elevated p-3">
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" aria-hidden="true" />
                Percentages are multiplied by weight, combined, and ranked descending.
              </div>
            </div>
          </div>
        </section>

        <TestoffRankings data={data} canManage={roleMeets(currentUser.role, "officer")} />
      </div>
    </AppShell>
  );
}

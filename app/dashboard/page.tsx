import { ActivityPanel } from "@/components/dashboard/ActivityPanel";
import { RosterTable } from "@/components/dashboard/RosterTable";
import { TeamMiniPanel } from "@/components/dashboard/TeamMiniPanel";
import { QuickPointLogForm } from "@/components/forms/QuickPointLogForm";
import { AppShell } from "@/components/layout/AppShell";
import { OvrBadge } from "@/components/OvrBadge";
import { StatTile } from "@/components/StatTile";
import { getDashboardData } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const { currentUser, schoolName, players, activePlayers, teams } = await getDashboardData();
  const averageOvr = players.reduce((total, player) => total + player.ovrRating, 0) / players.length;
  const totalPoints = players.reduce((total, player) => total + player.totalPoints, 0);
  const totalTournaments = players.reduce((total, player) => total + player.tournamentsAttended, 0);
  const firstName = currentUser.name.split(" ")[0];

  return (
    <AppShell currentUser={currentUser} schoolName={schoolName}>
      <div className="space-y-7">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">{schoolName}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 md:text-base">
              Track your team, log practice, and see where everyone stands.
            </p>
          </div>
          <div className="rounded-full border border-court-line bg-court-panel px-3 py-1.5 text-xs font-medium capitalize text-zinc-600 shadow-sm">
            {currentUser.role} access
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Team average" value={<OvrBadge value={averageOvr} size="sm" showTier />} detail="Overall rating" />
          <StatTile label="Active students" value={players.length} detail="Across all rosters" />
          <StatTile label="Approved points" value={formatNumber(totalPoints)} detail="Team total" />
          <StatTile label="Competition starts" value={formatNumber(totalTournaments)} detail="All recorded results" />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <RosterTable players={players} />
          <aside className="space-y-5">
            <QuickPointLogForm currentUser={currentUser} />
            <ActivityPanel players={activePlayers} />
            <TeamMiniPanel teams={teams} />
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

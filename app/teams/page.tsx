import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { TeamComparisonView } from "@/components/teams/TeamComparisonView";
import { getTeamsPageData } from "@/lib/data";

export default async function TeamsPage({
  searchParams
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team } = await searchParams;
  const { currentUser, teams } = await getTeamsPageData();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader
          label="Team overview"
          title="Teams and rosters"
          description="Compare active team readiness, strengths, and member assignments. Team values update when results, points, or rosters change."
        />
        <TeamComparisonView teams={teams} initialTeamDesignation={team} />
      </div>
    </AppShell>
  );
}

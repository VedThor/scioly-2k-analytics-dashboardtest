import "server-only";

import { notFound, redirect } from "next/navigation";
import { getAuthenticatedStudent } from "@/lib/auth";
import {
  createAnalytics,
  demoAnalyticsDataset,
  getCurrentDemoUser,
} from "@/lib/analytics";
import { loadCachedAnalyticsDataset } from "@/lib/analytics-cache";
import { schoolName } from "@/lib/seed";
import { hasSupabaseConfig, isDemoMode } from "@/lib/supabase";
import { loadSupabaseAuditTrail } from "@/lib/supabase-data";
import { roleMeets } from "@/lib/utils";
import type { PlayerDetail, Student, TeamComparison, UserRole } from "@/lib/types";

export async function getAnalyticsForRequest() {
  if (!hasSupabaseConfig()) {
    if (!isDemoMode()) {
      throw new Error("SciOly Tracker is missing its Supabase environment variables.");
    }
    return createAnalytics(demoAnalyticsDataset);
  }

  return createAnalytics(await loadCachedAnalyticsDataset());
}

export async function getCurrentUser() {
  const authenticatedStudent = await getAuthenticatedStudent();
  if (authenticatedStudent) {
    return authenticatedStudent;
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  if (!isDemoMode()) {
    throw new Error("SciOly Tracker is missing its Supabase environment variables.");
  }

  return getCurrentDemoUser();
}

export async function requireRole(minimumRole: UserRole) {
  const user = await getCurrentUser();
  if (!roleMeets(user.role, minimumRole)) {
    redirect("/dashboard");
  }
  return user;
}

function includeCurrentUser(
  players: PlayerDetail[],
  currentUser: Student,
  detailForStudent: (student: Student, rank?: number) => PlayerDetail
) {
  if (players.some((player) => player.id === currentUser.id)) {
    return players;
  }

  return [
    ...players,
    {
      ...detailForStudent(currentUser, players.length + 1),
      rank: players.length + 1
    }
  ];
}

function visiblePlayer(player: PlayerDetail, currentUser: Student) {
  return currentUser.role === "admin" || currentUser.role === "officer" || player.id === currentUser.id
    ? player
    : { ...player, email: "", pointHistory: [] };
}

function summaryPlayer(player: PlayerDetail) {
  return {
    ...player,
    competitionHistory: [],
    pointHistory: [],
    eventBreakdowns: [],
    snapshots: []
  };
}

function visibleTeams(teams: TeamComparison[], currentUser: Student, summariesOnly = false) {
  return teams.map((team) => {
    const members = team.members.map((member) => {
      const visible = visiblePlayer(member, currentUser);
      return summariesOnly ? summaryPlayer(visible) : visible;
    });
    const memberById = new Map(members.map((member) => [member.id, member]));
    return {
      ...team,
      members,
      topStudy: team.topStudy ? memberById.get(team.topStudy.id) : undefined,
      topBuild: team.topBuild ? memberById.get(team.topBuild.id) : undefined
    };
  });
}

export async function getDashboardData() {
  const [currentUser, analytics] = await Promise.all([getCurrentUser(), getAnalyticsForRequest()]);
  const players = includeCurrentUser(
    analytics.getLeaderboardPlayers(),
    currentUser,
    analytics.detailForStudent
  ).map((player) => summaryPlayer(visiblePlayer(player, currentUser)));

  return {
    currentUser,
    schoolName,
    players,
    activePlayers: [...players].sort((a, b) => b.thirtyDayPoints - a.thirtyDayPoints),
    teams: visibleTeams(analytics.getTeamComparisons(), currentUser, true),
    tournamentInsights: analytics.getTournamentResultInsights()
  };
}

export async function getProfileData(id: string) {
  const [currentUser, analytics] = await Promise.all([getCurrentUser(), getAnalyticsForRequest()]);
  const leaderboard = analytics.getLeaderboardPlayers();
  const player =
    analytics.getPlayerDetail(id) ??
    (id === currentUser.id ? analytics.detailForStudent(currentUser, leaderboard.length + 1) : undefined);

  if (!player) {
    notFound();
  }

  return {
    currentUser,
    player: visiblePlayer(player, currentUser)
  };
}

export async function getPointsPageData() {
  const [currentUser, analytics] = await Promise.all([getCurrentUser(), getAnalyticsForRequest()]);
  const player = analytics.getPlayerDetail(currentUser.id) ?? analytics.detailForStudent(currentUser);
  return { currentUser, player: visiblePlayer(player, currentUser) };
}

export async function getApprovePageData() {
  const [currentUser, analytics] = await Promise.all([requireRole("officer"), getAnalyticsForRequest()]);
  return {
    currentUser,
    queue: analytics.getApprovalQueue().map((entry) => ({
      ...entry,
      student: summaryPlayer(visiblePlayer(entry.student, currentUser))
    }))
  };
}

export async function getUploadPageData() {
  const currentUser = await requireRole("officer");
  return { currentUser };
}

export async function getManagePageData() {
  const [currentUser, analytics] = await Promise.all([requireRole("admin"), getAnalyticsForRequest()]);
  return {
    currentUser,
    rosters: analytics.getRosterSeedForDragDrop(),
    students: analytics.getLeaderboardPlayers().map(summaryPlayer)
  };
}

export async function getAuditPageData() {
  const currentUser = await requireRole("admin");
  if (hasSupabaseConfig()) {
    return {
      currentUser,
      logs: await loadSupabaseAuditTrail()
    };
  }
  const analytics = await getAnalyticsForRequest();
  return {
    currentUser,
    logs: analytics.getAuditTrail()
  };
}

export async function getTeamsPageData() {
  const [currentUser, analytics] = await Promise.all([getCurrentUser(), getAnalyticsForRequest()]);
  return {
    currentUser,
    teams: visibleTeams(analytics.getTeamComparisons(), currentUser, true)
  };
}

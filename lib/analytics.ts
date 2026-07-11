import {
  mockAuditLogs,
  mockEvents,
  mockPerformances,
  mockPointLogs,
  mockSnapshots,
  mockStudents,
  mockTeamMembers,
  mockTeams,
  mockTournaments,
  demoNow
} from "@/lib/seed";
import { activityLabels } from "@/lib/activity";
import {
  calculateAveragePlacement,
  calculatePotentialRating,
  deltaValue,
  getRatingTier,
  roundRating
} from "@/lib/rating";
import type {
  AuditLogEntry,
  CompetitionHistoryRow,
  EventBreakdown,
  EventDefinition,
  GrindPointLog,
  OvrSnapshot,
  Performance,
  PlayerDetail,
  PointHistoryRow,
  Student,
  Team,
  TeamComparison,
  TeamMember,
  Tournament
} from "@/lib/types";

export interface AnalyticsDataset {
  students: Student[];
  teams: Team[];
  teamMembers: TeamMember[];
  events: EventDefinition[];
  tournaments: Tournament[];
  performances: Performance[];
  pointLogs: GrindPointLog[];
  snapshots: OvrSnapshot[];
  auditLogs: AuditLogEntry[];
  now?: Date;
}

export const demoAnalyticsDataset: AnalyticsDataset = {
  students: mockStudents,
  teams: mockTeams,
  teamMembers: mockTeamMembers,
  events: mockEvents,
  tournaments: mockTournaments,
  performances: mockPerformances,
  pointLogs: mockPointLogs,
  snapshots: mockSnapshots,
  auditLogs: mockAuditLogs,
  now: demoNow
};

export function createAnalytics(dataset: AnalyticsDataset) {
  const studentById = new Map(dataset.students.map((student) => [student.id, student]));
  const eventById = new Map(dataset.events.map((event) => [event.id, event]));
  const tournamentById = new Map(dataset.tournaments.map((tournament) => [tournament.id, tournament]));
  const teamById = new Map(dataset.teams.map((team) => [team.id, team]));

  function approvedLogsFor(studentId: string) {
    return dataset.pointLogs.filter((log) => log.studentId === studentId && log.status === "approved");
  }

  function thirtyDayPoints(logs: GrindPointLog[]) {
    const start = new Date(dataset.now ?? new Date());
    start.setDate(start.getDate() - 30);

    return logs
      .filter((log) => new Date(log.submittedAt) >= start && log.status === "approved")
      .reduce((total, log) => total + log.points, 0);
  }

  function getTeamForStudent(studentId: string) {
    const membership = dataset.teamMembers.find((member) => member.studentId === studentId);
    const team = membership ? teamById.get(membership.teamId) : undefined;

    return {
      teamId: team?.id,
      teamName: team ? `${team.schoolName} ${team.teamDesignation}` : "Unassigned",
      teamDesignation: team?.teamDesignation ?? "-"
    };
  }

  function competitionHistory(performances: Performance[]): CompetitionHistoryRow[] {
    return performances
      .flatMap((performance) => {
        const tournament = tournamentById.get(performance.tournamentId);
        const event = eventById.get(performance.eventId);
        if (!tournament || !event) return [];

        return [{
          id: performance.id,
          date: tournament.date,
          tournament: tournament.name,
          event: event.name,
          category: event.category,
          rank: performance.rank,
          sos: tournament.sosMultiplier,
          benchmarkSchool: tournament.benchmarkComparison.benchmarkSchool,
          benchmarkSource: tournament.benchmarkComparison.source,
          relativeDifficultyMultiplier: tournament.benchmarkComparison.relativeDifficultyMultiplier,
          placementScore: performance.placementScore,
          participantNames: performance.participantNames,
          isMedal: performance.isMedal,
          participationPoints: performance.participationPoints,
          medalPoints: performance.medalPoints,
          eventPoints: performance.eventPoints
        } satisfies CompetitionHistoryRow];
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function pointHistory(logs: GrindPointLog[]): PointHistoryRow[] {
    return logs
      .map((log) => ({
        id: log.id,
        date: log.submittedAt,
        activity: log.customLabel || activityLabels[log.activityType] || log.activityType,
        points: log.points,
        status: log.status,
        approvedBy: log.approvedBy ? studentById.get(log.approvedBy)?.name : undefined,
        notes: log.notes
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function eventBreakdowns(performances: Performance[]): EventBreakdown[] {
    const grouped = new Map<number, Performance[]>();
    for (const performance of performances) {
      const list = grouped.get(performance.eventId) ?? [];
      list.push(performance);
      grouped.set(performance.eventId, list);
    }

    return Array.from(grouped.entries())
      .flatMap(([eventId, rows]) => {
        const event = eventById.get(eventId);
        if (!event) return [];
        const avgPlacement = calculateAveragePlacement(rows) ?? 0;
        const averageScore = rows.reduce((total, row) => total + row.placementScore, 0) / rows.length;

        return [{
          eventId,
          eventName: event.name,
          category: event.category,
          timesCompeted: rows.length,
          avgPlacement,
          eventOvr: Math.min(99, Math.max(60, roundRating(55 + averageScore / 4 + rows.length * 0.4))),
          bestFinish: Math.min(...rows.map((row) => row.rank)),
          medals: rows.filter((row) => row.isMedal).length,
          participationPoints: rows.reduce((total, row) => total + row.participationPoints, 0)
        } satisfies EventBreakdown];
      })
      .sort((a, b) => b.eventOvr - a.eventOvr);
  }

  function snapshotsFor(studentId: string) {
    return dataset.snapshots
      .filter((snapshot) => snapshot.studentId === studentId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }

  function detailForStudent(student: Student, rank = 1): PlayerDetail {
    const performances = dataset.performances.filter((performance) => performance.studentId === student.id);
    const allLogs = dataset.pointLogs.filter((log) => log.studentId === student.id);
    const approvedLogs = approvedLogsFor(student.id);
    const snapshots = snapshotsFor(student.id);
    const snapshot = snapshots.at(-1);
    const team = getTeamForStudent(student.id);
    const avgPlacement = calculateAveragePlacement(performances);
    const tournamentsAttended = new Set(performances.map((performance) => performance.tournamentId)).size;
    const medalCount = performances.filter((performance) => performance.isMedal).length;
    const activePoints = thirtyDayPoints(approvedLogs);
    const potentialRating =
      student.potentialRating ??
      calculatePotentialRating({
        ovrRating: student.ovrRating,
        studyRating: student.studyRating,
        buildRating: student.buildRating,
        thirtyDayPoints: activePoints,
        medalCount,
        avgPlacement
      });

    return {
      ...student,
      rank,
      ...team,
      avgPlacement,
      tournamentsAttended,
      medalCount,
      potentialRating,
      thirtyDayPoints: activePoints,
      ovrDelta: deltaValue(student.ovrRating, snapshot?.ovrValue ?? student.prevOvr),
      avgPlacementDelta:
        typeof avgPlacement === "number"
          ? deltaValue(avgPlacement, snapshot?.avgPlacement ?? student.prevAvgPlacement, true)
          : undefined,
      totalPointsDelta: deltaValue(student.totalPoints, snapshot?.totalPoints),
      competitionHistory: competitionHistory(performances),
      pointHistory: pointHistory(allLogs),
      eventBreakdowns: eventBreakdowns(performances),
      snapshots: snapshots.map((entry) => ({
        ...entry,
        medalCount: entry.medalCount ?? medalCount,
        potentialRating: entry.potentialRating ?? potentialRating
      }))
    };
  }

  function getLeaderboardPlayers() {
    return dataset.students
      .map((student) => detailForStudent(student))
      .sort((a, b) => b.ovrRating - a.ovrRating || a.name.localeCompare(b.name))
      .map((student, index) => ({ ...student, rank: index + 1 }));
  }

  function getPlayerDetail(id: string) {
    return getLeaderboardPlayers().find((student) => student.id === id);
  }

  function getApprovalQueue() {
    const playersById = new Map(getLeaderboardPlayers().map((player) => [player.id, player]));

    return dataset.pointLogs
      .filter((log) => log.status === "pending")
      .flatMap((log) => {
        const student = playersById.get(log.studentId);
        return student ? [{ ...log, student }] : [];
      })
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  }

  function calculateTeamOvr(members: PlayerDetail[]) {
    const topMembers = [...members].sort((a, b) => b.ovrRating - a.ovrRating).slice(0, 15);
    if (topMembers.length === 0) return 60;
    return roundRating(topMembers.reduce((sum, member) => sum + member.ovrRating, 0) / topMembers.length);
  }

  function getTeamComparisons(): TeamComparison[] {
    const players = getLeaderboardPlayers();
    const playerById = new Map(players.map((player) => [player.id, player]));

    return dataset.teams.map((team) => {
      const members = dataset.teamMembers
        .filter((member) => member.teamId === team.id)
        .map((member) => playerById.get(member.studentId))
        .filter((member): member is PlayerDetail => Boolean(member));

      const memberIds = new Set(members.map((member) => member.id));
      const memberPerformances = dataset.performances.filter((performance) => memberIds.has(performance.studentId));
      const latestPerformance = [...memberPerformances].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      const latestTournament = latestPerformance ? tournamentById.get(latestPerformance.tournamentId) : undefined;

      return {
        id: team.id,
        schoolName: team.schoolName,
        designation: team.teamDesignation,
        teamOvr: calculateTeamOvr(members),
        members,
        topStudy: [...members]
          .filter((member) => typeof member.studyRating === "number")
          .sort((a, b) => (b.studyRating ?? 0) - (a.studyRating ?? 0))[0],
        topBuild: [...members]
          .filter((member) => typeof member.buildRating === "number")
          .sort((a, b) => (b.buildRating ?? 0) - (a.buildRating ?? 0))[0],
        lastSos: latestTournament?.sosMultiplier
      };
    });
  }

  function getAuditTrail() {
    return [...dataset.auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getRosterSeedForDragDrop() {
    const teamRosters = getTeamComparisons().map((team) => ({
      id: team.id,
      label: `${team.schoolName} ${team.designation}`,
      ovr: team.teamOvr,
      members: team.members.map((member) => ({
        id: member.id,
        name: member.name,
        ovr: member.ovrRating,
        tier: getRatingTier(member.ovrRating).name
      }))
    }));

    const assignedStudentIds = new Set(dataset.teamMembers.map((member) => member.studentId));
    const unassigned = getLeaderboardPlayers()
      .filter((student) => !assignedStudentIds.has(student.id))
      .map((student) => ({
        id: student.id,
        name: student.name,
        ovr: student.ovrRating,
        tier: getRatingTier(student.ovrRating).name
      }));

    return [
      ...teamRosters,
      {
        id: "unassigned",
        label: "Unassigned",
        ovr: 60,
        members: unassigned
      }
    ];
  }

  return {
    detailForStudent,
    getLeaderboardPlayers,
    getPlayerDetail,
    getApprovalQueue,
    getTeamComparisons,
    getMostActivePlayers: () =>
      [...getLeaderboardPlayers()].sort((a, b) => b.thirtyDayPoints - a.thirtyDayPoints),
    getAuditTrail,
    getReferenceData: () => ({
      events: dataset.events,
      tournaments: dataset.tournaments,
      pendingLogs: getApprovalQueue()
    }),
    getRosterSeedForDragDrop
  };
}

const demoAnalytics = createAnalytics(demoAnalyticsDataset);

export const detailForStudent = demoAnalytics.detailForStudent;
export const getLeaderboardPlayers = demoAnalytics.getLeaderboardPlayers;
export const getPlayerDetail = demoAnalytics.getPlayerDetail;
export const getApprovalQueue = demoAnalytics.getApprovalQueue;
export const getTeamComparisons = demoAnalytics.getTeamComparisons;
export const getMostActivePlayers = demoAnalytics.getMostActivePlayers;
export const getAuditTrail = demoAnalytics.getAuditTrail;
export const getReferenceData = demoAnalytics.getReferenceData;
export const getRosterSeedForDragDrop = demoAnalytics.getRosterSeedForDragDrop;

export function getCurrentDemoUser() {
  return mockStudents.find((student) => student.id === "stu-aarav") ?? mockStudents[0];
}

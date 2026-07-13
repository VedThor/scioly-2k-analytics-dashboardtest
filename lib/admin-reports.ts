import "server-only";

import { getAnalyticsForRequest } from "@/lib/data";
import { loadTestoffDashboardData } from "@/lib/testoff-data";
import { csvEscape } from "@/lib/utils";
import type { PlayerDetail, TeamComparison } from "@/lib/types";

export type AdminReportType = "readiness" | "points" | "tournaments" | "testoffs" | "teams";

export interface AdminReportFilterInput {
  type?: string | string[];
  report?: string | string[];
  from?: string | string[];
  to?: string | string[];
  student?: string | string[];
  team?: string | string[];
}

export interface AdminReportFilters {
  type: AdminReportType;
  from: string;
  to: string;
  studentId: string;
  teamId: string;
}

export interface AdminReportCell {
  value: string;
  href?: string;
  tone?: "default" | "muted" | "accent" | "success" | "warning" | "danger";
}

export interface AdminReportColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export interface AdminReportRow {
  id: string;
  cells: Record<string, AdminReportCell>;
}

export interface AdminReportSummary {
  label: string;
  value: string;
  detail: string;
}

export interface AdminReportOption {
  id: string;
  label: string;
}

export interface AdminReportData {
  type: AdminReportType;
  title: string;
  description: string;
  dateFilterApplies: boolean;
  generatedAt: string;
  filters: AdminReportFilters;
  filterDescription: string;
  columns: AdminReportColumn[];
  rows: AdminReportRow[];
  summary: AdminReportSummary[];
  studentOptions: AdminReportOption[];
  teamOptions: AdminReportOption[];
  emptyMessage: string;
}

export const adminReportTypes: Array<{
  id: AdminReportType;
  label: string;
  description: string;
}> = [
  {
    id: "readiness",
    label: "Student readiness",
    description: "Readiness components, recent preparation, placements, and medal counts."
  },
  {
    id: "points",
    label: "Point activity",
    description: "Every submitted point record, including pending and rejected entries."
  },
  {
    id: "tournaments",
    label: "Tournament results",
    description: "Placements and competition points credited to each team member."
  },
  {
    id: "testoffs",
    label: "Testoff results",
    description: "Raw scores, normalized scores, rankings, events, and seasons."
  },
  {
    id: "teams",
    label: "Team summary",
    description: "Roster size, readiness, top contributors, and evidence coverage."
  }
];

const validReportTypes = new Set<AdminReportType>(adminReportTypes.map((report) => report.id));

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function dateValue(value: string | string[] | undefined) {
  const candidate = firstValue(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return "";
  return Number.isNaN(Date.parse(`${candidate}T12:00:00`)) ? "" : candidate;
}

export function normalizeAdminReportFilters(input: AdminReportFilterInput): AdminReportFilters {
  const requestedType = firstValue(input.type || input.report) as AdminReportType;
  return {
    type: validReportTypes.has(requestedType) ? requestedType : "readiness",
    from: dateValue(input.from),
    to: dateValue(input.to),
    studentId: firstValue(input.student).trim(),
    teamId: firstValue(input.team).trim()
  };
}

function displayDate(value: string) {
  if (!value) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function displayNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function rowDateMatches(value: string, filters: AdminReportFilters) {
  const key = dateKey(value);
  if (filters.from && key < filters.from) return false;
  if (filters.to && key > filters.to) return false;
  return true;
}

function teamIdFor(player: PlayerDetail) {
  return player.teamId || "unassigned";
}

function playerMatches(player: PlayerDetail, filters: AdminReportFilters) {
  if (filters.studentId && player.id !== filters.studentId) return false;
  if (filters.teamId && teamIdFor(player) !== filters.teamId) return false;
  return true;
}

function teamLabel(player: PlayerDetail) {
  return player.teamId ? `Team ${player.teamDesignation}` : "Unassigned";
}

function teamHref(player: PlayerDetail) {
  return player.teamId ? `/teams?team=${encodeURIComponent(player.teamDesignation)}` : "/teams";
}

function statusTone(status: string): AdminReportCell["tone"] {
  const normalized = status.toLowerCase();
  if (normalized === "ready" || normalized === "approved") return "success";
  if (normalized === "on track") return "accent";
  if (normalized === "pending" || normalized === "developing") return "warning";
  if (normalized === "rejected") return "danger";
  return "muted";
}

function readinessReport(players: PlayerDetail[], filters: AdminReportFilters) {
  const filteredPlayers = players.filter((player) => playerMatches(player, filters));
  const rows: AdminReportRow[] = filteredPlayers.map((player) => ({
    id: player.id,
    cells: {
      student: { value: player.name, href: `/profile/${player.id}` },
      team: { value: teamLabel(player), href: teamHref(player), tone: "muted" },
      grade: { value: String(player.grade) },
      status: { value: player.readinessStatus, tone: statusTone(player.readinessStatus) },
      readiness: { value: `${displayNumber(player.readinessScore)}/100`, tone: "accent" },
      competition: { value: displayNumber(player.competitionScore) },
      testoff: { value: displayNumber(player.testoffScore) },
      preparation: { value: displayNumber(player.preparationScore) },
      recentPoints: { value: displayNumber(player.thirtyDayPoints, 0) },
      averagePlace: { value: typeof player.avgPlacement === "number" ? displayNumber(player.avgPlacement) : "—", tone: typeof player.avgPlacement === "number" ? "default" : "muted" },
      medals: { value: displayNumber(player.medalCount, 0) },
      source: { value: "Open profile", href: `/profile/${player.id}`, tone: "accent" }
    }
  }));
  const readyCount = filteredPlayers.filter((player) => player.readinessStatus === "Ready" || player.readinessStatus === "On track").length;
  const provisionalCount = filteredPlayers.filter((player) => player.readinessIsProvisional).length;

  return {
    title: "Student readiness report",
    description: "A current roster snapshot showing the evidence behind every readiness score.",
    dateFilterApplies: false,
    columns: [
      { key: "student", label: "Student" },
      { key: "team", label: "Team" },
      { key: "grade", label: "Grade", align: "right" },
      { key: "status", label: "Status" },
      { key: "readiness", label: "Readiness", align: "right" },
      { key: "competition", label: "Competition", align: "right" },
      { key: "testoff", label: "Testoff", align: "right" },
      { key: "preparation", label: "Preparation", align: "right" },
      { key: "recentPoints", label: "30-day points", align: "right" },
      { key: "averagePlace", label: "Avg. place", align: "right" },
      { key: "medals", label: "Medals", align: "right" },
      { key: "source", label: "Source" }
    ] satisfies AdminReportColumn[],
    rows,
    summary: [
      { label: "Students", value: String(filteredPlayers.length), detail: "In this report" },
      { label: "Ready or on track", value: String(readyCount), detail: "Current readiness status" },
      { label: "Average readiness", value: `${displayNumber(average(filteredPlayers.map((player) => player.readinessScore)))}/100`, detail: "Across filtered students" },
      { label: "Provisional", value: String(provisionalCount), detail: "Still needs evidence" }
    ],
    emptyMessage: "No students match these filters."
  };
}

function pointReport(players: PlayerDetail[], filters: AdminReportFilters) {
  const filteredPlayers = players.filter((player) => playerMatches(player, filters));
  const rows = filteredPlayers.flatMap((player) =>
    player.pointHistory
      .filter((entry) => rowDateMatches(entry.date, filters))
      .map<AdminReportRow>((entry) => ({
        id: `${player.id}:${entry.id}`,
        cells: {
          date: { value: displayDate(entry.date), tone: "muted" },
          student: { value: player.name, href: `/profile/${player.id}` },
          team: { value: teamLabel(player), href: teamHref(player), tone: "muted" },
          activity: { value: entry.activity, href: `/profile/${player.id}` },
          points: { value: displayNumber(entry.points, 0), tone: entry.points >= 0 ? "accent" : "danger" },
          status: { value: `${entry.status.charAt(0).toUpperCase()}${entry.status.slice(1)}`, tone: statusTone(entry.status) },
          notes: { value: entry.notes || "—", tone: entry.notes ? "default" : "muted" },
          source: { value: "Edit log", href: `/admin/manage?tab=points&point=${entry.id}`, tone: "accent" }
        }
      }))
  ).sort((left, right) => Date.parse(right.cells.date.value) - Date.parse(left.cells.date.value));

  const statusValues = rows.map((row) => row.cells.status.value.toLowerCase());
  const approvedRows = rows.filter((row) => row.cells.status.value.toLowerCase() === "approved");
  const approvedPoints = approvedRows.reduce((sum, row) => sum + Number(row.cells.points.value.replaceAll(",", "")), 0);

  return {
    title: "Point activity report",
    description: "Submitted practice and adjustment records, including records that do not count toward totals.",
    dateFilterApplies: true,
    columns: [
      { key: "date", label: "Date" },
      { key: "student", label: "Student" },
      { key: "team", label: "Team" },
      { key: "activity", label: "Activity" },
      { key: "points", label: "Points", align: "right" },
      { key: "status", label: "Status" },
      { key: "notes", label: "Notes" },
      { key: "source", label: "Source" }
    ] satisfies AdminReportColumn[],
    rows,
    summary: [
      { label: "Records", value: String(rows.length), detail: "All statuses" },
      { label: "Approved points", value: displayNumber(approvedPoints, 0), detail: `${approvedRows.length} approved records` },
      { label: "Pending", value: String(statusValues.filter((status) => status === "pending").length), detail: "Awaiting review" },
      { label: "Rejected", value: String(statusValues.filter((status) => status === "rejected").length), detail: "Excluded from totals" }
    ],
    emptyMessage: "No point records match this date range and roster selection."
  };
}

function tournamentReport(players: PlayerDetail[], filters: AdminReportFilters) {
  const filteredPlayers = players.filter((player) => playerMatches(player, filters));
  const rows = filteredPlayers.flatMap((player) =>
    player.competitionHistory
      .filter((entry) => rowDateMatches(entry.date, filters))
      .map<AdminReportRow>((entry) => ({
        id: `${player.id}:${entry.id}`,
        cells: {
          date: { value: displayDate(entry.date), tone: "muted" },
          tournament: { value: entry.tournament },
          event: { value: entry.event },
          student: { value: player.name, href: `/profile/${player.id}` },
          team: { value: teamLabel(player), href: teamHref(player), tone: "muted" },
          place: { value: String(entry.rank), tone: entry.isMedal ? "success" : "default" },
          medal: { value: entry.isMedal ? "Medal" : "—", tone: entry.isMedal ? "success" : "muted" },
          sos: { value: displayNumber(entry.sos, 2) },
          points: { value: displayNumber(entry.eventPoints, 0), tone: "accent" },
          source: { value: "View history", href: `/profile/${player.id}`, tone: "accent" }
        }
      }))
  ).sort((left, right) => Date.parse(right.cells.date.value) - Date.parse(left.cells.date.value));

  const placements = rows.map((row) => Number(row.cells.place.value)).filter(Number.isFinite);
  const medals = rows.filter((row) => row.cells.medal.value === "Medal").length;
  const events = new Set(rows.map((row) => row.cells.event.value));

  return {
    title: "Tournament results report",
    description: "One row per credited student result, including partner events imported for multiple team members.",
    dateFilterApplies: true,
    columns: [
      { key: "date", label: "Date" },
      { key: "tournament", label: "Tournament" },
      { key: "event", label: "Event" },
      { key: "student", label: "Credited student" },
      { key: "team", label: "Team" },
      { key: "place", label: "Place", align: "right" },
      { key: "medal", label: "Medal" },
      { key: "sos", label: "SOS", align: "right" },
      { key: "points", label: "Event points", align: "right" },
      { key: "source", label: "Source" }
    ] satisfies AdminReportColumn[],
    rows,
    summary: [
      { label: "Credited results", value: String(rows.length), detail: "Student-result records" },
      { label: "Events", value: String(events.size), detail: "Distinct events" },
      { label: "Average place", value: placements.length ? displayNumber(average(placements)) : "—", detail: "Across filtered results" },
      { label: "Medals", value: String(medals), detail: "At imported cutoffs" }
    ],
    emptyMessage: "No tournament results match this date range and roster selection."
  };
}

async function testoffReport(players: PlayerDetail[], filters: AdminReportFilters) {
  const dashboard = await loadTestoffDashboardData();
  const playerById = new Map(players.map((player) => [player.id, player]));
  const rows = dashboard.eventRankings.flatMap((group) =>
    group.sessions.flatMap((session) => {
      if (!rowDateMatches(session.date, filters)) return [];
      return session.results.flatMap<AdminReportRow>((result) => {
        const player = playerById.get(result.studentId);
        if (filters.studentId && result.studentId !== filters.studentId) return [];
        if (filters.teamId && (!player || teamIdFor(player) !== filters.teamId)) return [];
        return [{
          id: `${session.id}:${result.id}`,
          cells: {
            date: { value: displayDate(session.date), tone: "muted" },
            season: { value: group.seasonName },
            event: { value: group.eventName, href: `/testoffs?season=${group.seasonId}&event=${group.eventId}` },
            session: { value: session.name },
            student: { value: result.studentName, href: player ? `/profile/${result.studentId}` : undefined },
            team: { value: player ? teamLabel(player) : "Unknown", href: player ? teamHref(player) : undefined, tone: "muted" },
            rawScore: { value: `${displayNumber(result.rawScore, 2)} / ${displayNumber(session.maxScore, 2)}` },
            rank: { value: String(result.rank), tone: result.rank <= 3 ? "success" : "default" },
            rankingScore: { value: displayNumber(result.rankingScore, 2), tone: "accent" },
            source: { value: "Manage scores", href: "/admin/testoffs", tone: "accent" }
          }
        }];
      });
    })
  ).sort((left, right) => Date.parse(right.cells.date.value) - Date.parse(left.cells.date.value));

  const students = new Set(rows.map((row) => row.cells.student.value));
  const events = new Set(rows.map((row) => row.cells.event.value));
  const scores = rows.map((row) => Number(row.cells.rankingScore.value.replaceAll(",", ""))).filter(Number.isFinite);

  return {
    title: "Testoff results report",
    description: "Published raw scores and normalized ranking scores from every matching testoff session.",
    dateFilterApplies: true,
    columns: [
      { key: "date", label: "Date" },
      { key: "season", label: "Season" },
      { key: "event", label: "Event" },
      { key: "session", label: "Session" },
      { key: "student", label: "Student" },
      { key: "team", label: "Team" },
      { key: "rawScore", label: "Raw score", align: "right" },
      { key: "rank", label: "Rank", align: "right" },
      { key: "rankingScore", label: "Weighted score", align: "right" },
      { key: "source", label: "Source" }
    ] satisfies AdminReportColumn[],
    rows,
    summary: [
      { label: "Results", value: String(rows.length), detail: "Published score records" },
      { label: "Students", value: String(students.size), detail: "Distinct participants" },
      { label: "Events", value: String(events.size), detail: "With matching sessions" },
      { label: "Average weighted score", value: scores.length ? displayNumber(average(scores), 2) : "—", detail: dashboard.configured ? "Across filtered results" : "Testoffs not configured" }
    ],
    emptyMessage: dashboard.configured
      ? "No testoff results match this date range and roster selection."
      : "Testoff reporting will appear after Supabase and a testoff season are configured."
  };
}

function teamReport(teams: TeamComparison[], players: PlayerDetail[], filters: AdminReportFilters) {
  const unassigned = players.filter((player) => !player.teamId);
  const reportTeams = unassigned.length
    ? [
        ...teams,
        {
          id: "unassigned",
          schoolName: "",
          designation: "Unassigned",
          teamReadiness: average(unassigned.map((player) => player.readinessScore)),
          members: unassigned,
          topStudy: [...unassigned]
            .filter((player) => typeof player.studyRating === "number")
            .sort((left, right) => (right.studyRating ?? 0) - (left.studyRating ?? 0))[0],
          topBuild: [...unassigned]
            .filter((player) => typeof player.buildRating === "number")
            .sort((left, right) => (right.buildRating ?? 0) - (left.buildRating ?? 0))[0]
        } satisfies TeamComparison
      ]
    : teams;
  const filteredTeams = reportTeams.filter((team) => {
    if (filters.teamId && team.id !== filters.teamId) return false;
    if (filters.studentId && !team.members.some((member) => member.id === filters.studentId)) return false;
    return true;
  });
  const rows = filteredTeams.map<AdminReportRow>((team) => {
    const readyCount = team.members.filter((member) => member.readinessStatus === "Ready" || member.readinessStatus === "On track").length;
    const evidenceCount = team.members.filter((member) => !member.readinessIsProvisional).length;
    return {
      id: team.id,
      cells: {
        team: { value: team.id === "unassigned" ? "Unassigned" : (team.name || `${team.schoolName} ${team.designation}`), href: team.id === "unassigned" ? "/teams" : `/teams?team=${encodeURIComponent(team.designation)}` },
        members: { value: String(team.members.length) },
        readiness: { value: `${displayNumber(team.teamReadiness)}/100`, tone: "accent" },
        ready: { value: `${readyCount} / ${team.members.length}` },
        completeEvidence: { value: `${evidenceCount} / ${team.members.length}` },
        topStudy: team.topStudy
          ? { value: `${team.topStudy.name} · ${displayNumber(team.topStudy.studyRating ?? 0)}`, href: `/profile/${team.topStudy.id}` }
          : { value: "—", tone: "muted" },
        topBuild: team.topBuild
          ? { value: `${team.topBuild.name} · ${displayNumber(team.topBuild.buildRating ?? 0)}`, href: `/profile/${team.topBuild.id}` }
          : { value: "—", tone: "muted" },
        lastSos: { value: typeof team.lastSos === "number" ? displayNumber(team.lastSos, 2) : "—", tone: typeof team.lastSos === "number" ? "default" : "muted" },
        source: { value: "Manage roster", href: `/admin/manage?tab=roster#admin-team-${team.id}`, tone: "accent" }
      }
    };
  });
  const allMembers = filteredTeams.flatMap((team) => team.members);

  return {
    title: "Team summary report",
    description: "A current comparison of roster coverage, readiness, and top study and build contributors.",
    dateFilterApplies: false,
    columns: [
      { key: "team", label: "Team" },
      { key: "members", label: "Members", align: "right" },
      { key: "readiness", label: "Readiness", align: "right" },
      { key: "ready", label: "Ready / on track", align: "right" },
      { key: "completeEvidence", label: "Complete evidence", align: "right" },
      { key: "topStudy", label: "Top study" },
      { key: "topBuild", label: "Top build" },
      { key: "lastSos", label: "Latest SOS", align: "right" },
      { key: "source", label: "Source" }
    ] satisfies AdminReportColumn[],
    rows,
    summary: [
      { label: "Teams", value: String(filteredTeams.length), detail: "In this report" },
      { label: "Rostered students", value: String(allMembers.length), detail: "Current memberships" },
      { label: "Average readiness", value: filteredTeams.length ? `${displayNumber(average(filteredTeams.map((team) => team.teamReadiness)))}/100` : "—", detail: "Across filtered teams" },
      { label: "Complete evidence", value: String(allMembers.filter((member) => !member.readinessIsProvisional).length), detail: "Non-provisional students" }
    ],
    emptyMessage: "No teams match this roster selection."
  };
}

function filterDescription(
  filters: AdminReportFilters,
  students: AdminReportOption[],
  teams: AdminReportOption[],
  dateFilterApplies: boolean
) {
  const parts: string[] = [];
  if (filters.studentId) parts.push(students.find((student) => student.id === filters.studentId)?.label ?? "Selected student");
  if (filters.teamId) parts.push(teams.find((team) => team.id === filters.teamId)?.label ?? "Selected team");
  if (dateFilterApplies && (filters.from || filters.to)) {
    parts.push(filters.from && filters.to
      ? `${displayDate(filters.from)}–${displayDate(filters.to)}`
      : filters.from
        ? `Since ${displayDate(filters.from)}`
        : `Through ${displayDate(filters.to)}`);
  }
  return parts.length ? parts.join(" · ") : "All available records";
}

export async function buildAdminReport(input: AdminReportFilterInput): Promise<AdminReportData> {
  const filters = normalizeAdminReportFilters(input);
  const analytics = await getAnalyticsForRequest();
  const players = analytics.getLeaderboardPlayers();
  const teams = analytics.getTeamComparisons();
  const studentOptions = [...players]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((player) => ({ id: player.id, label: player.name }));
  const teamOptions = teams
    .map((team) => ({ id: team.id, label: `${team.schoolName} ${team.designation}` }))
    .sort((left, right) => left.label.localeCompare(right.label));
  if (players.some((player) => !player.teamId)) teamOptions.push({ id: "unassigned", label: "Unassigned" });

  const report = filters.type === "points"
    ? pointReport(players, filters)
    : filters.type === "tournaments"
      ? tournamentReport(players, filters)
      : filters.type === "testoffs"
        ? await testoffReport(players, filters)
        : filters.type === "teams"
          ? teamReport(teams, players, filters)
          : readinessReport(players, filters);

  return {
    type: filters.type,
    title: report.title,
    description: report.description,
    dateFilterApplies: report.dateFilterApplies,
    generatedAt: new Date().toISOString(),
    filters,
    filterDescription: filterDescription(filters, studentOptions, teamOptions, report.dateFilterApplies),
    columns: report.columns,
    rows: report.rows,
    summary: report.summary,
    studentOptions,
    teamOptions,
    emptyMessage: report.emptyMessage
  };
}

function safeCsvValue(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function adminReportCsv(report: AdminReportData) {
  return [
    report.columns.map((column) => csvEscape(column.label)).join(","),
    ...report.rows.map((row) => report.columns
      .map((column) => csvEscape(safeCsvValue(row.cells[column.key]?.value ?? "")))
      .join(","))
  ].join("\n");
}

export function adminReportFilename(report: AdminReportData) {
  return `scioly-${report.type}-report-${report.generatedAt.slice(0, 10)}.csv`;
}

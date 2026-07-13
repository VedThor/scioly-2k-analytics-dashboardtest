import "server-only";

import { unstable_cache } from "next/cache";
import { analyticsCacheTag } from "@/lib/analytics-cache";
import { mockStudents, mockTeamMembers, mockTeams } from "@/lib/seed";
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from "@/lib/supabase";

export interface SearchDirectory {
  students: Array<{ id: string; name: string; grade: number; profileEvents: string[] }>;
  teams: Array<{ id: string; schoolName: string; designation: string }>;
  memberships: Array<{ teamId: string; studentId: string }>;
  testoffs: Array<{ id: number; seasonId: number; eventId: number; seasonName: string; eventName: string; name: string; date: string }>;
}

async function loadLiveSearchDirectory(): Promise<SearchDirectory> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Search directory storage is not configured.");

  const [students, teams, memberships, events, seasons, sessions] = await Promise.all([
    supabase.from("students").select("id,name,grade,profile_events"),
    supabase.from("teams").select("id,school_name,team_designation"),
    supabase.from("team_members").select("team_id,student_id"),
    supabase.from("events").select("id,name"),
    supabase.from("seasons").select("id,name"),
    supabase.from("testoff_sessions").select("id,season_id,event_id,name,date")
  ]);
  const error = students.error ?? teams.error ?? memberships.error ?? events.error ?? seasons.error ?? sessions.error;
  if (error) throw new Error("Could not load the search directory.");
  const eventNames = new Map((events.data ?? []).map((event) => [Number(event.id), String(event.name)]));
  const seasonNames = new Map((seasons.data ?? []).map((season) => [Number(season.id), String(season.name)]));

  return {
    students: (students.data ?? []).map((student) => ({
      id: String(student.id),
      name: String(student.name),
      grade: Number(student.grade ?? 9),
      profileEvents: Array.isArray(student.profile_events)
        ? student.profile_events.filter((event): event is string => typeof event === "string")
        : []
    })),
    teams: (teams.data ?? []).map((team) => ({
      id: String(team.id),
      schoolName: String(team.school_name),
      designation: String(team.team_designation)
    })),
    memberships: (memberships.data ?? []).map((membership) => ({
      teamId: String(membership.team_id),
      studentId: String(membership.student_id)
    })),
    testoffs: (sessions.data ?? []).map((session) => ({
      id: Number(session.id),
      seasonId: Number(session.season_id),
      eventId: Number(session.event_id),
      seasonName: seasonNames.get(Number(session.season_id)) ?? "Season",
      eventName: eventNames.get(Number(session.event_id)) ?? "Event",
      name: String(session.name),
      date: String(session.date)
    }))
  };
}

const loadCachedLiveSearchDirectory = unstable_cache(
  loadLiveSearchDirectory,
  ["workspace-search-directory"],
  { revalidate: 60, tags: [analyticsCacheTag] }
);

function demoSearchDirectory(): SearchDirectory {
  return {
    students: mockStudents.map((student) => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      profileEvents: student.profileEvents ?? []
    })),
    teams: mockTeams.map((team) => ({
      id: team.id,
      schoolName: team.schoolName,
      designation: team.teamDesignation
    })),
    memberships: mockTeamMembers.map((membership) => ({
      teamId: membership.teamId,
      studentId: membership.studentId
    })),
    testoffs: []
  };
}

export async function getSearchDirectory(): Promise<SearchDirectory> {
  if (hasSupabaseConfig()) return loadCachedLiveSearchDirectory();
  if (isDemoMode()) return demoSearchDirectory();
  return { students: [], teams: [], memberships: [], testoffs: [] };
}

import { NextResponse } from "next/server";
import { getCurrentDemoUser } from "@/lib/analytics";
import { invalidateAnalyticsCache } from "@/lib/analytics-cache";
import { getAuthenticatedStudent } from "@/lib/auth";
import { mockTeams } from "@/lib/seed";
import { getSupabaseAdmin, isDemoMode } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface RosterGroupInput {
  teamId?: string;
  memberIds?: string[];
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as { groups?: RosterGroupInput[] } | null;
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before editing rosters." }, { status: 401 });
  }
  if (currentUser.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can edit rosters." }, { status: 403 });
  }
  if (!Array.isArray(body?.groups) || body.groups.length === 0) {
    return NextResponse.json({ ok: false, error: "At least one roster group is required." }, { status: 400 });
  }

  const groups = body.groups.map((group) => ({
    teamId: typeof group.teamId === "string" ? group.teamId : "",
    memberIds: Array.isArray(group.memberIds)
      ? group.memberIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : []
  }));
  const seenStudents = new Set<string>();
  for (const group of groups) {
    if (!group.teamId) {
      return NextResponse.json({ ok: false, error: "Every roster group needs an ID." }, { status: 400 });
    }
    for (const studentId of group.memberIds) {
      if (seenStudents.has(studentId)) {
        return NextResponse.json(
          { ok: false, error: "A student cannot be assigned to more than one team." },
          { status: 400 }
        );
      }
      seenStudents.add(studentId);
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, message: "Demo roster updated for this browser session." });
  }

  const [teamResult, membershipResult] = await Promise.all([
    supabase.from("teams").select("id"),
    supabase.from("team_members").select("team_id,student_id")
  ]);
  const beforeGroups = (teamResult.data ?? []).map((team) => ({
    teamId: String(team.id),
    memberIds: (membershipResult.data ?? [])
      .filter((membership) => String(membership.team_id) === String(team.id))
      .map((membership) => String(membership.student_id))
  }));

  const { error: rosterError } = await supabase.rpc("replace_team_memberships", {
    roster_groups: groups
  });
  if (rosterError) {
    return NextResponse.json({ ok: false, error: rosterError.message }, { status: 409 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: currentUser.id,
    action: "roster.replace",
    target: "Team rosters",
    reason: "Admin roster editor save",
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    entity_table: "team_members",
    entity_id: "all",
    payload_before: { groups: beforeGroups },
    payload_after: { groups },
    undo_action: "roster.restore",
    is_reversible: true
  });
  if (auditError) {
    const { error: rollbackError } = await supabase.rpc("replace_team_memberships", {
      roster_groups: beforeGroups
    });
    return NextResponse.json(
      {
        ok: false,
        error: rollbackError
          ? `Could not audit or roll back the roster change: ${auditError.message}; ${rollbackError.message}`
          : "The roster change was cancelled because its audit record could not be saved."
      },
      { status: 500 }
    );
  }

  invalidateAnalyticsCache();
  return NextResponse.json({ ok: true, message: "Team rosters saved." });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as { teamId?: string } | null;
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);
  if (!currentUser) return NextResponse.json({ ok: false, error: "Sign in before removing a team." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ ok: false, error: "Only admins can remove teams." }, { status: 403 });
  const teamId = body?.teamId?.trim();
  if (!teamId) return NextResponse.json({ ok: false, error: "A team is required." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const team = mockTeams.find((entry) => entry.id === teamId);
    if (!team || team.teamDesignation.toUpperCase() !== "C") {
      return NextResponse.json({ ok: false, error: "Only C Team can be removed from this control." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, persisted: false, message: "Demo: C Team removed for this view." });
  }

  const [teamResult, memberResult] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("team_members").select("student_id").eq("team_id", teamId)
  ]);
  if (teamResult.error) return NextResponse.json({ ok: false, error: teamResult.error.message }, { status: 500 });
  if (memberResult.error) return NextResponse.json({ ok: false, error: memberResult.error.message }, { status: 500 });
  const team = teamResult.data;
  if (!team) return NextResponse.json({ ok: false, error: "Team not found." }, { status: 404 });
  if (String(team.team_designation).toUpperCase() !== "C") {
    return NextResponse.json({ ok: false, error: "Only C Team can be removed from this control." }, { status: 400 });
  }

  const memberIds = (memberResult.data ?? []).map((membership) => String(membership.student_id));
  const { error: deleteError } = await supabase.from("teams").delete().eq("id", teamId);
  if (deleteError) return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: currentUser.id,
    action: "team.delete",
    target: `${team.school_name} C Team`,
    reason: "Admin removed C Team",
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    entity_table: "teams",
    entity_id: teamId,
    payload_before: { team, memberIds },
    undo_action: "team.restore",
    is_reversible: true
  });
  if (auditError) {
    const { error: teamRestoreError } = await supabase.from("teams").insert(team);
    let memberRestoreError: { message: string } | null = null;
    if (!teamRestoreError && memberIds.length > 0) {
      const restored = await supabase.from("team_members").insert(
        memberIds.map((studentId) => ({ team_id: teamId, student_id: studentId }))
      );
      memberRestoreError = restored.error;
    }
    const rollbackError = teamRestoreError ?? memberRestoreError;
    return NextResponse.json(
      { ok: false, error: rollbackError ? `Could not audit or restore C Team: ${auditError.message}; ${rollbackError.message}` : "C Team removal was cancelled because its audit record could not be saved." },
      { status: 500 }
    );
  }

  invalidateAnalyticsCache();
  return NextResponse.json({ ok: true, persisted: true, message: "C Team removed. Its members are now unassigned, and the change can be undone from the audit log." });
}

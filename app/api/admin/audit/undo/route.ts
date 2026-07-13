import { NextResponse } from "next/server";
import { getAuthenticatedStudent } from "@/lib/auth";
import { getCurrentDemoUser } from "@/lib/analytics";
import { invalidateAnalyticsCache } from "@/lib/analytics-cache";
import { invalidateLibraryCache } from "@/lib/library-data";
import { getSupabaseAdmin, isDemoMode } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const pointActivityTypes = new Set([
  "solo_study",
  "partner_study",
  "solo_practice_test",
  "partner_practice_test",
  "build_testing",
  "id_specimens",
  "custom_activity"
]);

function restorablePoint(before: Record<string, unknown>, entityId: string) {
  const id = Number(before.id);
  const points = Number(before.points);
  const minutes = Number(before.minutes ?? 0);
  const status = before.status;
  const activityType = before.activity_type;
  const studentId = before.student_id;
  const isApproved = before.is_approved === true;
  const approvedAt = before.approved_at ?? null;
  const approvedBy = before.approved_by ?? null;

  if (
    !Number.isInteger(id) || id <= 0 || String(id) !== entityId ||
    typeof studentId !== "string" || !studentId ||
    typeof activityType !== "string" || !pointActivityTypes.has(activityType) ||
    !Number.isInteger(points) || points < 1 || points > 500 ||
    !Number.isInteger(minutes) || minutes < 0 || minutes > 240 ||
    (status !== "pending" && status !== "approved" && status !== "rejected")
  ) return null;

  const validApprovalState = status === "pending"
    ? !isApproved && approvedAt === null && approvedBy === null
    : status === "approved"
      ? isApproved && typeof approvedAt === "string" && typeof approvedBy === "string"
      : !isApproved && typeof approvedAt === "string" && typeof approvedBy === "string";
  if (!validApprovalState) return null;

  return {
    id,
    student_id: studentId,
    activity_type: activityType,
    points,
    minutes,
    quantity: before.quantity ?? null,
    custom_label: before.custom_label ?? null,
    custom_category_id: before.custom_category_id ?? null,
    metadata: before.metadata && typeof before.metadata === "object" ? before.metadata : {},
    is_approved: isApproved,
    status,
    submitted_at: before.submitted_at,
    approved_at: approvedAt,
    approved_by: approvedBy,
    notes: before.notes ?? null
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { auditId?: number; reason?: string };
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before undoing audit actions." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can undo audit actions." }, { status: 403 });
  }

  if (!body.auditId) {
    return NextResponse.json({ ok: false, error: "Audit log ID is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, message: "Static demo: audit reversal staged locally." });
  }

  const { data: audit, error: auditError } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("id", body.auditId)
    .maybeSingle();

  if (auditError || !audit) {
    return NextResponse.json({ ok: false, error: auditError?.message ?? "Audit log not found." }, { status: 404 });
  }

  if (!audit.is_reversible || audit.reversed_at) {
    return NextResponse.json({ ok: false, error: "This audit entry cannot be undone." }, { status: 409 });
  }

  const entityTable = String(audit.entity_table ?? "");
  const entityId = String(audit.entity_id ?? "");
  const undoAction = String(audit.undo_action ?? "");
  const before = audit.payload_before && typeof audit.payload_before === "object" ? audit.payload_before as Record<string, unknown> : null;
  const after = audit.payload_after && typeof audit.payload_after === "object" ? audit.payload_after as Record<string, unknown> : null;
  let restoredPointId: number | null = null;
  let restoredTeamId: string | null = null;
  let previousLibraryRow: Record<string, unknown> | null = null;

  if (undoAction === "tournament.delete" && entityId) {
    const { error } = await supabase.from("tournaments").delete().eq("id", Number(entityId));
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    const createdEventIds = Array.isArray(after?.createdEventIds) ? after.createdEventIds.map(Number).filter(Number.isFinite) : [];
    if (createdEventIds.length > 0) await supabase.from("events").delete().in("id", createdEventIds);
  } else if (undoAction === "points.delete" && entityId) {
    const { data: pointLog, error: loadError } = await supabase.from("grind_points").select("status").eq("id", Number(entityId)).maybeSingle();
    if (loadError) return NextResponse.json({ ok: false, error: loadError.message }, { status: 500 });
    if (!pointLog) return NextResponse.json({ ok: false, error: "This point submission no longer exists." }, { status: 409 });
    if (pointLog.status !== "pending" && audit.action !== "points.admin_create") {
      return NextResponse.json({ ok: false, error: "Undo the officer review before removing this submission." }, { status: 409 });
    }
    const { error } = await supabase.from("grind_points").delete().eq("id", Number(entityId));
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "points.restore" && entityTable === "grind_points" && entityId && before) {
    const restoredPoint = restorablePoint(before, entityId);
    if (!restoredPoint) {
      return NextResponse.json({ ok: false, error: "The deleted point snapshot is incomplete or invalid." }, { status: 409 });
    }
    const { data: existingPoint, error: existingError } = await supabase
      .from("grind_points")
      .select("id")
      .eq("id", restoredPoint.id)
      .maybeSingle();
    if (existingError) return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
    if (existingPoint) return NextResponse.json({ ok: false, error: "This point entry already exists." }, { status: 409 });
    const { error } = await supabase.from("grind_points").insert({
      ...restoredPoint,
      metadata: {
        ...(restoredPoint.metadata as Record<string, unknown>),
        audit_restore: true
      }
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    restoredPointId = restoredPoint.id;
  } else if ((undoAction === "points.unapprove" || undoAction === "points.restore_pending") && entityId && before) {
    const { error } = await supabase
      .from("grind_points")
      .update({
        status: before.status ?? "pending",
        is_approved: before.is_approved ?? false,
        approved_at: before.approved_at ?? null,
        approved_by: before.approved_by ?? null,
        notes: before.notes ?? null
      })
      .eq("id", Number(entityId));
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "student.restore" && entityId && before) {
    const { error } = await supabase
      .from("students")
      .update({
        name: before.name,
        grade: before.grade,
        role: before.role,
        profile_events: before.profile_events ?? []
      })
      .eq("id", entityId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if ((undoAction === "category.restore" || undoAction === "category.deactivate") && entityId) {
    const update = before
      ? { name: before.name, default_points: before.default_points, max_points: before.max_points, is_active: before.is_active }
      : { is_active: false };
    const { error } = await supabase.from("custom_point_categories").update(update).eq("id", Number(entityId));
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "roster.restore" && before && Array.isArray(before.groups)) {
    const { error } = await supabase.rpc("replace_team_memberships", { roster_groups: before.groups });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "team.restore" && entityTable === "teams" && entityId && before) {
    const team = before.team && typeof before.team === "object" && !Array.isArray(before.team)
      ? before.team as Record<string, unknown>
      : null;
    const memberIds = Array.isArray(before.memberIds)
      ? before.memberIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    if (!team || String(team.id ?? "") !== entityId || String(team.team_designation ?? "").toUpperCase() !== "C") {
      return NextResponse.json({ ok: false, error: "The deleted C Team snapshot is incomplete or invalid." }, { status: 409 });
    }
    const { data: existingTeam, error: existingTeamError } = await supabase.from("teams").select("id").eq("id", entityId).maybeSingle();
    if (existingTeamError) return NextResponse.json({ ok: false, error: existingTeamError.message }, { status: 500 });
    if (existingTeam) return NextResponse.json({ ok: false, error: "C Team already exists." }, { status: 409 });
    const { error: teamError } = await supabase.from("teams").insert(team);
    if (teamError) return NextResponse.json({ ok: false, error: teamError.message }, { status: 409 });
    if (memberIds.length > 0) {
      const { error: memberError } = await supabase.from("team_members").insert(
        memberIds.map((studentId) => ({ team_id: entityId, student_id: studentId }))
      );
      if (memberError) {
        await supabase.from("teams").delete().eq("id", entityId);
        return NextResponse.json({ ok: false, error: memberError.message }, { status: 409 });
      }
    }
    restoredTeamId = entityId;
  } else if (undoAction === "library.remove" && entityTable === "library_items" && entityId) {
    const libraryId = Number(entityId);
    if (!Number.isInteger(libraryId) || libraryId <= 0) {
      return NextResponse.json({ ok: false, error: "The library item ID is invalid." }, { status: 409 });
    }
    const { data: current, error: loadError } = await supabase.from("library_items").select("*").eq("id", libraryId).maybeSingle();
    if (loadError) return NextResponse.json({ ok: false, error: loadError.message }, { status: 500 });
    if (!current) return NextResponse.json({ ok: false, error: "This library item no longer exists." }, { status: 409 });
    previousLibraryRow = current as Record<string, unknown>;
    const { error } = await supabase
      .from("library_items")
      .update({ is_active: false, updated_by: currentUser.id, updated_at: new Date().toISOString() })
      .eq("id", libraryId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "library.restore" && entityTable === "library_items" && entityId && before) {
    const libraryId = Number(entityId);
    if (!Number.isInteger(libraryId) || libraryId <= 0 || Number(before.id) !== libraryId) {
      return NextResponse.json({ ok: false, error: "The library item snapshot is invalid." }, { status: 409 });
    }
    const { data: current, error: loadError } = await supabase.from("library_items").select("*").eq("id", libraryId).maybeSingle();
    if (loadError) return NextResponse.json({ ok: false, error: loadError.message }, { status: 500 });
    if (!current) return NextResponse.json({ ok: false, error: "This library item no longer exists." }, { status: 409 });
    previousLibraryRow = current as Record<string, unknown>;
    const { id: _id, ...snapshot } = before;
    const { error } = await supabase.from("library_items").update(snapshot).eq("id", libraryId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "testoff.delete" && entityId) {
    const { error } = await supabase.from("testoff_sessions").delete().eq("id", Number(entityId));
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } else if (undoAction === "testoff.restore" && before) {
    const session = before.session && typeof before.session === "object" ? before.session as Record<string, unknown> : null;
    const results = Array.isArray(before.results) ? before.results as Array<Record<string, unknown>> : [];
    if (!session) return NextResponse.json({ ok: false, error: "The deleted testoff snapshot is incomplete." }, { status: 409 });
    const { error: sessionError } = await supabase.from("testoff_sessions").insert(session);
    if (sessionError) return NextResponse.json({ ok: false, error: sessionError.message }, { status: 409 });
    if (results.length > 0) {
      const restoredResults = results.map((result) => ({
        id: result.id,
        session_id: result.session_id,
        student_id: result.student_id,
        raw_score: result.raw_score,
        rank: result.rank,
        notes: result.notes ?? null,
        entered_by: result.entered_by ?? currentUser.id,
        created_at: result.created_at
      }));
      const { error: resultError } = await supabase.from("testoff_results").insert(restoredResults);
      if (resultError) {
        await supabase.from("testoff_sessions").delete().eq("id", Number(session.id));
        return NextResponse.json({ ok: false, error: resultError.message }, { status: 409 });
      }
    }
  } else {
    return NextResponse.json({ ok: false, error: `Undo is not implemented for ${undoAction || entityTable || "this action"}.` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error: markError } = await supabase
    .from("audit_logs")
    .update({
      reversed_at: now,
      reversed_by: currentUser.id
    })
    .eq("id", body.auditId);

  if (markError) {
    if (restoredPointId !== null) {
      await supabase.from("grind_points").delete().eq("id", restoredPointId);
    }
    if (restoredTeamId !== null) {
      await supabase.from("teams").delete().eq("id", restoredTeamId);
    }
    if (previousLibraryRow) {
      const { id, ...snapshot } = previousLibraryRow;
      await supabase.from("library_items").update(snapshot).eq("id", Number(id));
    }
    return NextResponse.json({ ok: false, error: markError.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: currentUser.id,
    action: "audit.undo",
    target: audit.target,
    reason: body.reason ?? "Admin undo",
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    entity_table: entityTable || null,
    entity_id: entityId || null,
    payload_before: audit.payload_after,
    payload_after: audit.payload_before,
    undo_action: null,
    is_reversible: false,
    reversal_of: body.auditId
  });

  invalidateAnalyticsCache();
  if (entityTable === "library_items") invalidateLibraryCache();
  return NextResponse.json({ ok: true, message: `Reversed audit #${body.auditId}.` });
}

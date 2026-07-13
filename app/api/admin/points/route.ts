import { NextResponse } from "next/server";
import { activityLabels } from "@/lib/activity";
import { getCurrentDemoUser } from "@/lib/analytics";
import { invalidateAnalyticsCache } from "@/lib/analytics-cache";
import { getAuthenticatedStudent } from "@/lib/auth";
import { mockPointLogs, mockStudents } from "@/lib/seed";
import { getSupabaseAdmin, isDemoMode } from "@/lib/supabase";
import { roleMeets } from "@/lib/utils";
import type { ActivityType } from "@/lib/types";

export const dynamic = "force-dynamic";

function pointRow(
  row: Record<string, unknown>,
  studentNames: Map<string, string>
) {
  const studentId = String(row.student_id ?? "");
  const activityType = String(row.activity_type ?? "custom_activity") as ActivityType;
  return {
    id: Number(row.id),
    studentId,
    studentName: studentNames.get(studentId) ?? "Unknown student",
    activityType,
    activity: String(row.custom_label ?? "") || activityLabels[activityType] || "Custom activity",
    points: Number(row.points ?? 0),
    minutes: Number(row.minutes ?? 0),
    status: String(row.status ?? "pending"),
    submittedAt: String(row.submitted_at ?? ""),
    notes: typeof row.notes === "string" ? row.notes : null
  };
}

async function requireAdmin() {
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);
  if (!currentUser) {
    return { error: NextResponse.json({ ok: false, error: "Sign in before managing points." }, { status: 401 }) };
  }
  if (currentUser.role !== "admin") {
    return { error: NextResponse.json({ ok: false, error: "Only admins can manage points for other students." }, { status: 403 }) };
  }
  return { currentUser };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId")?.trim() || null;
  const requestedLimit = Number(url.searchParams.get("limit") ?? 200);
  const limit = Number.isInteger(requestedLimit) ? Math.min(500, Math.max(1, requestedLimit)) : 200;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const names = new Map(mockStudents.map((student) => [student.id, student.name]));
    const rows = mockPointLogs
      .filter((point) => !studentId || point.studentId === studentId)
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .slice(0, limit)
      .map((point) => ({
        id: point.id,
        studentId: point.studentId,
        studentName: names.get(point.studentId) ?? "Unknown student",
        activityType: point.activityType,
        activity: point.customLabel || point.activityType.replaceAll("_", " "),
        points: point.points,
        minutes: point.minutes,
        status: point.status,
        submittedAt: point.submittedAt,
        notes: point.notes ?? null
      }));
    return NextResponse.json({ ok: true, rows }, { headers: { "cache-control": "private, no-store" } });
  }

  let query = supabase
    .from("grind_points")
    .select("id,student_id,activity_type,custom_label,points,minutes,status,submitted_at,notes")
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (studentId) query = query.eq("student_id", studentId);

  const [pointResult, studentResult] = await Promise.all([
    query,
    supabase.from("students").select("id,name")
  ]);
  const error = pointResult.error ?? studentResult.error;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const studentNames = new Map(
    (studentResult.data ?? []).map((student) => [String(student.id), String(student.name)])
  );
  const rows = (pointResult.data ?? []).map((row) => pointRow(row as Record<string, unknown>, studentNames));
  return NextResponse.json({ ok: true, rows }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { currentUser } = auth;
  const body = (await request.json().catch(() => null)) as {
    studentId?: string;
    points?: number;
    minutes?: number;
    label?: string;
    reason?: string;
  } | null;

  const studentId = body?.studentId?.trim();
  const points = Number(body?.points);
  const minutes = Number(body?.minutes ?? 0);
  const label = body?.label?.trim();
  const reason = body?.reason?.trim();
  if (!studentId || !label || !reason) {
    return NextResponse.json({ ok: false, error: "Student, activity label, and reason are required." }, { status: 400 });
  }
  if (!Number.isInteger(points) || points < 1 || points > 500) {
    return NextResponse.json({ ok: false, error: "Points must be a whole number from 1 to 500." }, { status: 400 });
  }
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 240) {
    return NextResponse.json({ ok: false, error: "Minutes must be a whole number from 0 to 240." }, { status: 400 });
  }
  if (label.length > 100 || reason.length > 500) {
    return NextResponse.json({ ok: false, error: "Activity labels are limited to 100 characters and reasons to 500." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const student = mockStudents.find((entry) => entry.id === studentId);
    if (!student) return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      persisted: false,
      message: `Demo: ${points} points staged for ${student.name}.`,
      row: {
        id: Date.now(), studentId, studentName: student.name, activityType: "custom_activity",
        activity: label, points, minutes, status: "approved", submittedAt: new Date().toISOString(), notes: reason
      }
    });
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id,name")
    .eq("id", studentId)
    .maybeSingle();
  if (studentError) return NextResponse.json({ ok: false, error: studentError.message }, { status: 500 });
  if (!student) return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from("grind_points")
    .insert({
      student_id: studentId,
      activity_type: "custom_activity",
      custom_label: label,
      points,
      minutes,
      metadata: { source: "admin_manual" },
      status: "approved",
      is_approved: true,
      approved_at: now,
      approved_by: currentUser.id,
      notes: reason
    })
    .select("*")
    .single();
  if (insertError) return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: currentUser.id,
    action: "points.admin_create",
    target: `${student.name} · ${label}`,
    reason,
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    entity_table: "grind_points",
    entity_id: String(inserted.id),
    payload_after: inserted,
    undo_action: "points.delete",
    is_reversible: true
  });
  if (auditError) {
    const { error: rollbackError } = await supabase.from("grind_points").delete().eq("id", inserted.id);
    return NextResponse.json(
      { ok: false, error: rollbackError ? `Could not audit or roll back the point entry: ${auditError.message}; ${rollbackError.message}` : "The point entry was cancelled because its audit record could not be saved." },
      { status: 500 }
    );
  }

  invalidateAnalyticsCache();
  const names = new Map([[studentId, String(student.name)]]);
  return NextResponse.json({
    ok: true,
    persisted: true,
    message: `${points} approved points added for ${student.name}.`,
    row: pointRow(inserted as Record<string, unknown>, names)
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: number;
    decision?: "approved" | "rejected";
    notes?: string;
  };

  if (!body.id) {
    return NextResponse.json({ ok: false, error: "Point log ID is required." }, { status: 400 });
  }

  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ ok: false, error: "Decision must be approved or rejected." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before reviewing points." }, { status: 401 });
  }

  if (!roleMeets(currentUser.role, "officer")) {
    return NextResponse.json({ ok: false, error: "Officer access required." }, { status: 403 });
  }

  if (supabase) {
    const { data: before, error: loadError } = await supabase
      .from("grind_points")
      .select("*")
      .eq("id", body.id)
      .maybeSingle();
    if (loadError || !before) {
      return NextResponse.json(
        { ok: false, error: loadError?.message ?? "Point log not found." },
        { status: 404 }
      );
    }
    if (before.status !== "pending") {
      return NextResponse.json({ ok: false, error: "This point log has already been reviewed." }, { status: 409 });
    }
    const { error } = await supabase
      .from("grind_points")
      .update({
        is_approved: body.decision === "approved",
        status: body.decision,
        approved_at: new Date().toISOString(),
        approved_by: currentUser.id,
        notes: body.notes ?? null
      })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_id: currentUser.id,
      action: body.decision === "approved" ? "points.approve" : "points.reject",
      target: `Point log #${body.id}`,
      reason: body.notes ?? null,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      entity_table: "grind_points",
      entity_id: String(body.id),
      payload_before: before,
      payload_after: {
        status: body.decision,
        notes: body.notes ?? null
      },
      undo_action: body.decision === "approved" ? "points.unapprove" : "points.restore_pending",
      is_reversible: true
    });
    if (auditError) {
      await supabase
        .from("grind_points")
        .update({
          status: before.status,
          is_approved: before.is_approved,
          approved_at: before.approved_at,
          approved_by: before.approved_by,
          notes: before.notes
        })
        .eq("id", body.id);
      return NextResponse.json(
        { ok: false, error: "The review was rolled back because its undo record could not be saved." },
        { status: 500 }
      );
    }
    invalidateAnalyticsCache();
  }

  return NextResponse.json({
    ok: true,
    message:
      body.decision === "approved"
        ? "Point log approved. Preparation totals and readiness will update automatically."
        : "Point log rejected with audit note."
  });
}

import { NextResponse } from "next/server";
import { activityLabels, calculateActivityPoints } from "@/lib/activity";
import { invalidateAnalyticsCache } from "@/lib/analytics-cache";
import { getCurrentDemoUser } from "@/lib/analytics";
import { getAuthenticatedStudent } from "@/lib/auth";
import { mockPointLogs } from "@/lib/seed";
import {
  MAX_POINT_EVIDENCE_FILES,
  MAX_POINT_EVIDENCE_TOTAL_BYTES,
  normalizeGoogleDriveUrl,
  POINT_EVIDENCE_BUCKET,
  validateUploadDescriptor,
  type PointEvidenceUploadDescriptor,
  type StoredPointEvidence
} from "@/lib/point-evidence";
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from "@/lib/supabase";
import type { ActivityType } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function removeEvidenceUploads(supabase: AdminClient, files: PointEvidenceUploadDescriptor[]) {
  if (files.length === 0) return;
  await supabase.storage.from(POINT_EVIDENCE_BUCKET).remove(files.map((file) => file.storagePath));
}

async function verifyEvidenceUploads(supabase: AdminClient, studentId: string, files: PointEvidenceUploadDescriptor[]) {
  if (files.length === 0) return null;
  const batchId = files[0].storagePath.split("/")[1];
  if (!batchId || files.some((file) => file.storagePath.split("/")[1] !== batchId)) {
    return "Evidence files must come from the same upload batch.";
  }

  const { data, error } = await supabase.storage
    .from(POINT_EVIDENCE_BUCKET)
    .list(`${studentId}/${batchId}`, { limit: MAX_POINT_EVIDENCE_FILES + 5 });
  if (error) return "Uploaded evidence could not be verified.";

  for (const file of files) {
    const objectName = file.storagePath.split("/").at(-1);
    const stored = data?.find((entry) => entry.name === objectName);
    const storedSize = Number(stored?.metadata?.size);
    const storedMimeType = typeof stored?.metadata?.mimetype === "string" ? stored.metadata.mimetype.toLowerCase() : null;
    if (
      !stored ||
      (Number.isFinite(storedSize) && storedSize !== file.sizeBytes) ||
      (storedMimeType && storedMimeType !== file.mimeType)
    ) {
      return `${file.name} did not finish uploading. Please try again.`;
    }
  }
  return null;
}

function pointSnapshot(row: Record<string, unknown>) {
  return {
    id: row.id,
    student_id: row.student_id,
    activity_type: row.activity_type,
    points: row.points,
    minutes: row.minutes,
    quantity: row.quantity,
    custom_label: row.custom_label,
    custom_category_id: row.custom_category_id,
    metadata: row.metadata,
    is_approved: row.is_approved,
    status: row.status,
    submitted_at: row.submitted_at,
    approved_at: row.approved_at,
    approved_by: row.approved_by,
    notes: row.notes
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    studentId?: string;
    activityType?: ActivityType;
    minutes?: number;
    quantity?: number;
    customPoints?: number;
    customLabel?: string;
    customCategoryId?: number;
    activityDetails?: string;
    evidenceFiles?: unknown;
    evidenceLink?: string;
  } | null;

  if (!body || !body.activityType || !Object.prototype.hasOwnProperty.call(activityLabels, body.activityType)) {
    return NextResponse.json({ ok: false, error: "A valid activity is required." }, { status: 400 });
  }

  const numericInputs = [
    ["Minutes", body.minutes],
    ["Quantity", body.quantity],
    ["Custom points", body.customPoints]
  ] as const;

  for (const [label, value] of numericInputs) {
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return NextResponse.json(
        { ok: false, error: `${label} must be a non-negative number.` },
        { status: 400 }
      );
    }
  }

  if (
    body.customCategoryId !== undefined &&
    (!Number.isInteger(body.customCategoryId) || body.customCategoryId <= 0)
  ) {
    return NextResponse.json(
      { ok: false, error: "Custom category must be a positive integer." },
      { status: 400 }
    );
  }

  if (body.customLabel !== undefined && typeof body.customLabel !== "string") {
    return NextResponse.json({ ok: false, error: "Custom label must be text." }, { status: 400 });
  }
  if (body.activityDetails !== undefined && typeof body.activityDetails !== "string") {
    return NextResponse.json({ ok: false, error: "Activity details must be text." }, { status: 400 });
  }
  const activityDetails = body.activityDetails?.trim();
  if (body.activityType === "custom_activity" && !activityDetails) {
    return NextResponse.json({ ok: false, error: "Describe what you did for this custom activity." }, { status: 400 });
  }
  if (activityDetails && activityDetails.length > 500) {
    return NextResponse.json({ ok: false, error: "Activity details must be 500 characters or fewer." }, { status: 400 });
  }
  if (body.evidenceFiles !== undefined && !Array.isArray(body.evidenceFiles)) {
    return NextResponse.json({ ok: false, error: "Evidence files must be provided as a list." }, { status: 400 });
  }
  if (body.evidenceLink !== undefined && typeof body.evidenceLink !== "string") {
    return NextResponse.json({ ok: false, error: "Evidence link must be text." }, { status: 400 });
  }

  const authenticatedStudent = await getAuthenticatedStudent();
  const currentUser = authenticatedStudent ?? (isDemoMode() ? getCurrentDemoUser() : null);

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before submitting points." }, { status: 401 });
  }

  if (body.studentId !== undefined && body.studentId !== currentUser.id) {
    return NextResponse.json(
      { ok: false, error: "You can only submit points for your own account." },
      { status: 403 }
    );
  }

  const studentId = currentUser.id;
  const rawEvidenceFiles = Array.isArray(body.evidenceFiles) ? body.evidenceFiles : [];
  if (rawEvidenceFiles.length > MAX_POINT_EVIDENCE_FILES) {
    return NextResponse.json(
      { ok: false, error: `You can attach up to ${MAX_POINT_EVIDENCE_FILES} files to one submission.` },
      { status: 400 }
    );
  }

  const expectedBatchId = rawEvidenceFiles[0] && typeof rawEvidenceFiles[0] === "object" && !Array.isArray(rawEvidenceFiles[0])
    ? String((rawEvidenceFiles[0] as Record<string, unknown>).storagePath ?? "").split("/")[1]
    : undefined;
  const evidenceFiles = rawEvidenceFiles.map((entry) => validateUploadDescriptor(entry, studentId, expectedBatchId));
  if (evidenceFiles.some((entry) => !entry)) {
    return NextResponse.json({ ok: false, error: "One or more evidence uploads are invalid." }, { status: 400 });
  }
  const validatedEvidenceFiles = evidenceFiles as PointEvidenceUploadDescriptor[];
  const evidenceTotalBytes = validatedEvidenceFiles.reduce((total, file) => total + file.sizeBytes, 0);
  if (evidenceTotalBytes > MAX_POINT_EVIDENCE_TOTAL_BYTES) {
    return NextResponse.json({ ok: false, error: "Evidence files can total no more than 50 MB." }, { status: 400 });
  }

  const evidenceLinkInput = body.evidenceLink?.trim();
  const evidenceLink = normalizeGoogleDriveUrl(evidenceLinkInput);
  if (evidenceLinkInput && !evidenceLink) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid Google Drive or Google Docs sharing link." },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const submissionsToday = mockPointLogs.filter(
    (log) => log.studentId === studentId && log.submittedAt.slice(0, 10) === today
  ).length;

  if (isDemoMode() && submissionsToday >= 10) {
    return NextResponse.json({ ok: false, error: "Daily submission limit reached." }, { status: 429 });
  }

  const points = calculateActivityPoints({
    activityType: body.activityType,
    minutes: body.minutes,
    quantity: body.quantity,
    customPoints: body.customPoints
  });

  if (points <= 0) {
    return NextResponse.json({ ok: false, error: "Point value must be greater than zero." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (hasSupabaseConfig() && !supabase) {
    return NextResponse.json(
      { ok: false, error: "Point storage is not configured for this deployment." },
      { status: 503 }
    );
  }
  if (!supabase && validatedEvidenceFiles.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Evidence storage is not configured for this deployment." },
      { status: 503 }
    );
  }

  if (supabase) {
    const verificationError = await verifyEvidenceUploads(supabase, studentId, validatedEvidenceFiles);
    if (verificationError) {
      await removeEvidenceUploads(supabase, validatedEvidenceFiles);
      return NextResponse.json({ ok: false, error: verificationError }, { status: 400 });
    }
  }

  const evidence: StoredPointEvidence[] = [
    ...validatedEvidenceFiles.map((file) => ({
      id: file.id,
      kind: "file" as const,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storagePath: file.storagePath
    })),
    ...(evidenceLink ? [{
      id: crypto.randomUUID(),
      kind: "link" as const,
      name: "Google Drive evidence",
      externalUrl: evidenceLink
    }] : [])
  ];

  let acceptedPoints = points;
  let insertedLog: Record<string, unknown> | null = null;
  if (supabase) {
    const metadata: Record<string, unknown> = body.activityType === "custom_activity"
      ? { requestedLabel: body.customLabel ?? null, activityDetails }
      : {};
    if (evidence.length > 0) metadata.evidence = evidence;

    const { data, error } = await supabase
      .from("grind_points")
      .insert({
        student_id: studentId,
        activity_type: body.activityType,
        points,
        minutes: body.minutes ?? 0,
        quantity: body.quantity ?? null,
        custom_label: body.activityType === "custom_activity" ? body.customLabel?.trim() || "Custom Activity" : null,
        custom_category_id: body.customCategoryId ?? null,
        metadata,
        is_approved: false
      })
      .select("*")
      .single();

    if (error) {
      await removeEvidenceUploads(supabase, validatedEvidenceFiles);
      const limitReached = error.message.toLowerCase().includes("daily point log limit");
      return NextResponse.json(
        { ok: false, error: limitReached ? "Daily submission limit reached." : error.message },
        { status: limitReached ? 429 : 500 }
      );
    }
    acceptedPoints = Number(data?.points ?? points);
    insertedLog = data as Record<string, unknown>;
    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_id: currentUser.id,
      action: "points.submit",
      target: `Point log #${String(data?.id ?? "")}`,
      reason: "Member practice submission",
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      entity_table: "grind_points",
      entity_id: String(data?.id ?? ""),
      payload_after: insertedLog,
      undo_action: "points.delete",
      is_reversible: true
    });
    if (auditError) {
      await supabase.from("grind_points").delete().eq("id", Number(data?.id));
      await removeEvidenceUploads(supabase, validatedEvidenceFiles);
      return NextResponse.json(
        { ok: false, error: "The submission was rolled back because its undo record could not be saved." },
        { status: 500 }
      );
    }
    invalidateAnalyticsCache();
  }

  return NextResponse.json({
    ok: true,
    message: `${acceptedPoints} points submitted for officer approval.`,
    points: acceptedPoints,
    evidenceCount: evidence.length
  });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: number } | null;
  const pointId = Number(body?.id);
  if (!Number.isInteger(pointId) || pointId <= 0) {
    return NextResponse.json({ ok: false, error: "A valid point log ID is required." }, { status: 400 });
  }

  const authenticatedStudent = await getAuthenticatedStudent();
  const currentUser = authenticatedStudent ?? (isDemoMode() ? getCurrentDemoUser() : null);
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before removing points." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (hasSupabaseConfig() && !supabase) {
    return NextResponse.json(
      { ok: false, error: "Point storage is not configured for this deployment." },
      { status: 503 }
    );
  }

  if (!supabase) {
    const demoPoint = mockPointLogs.find((point) => point.id === pointId);
    if (!demoPoint || (currentUser.role !== "admin" && demoPoint.studentId !== currentUser.id)) {
      return NextResponse.json({ ok: false, error: "Point entry not found." }, { status: 404 });
    }
    if (currentUser.role !== "admin" && demoPoint.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Only pending entries can be withdrawn." }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      persisted: false,
      message: "Point entry removed from this demo view."
    });
  }

  const { data: existing, error: loadError } = await supabase
    .from("grind_points")
    .select("*")
    .eq("id", pointId)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ ok: false, error: loadError.message }, { status: 500 });
  }
  if (!existing || (currentUser.role !== "admin" && String(existing.student_id) !== currentUser.id)) {
    return NextResponse.json({ ok: false, error: "Point entry not found." }, { status: 404 });
  }
  if (currentUser.role !== "admin" && existing.status !== "pending") {
    return NextResponse.json({ ok: false, error: "Only pending entries can be withdrawn." }, { status: 409 });
  }

  const before = pointSnapshot(existing as Record<string, unknown>);
  let deleteQuery = supabase
    .from("grind_points")
    .delete()
    .eq("id", pointId);
  if (currentUser.role !== "admin") {
    deleteQuery = deleteQuery
      .eq("student_id", currentUser.id)
      .eq("status", "pending")
      .eq("is_approved", false)
      .is("approved_at", null)
      .is("approved_by", null);
  }
  const { data: deleted, error: deleteError } = await deleteQuery.select("id").maybeSingle();

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
  }
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "This point entry changed or was already removed." }, { status: 409 });
  }

  const isAdminRemoval = currentUser.role === "admin";
  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: currentUser.id,
    action: isAdminRemoval ? "points.delete" : "points.withdraw",
    target: `Point log #${pointId}`,
    reason: isAdminRemoval ? "Admin removed point record" : "Member withdrew pending submission",
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    entity_table: "grind_points",
    entity_id: String(pointId),
    payload_before: before,
    undo_action: "points.restore",
    is_reversible: true
  });

  if (auditError) {
    const { error: restoreError } = await supabase.from("grind_points").insert(before);
    return NextResponse.json(
      {
        ok: false,
        error: restoreError
          ? `Could not record or roll back the removal: ${auditError.message}; ${restoreError.message}`
          : "The removal was cancelled because its audit record could not be saved."
      },
      { status: 500 }
    );
  }

  invalidateAnalyticsCache();
  return NextResponse.json({
    ok: true,
    persisted: true,
    message: isAdminRemoval
      ? "Point entry removed. It can be restored from the audit log."
      : "Pending point entry withdrawn. An admin can restore it from the audit log."
  });
}

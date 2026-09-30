import { NextResponse } from "next/server";
import { getAuthenticatedStudent } from "@/lib/auth";
import {
  cleanEvidenceFileName,
  evidenceStorageExtension,
  normalizeEvidenceMimeType,
  MAX_POINT_EVIDENCE_FILES,
  MAX_POINT_EVIDENCE_FILE_BYTES,
  MAX_POINT_EVIDENCE_TOTAL_BYTES,
  POINT_EVIDENCE_BUCKET,
  storedPointEvidenceFromMetadata
} from "@/lib/point-evidence";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface RequestedFile {
  name: string;
  mimeType: string;
  sizeBytes: number;
}

async function requireEvidenceStorage() {
  const currentUser = await getAuthenticatedStudent();
  if (!currentUser) {
    return { error: NextResponse.json({ ok: false, error: "Sign in before uploading evidence." }, { status: 401 }) };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { error: NextResponse.json({ ok: false, error: "Evidence storage is not configured for this deployment." }, { status: 503 }) };
  }

  return { currentUser, supabase };
}

function validateRequestedFiles(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_POINT_EVIDENCE_FILES) {
    return { error: `Choose between 1 and ${MAX_POINT_EVIDENCE_FILES} evidence files.` };
  }

  const files: RequestedFile[] = [];
  let totalBytes = 0;
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { error: "One of the selected evidence files is invalid." };
    }
    const row = entry as Record<string, unknown>;
    if (typeof row.name !== "string" || typeof row.mimeType !== "string" || typeof row.sizeBytes !== "number") {
      return { error: "One of the selected evidence files is invalid." };
    }
    const name = cleanEvidenceFileName(row.name);
    const mimeType = normalizeEvidenceMimeType(name, row.mimeType);
    const sizeBytes = row.sizeBytes;
    if (!mimeType) {
      return { error: `${name} is not a supported image, audio, video, or PDF file.` };
    }
    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_POINT_EVIDENCE_FILE_BYTES) {
      return { error: `${name} must be 15 MB or smaller.` };
    }
    totalBytes += sizeBytes;
    files.push({ name, mimeType, sizeBytes });
  }

  if (totalBytes > MAX_POINT_EVIDENCE_TOTAL_BYTES) {
    return { error: "Evidence files can total no more than 50 MB per submission." };
  }
  return { files };
}

export async function POST(request: Request) {
  const auth = await requireEvidenceStorage();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { files?: unknown } | null;
  const validated = validateRequestedFiles(body?.files);
  if ("error" in validated) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const batchId = crypto.randomUUID();
  const uploads = [];
  for (const file of validated.files) {
    const id = crypto.randomUUID();
    const storagePath = `${auth.currentUser.id}/${batchId}/${id}${evidenceStorageExtension(file.mimeType)}`;
    const { data, error } = await auth.supabase.storage
      .from(POINT_EVIDENCE_BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token) {
      return NextResponse.json(
        { ok: false, error: "Evidence storage is unavailable. Ask an administrator to apply the latest Supabase schema." },
        { status: 503 }
      );
    }

    uploads.push({
      id,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storagePath,
      token: data.token
    });
  }

  return NextResponse.json(
    { ok: true, bucket: POINT_EVIDENCE_BUCKET, uploads },
    { headers: { "cache-control": "private, no-store" } }
  );
}

export async function DELETE(request: Request) {
  const auth = await requireEvidenceStorage();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { paths?: unknown } | null;
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter((path): path is string => typeof path === "string" && path.startsWith(`${auth.currentUser.id}/`)).slice(0, MAX_POINT_EVIDENCE_FILES)
    : [];
  if (paths.length === 0) {
    return NextResponse.json({ ok: false, error: "No evidence uploads were provided." }, { status: 400 });
  }

  const { data: pointRows, error: pointError } = await auth.supabase
    .from("grind_points")
    .select("metadata")
    .eq("student_id", auth.currentUser.id);
  if (pointError) return NextResponse.json({ ok: false, error: pointError.message }, { status: 500 });
  const attachedPaths = new Set(
    (pointRows ?? []).flatMap((row) => storedPointEvidenceFromMetadata(row.metadata))
      .flatMap((entry) => entry.kind === "file" ? [entry.storagePath] : [])
  );
  if (paths.some((path) => attachedPaths.has(path))) {
    return NextResponse.json(
      { ok: false, error: "Evidence that is already attached to a point submission cannot be removed as a staged upload." },
      { status: 409 }
    );
  }

  const { error } = await auth.supabase.storage.from(POINT_EVIDENCE_BUCKET).remove(paths);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

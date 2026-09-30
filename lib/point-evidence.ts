import type { PointEvidence } from "@/lib/types";

export const POINT_EVIDENCE_BUCKET = "point-evidence";
export const MAX_POINT_EVIDENCE_FILES = 5;
export const MAX_POINT_EVIDENCE_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_POINT_EVIDENCE_TOTAL_BYTES = 50 * 1024 * 1024;

export const POINT_EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm"
] as const;

const allowedMimeTypes = new Set<string>(POINT_EVIDENCE_MIME_TYPES);
const mimeTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg"
};
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm"
};
const evidenceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface StoredPointEvidenceFile {
  id: string;
  kind: "file";
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

export interface StoredPointEvidenceLink {
  id: string;
  kind: "link";
  name: string;
  externalUrl: string;
}

export type StoredPointEvidence = StoredPointEvidenceFile | StoredPointEvidenceLink;

export interface PointEvidenceUploadDescriptor {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

export function isSupportedPointEvidenceType(mimeType: string) {
  return allowedMimeTypes.has(mimeType.toLowerCase());
}

export function normalizeEvidenceMimeType(fileName: string, mimeType: string) {
  const normalized = mimeType.trim().toLowerCase();
  if (isSupportedPointEvidenceType(normalized)) return normalized;
  const extension = fileName.split(".").at(-1)?.toLowerCase();
  return extension ? mimeTypeByExtension[extension] ?? null : null;
}

export function cleanEvidenceFileName(value: string) {
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\\/]+/g, "-").trim();
  return (cleaned || "evidence-file").slice(0, 120);
}

export function evidenceStorageExtension(mimeType: string) {
  return extensionByMimeType[mimeType.toLowerCase()] ?? "";
}

export function normalizeGoogleDriveUrl(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (host !== "drive.google.com" && host !== "docs.google.com")
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function storedPointEvidenceFromMetadata(metadata: unknown): StoredPointEvidence[] {
  const metadataRecord = objectValue(metadata);
  if (!metadataRecord || !Array.isArray(metadataRecord.evidence)) return [];

  return metadataRecord.evidence.flatMap<StoredPointEvidence>((entry) => {
    const row = objectValue(entry);
    if (!row || typeof row.id !== "string" || !evidenceIdPattern.test(row.id)) return [];

    if (
      row.kind === "file" &&
      typeof row.name === "string" &&
      typeof row.mimeType === "string" &&
      typeof row.sizeBytes === "number" &&
      typeof row.storagePath === "string"
    ) {
      return [{
        id: row.id,
        kind: "file" as const,
        name: cleanEvidenceFileName(row.name),
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        storagePath: row.storagePath
      }];
    }

    if (row.kind === "link" && typeof row.name === "string" && typeof row.externalUrl === "string") {
      const externalUrl = normalizeGoogleDriveUrl(row.externalUrl);
      if (!externalUrl) return [];
      return [{
        id: row.id,
        kind: "link" as const,
        name: row.name.slice(0, 120) || "Google Drive evidence",
        externalUrl
      }];
    }

    return [];
  });
}

export function pointEvidenceForClient(pointId: number, metadata: unknown): PointEvidence[] {
  return storedPointEvidenceFromMetadata(metadata).map((entry) => entry.kind === "file"
    ? {
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        mimeType: entry.mimeType,
        sizeBytes: entry.sizeBytes,
        href: `/api/points/${pointId}/evidence/${entry.id}`
      }
    : {
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        href: entry.externalUrl
      });
}

export function validateUploadDescriptor(
  value: unknown,
  studentId: string,
  expectedBatchId?: string
): PointEvidenceUploadDescriptor | null {
  const row = objectValue(value);
  if (
    !row ||
    typeof row.id !== "string" ||
    !evidenceIdPattern.test(row.id) ||
    typeof row.name !== "string" ||
    typeof row.mimeType !== "string" ||
    typeof row.sizeBytes !== "number" ||
    typeof row.storagePath !== "string"
  ) return null;

  const segments = row.storagePath.split("/");
  if (
    segments.length !== 3 ||
    segments[0] !== studentId ||
    !evidenceIdPattern.test(segments[1]) ||
    (expectedBatchId && segments[1] !== expectedBatchId) ||
    !segments[2].startsWith(row.id)
  ) return null;

  const name = cleanEvidenceFileName(row.name);
  const mimeType = normalizeEvidenceMimeType(name, row.mimeType);
  if (
    !mimeType ||
    !Number.isInteger(row.sizeBytes) ||
    row.sizeBytes <= 0 ||
    row.sizeBytes > MAX_POINT_EVIDENCE_FILE_BYTES
  ) return null;

  return {
    id: row.id,
    name,
    mimeType,
    sizeBytes: row.sizeBytes,
    storagePath: row.storagePath
  };
}

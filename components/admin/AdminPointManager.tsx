"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle, RotateCw, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import type { PlayerDetail, PointLogStatus } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface AdminPointRow {
  id: number;
  studentId: string;
  studentName: string;
  activityType: string;
  activity: string;
  points: number;
  minutes: number;
  status: PointLogStatus;
  submittedAt: string;
  notes: string | null;
}

export function AdminPointManager({ students }: { students: PlayerDetail[] }) {
  const router = useRouter();
  const sortedStudents = useMemo(
    () => [...students].sort((left, right) => left.name.localeCompare(right.name)),
    [students]
  );
  const [studentId, setStudentId] = useState(sortedStudents[0]?.id ?? "");
  const [points, setPoints] = useState(50);
  const [minutes, setMinutes] = useState(0);
  const [label, setLabel] = useState("Admin adjustment");
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState<AdminPointRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PointLogStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/points?limit=300", { cache: "no-store" });
      const payload = await response.json() as { ok?: boolean; rows?: AdminPointRow[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not load point records.");
      setRows(payload.rows ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load point records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const matchesQuery = !normalized || `${row.studentName} ${row.activity} ${row.notes ?? ""}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, rows, status]);

  async function addPoints() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, points, minutes, label, reason })
      });
      const payload = await response.json() as { ok?: boolean; row?: AdminPointRow; message?: string; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not add points.");
      if (payload.row) setRows((current) => [payload.row!, ...current]);
      setMessage(payload.message ?? "Points added.");
      setReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add points.");
    } finally {
      setSaving(false);
    }
  }

  async function removePoint(row: AdminPointRow) {
    setRemovingId(row.id);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/points", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: row.id })
      });
      const payload = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not remove this point record.");
      setRows((current) => current.filter((entry) => entry.id !== row.id));
      setConfirmingId(null);
      setMessage(payload.message ?? "Point record removed. It can be restored from the audit log.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove this point record.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-court-line bg-court-panel p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Add points manually</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">Admin adjustments are approved immediately, recorded with your reason, and reversible from the audit log.</p>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_130px_130px_minmax(180px,1fr)]">
          <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-600">
            Student
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="w-full min-w-0 rounded-md border border-court-line bg-court-elevated px-3 text-white">
              {sortedStudents.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-600">
            Points
            <input type="number" min={1} max={500} step={1} value={points} onChange={(event) => setPoints(Number(event.target.value))} className="w-full min-w-0 rounded-md border border-court-line bg-court-elevated px-3 text-white" />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-600">
            Minutes
            <input type="number" min={0} max={240} step={1} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="w-full min-w-0 rounded-md border border-court-line bg-court-elevated px-3 text-white" />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-600">
            Activity label
            <input maxLength={100} value={label} onChange={(event) => setLabel(event.target.value)} className="w-full min-w-0 rounded-md border border-court-line bg-court-elevated px-3 text-white" />
          </label>
        </div>
        <label className="mt-3 grid min-w-0 gap-2 text-sm font-medium text-zinc-600">
          Reason for this adjustment
          <textarea rows={2} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for the audit log" className="w-full min-w-0 resize-y rounded-md border border-court-line bg-court-elevated p-3 text-white" />
        </label>
        <button type="button" onClick={addPoints} disabled={saving || !studentId || !label.trim() || !reason.trim() || points < 1 || points > 500} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-cyan-200 disabled:border disabled:border-court-line disabled:bg-court-elevated disabled:text-zinc-500 sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          Add approved points
        </button>
      </section>

      <section className="overflow-hidden rounded-md border border-court-line bg-court-panel shadow-sm">
        <div className="space-y-4 border-b border-court-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">All point records</h2>
              <p className="mt-1 text-sm text-zinc-500">Remove any incorrect record. Removal is reversible from the audit log.</p>
            </div>
            <button type="button" onClick={() => void loadRows()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-court-line px-3 text-sm font-medium text-zinc-600 hover:border-cyan-400 hover:text-white">
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="relative min-w-0">
              <span className="sr-only">Search point records</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or activity" className="w-full min-w-0 rounded-md border border-court-line bg-court-elevated pl-9 pr-3 text-white" />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter point status" className="w-full min-w-0 rounded-md border border-court-line bg-court-elevated px-3 text-white">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {message ? <div className="border-b border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300" role="status">{message}</div> : null}
        {error ? <div className="border-b border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading point records…</div>
        ) : visibleRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">No point records match these filters.</div>
        ) : (
          <>
            <div className="divide-y divide-court-line md:hidden">
              {visibleRows.map((row) => (
                <article key={row.id} className="min-w-0 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{row.studentName}</h3>
                      <p className="mt-1 break-words text-sm text-zinc-600">{row.activity}</p>
                    </div>
                    <div className="shrink-0 text-right"><div className="font-semibold tabular-nums text-white">{formatNumber(row.points)} pts</div><StatusBadge status={row.status} /></div>
                  </div>
                  <div className="mt-3 text-xs leading-5 text-zinc-500">{formatDate(row.submittedAt)}{row.minutes ? ` · ${row.minutes} min` : ""}{row.notes ? ` · ${row.notes}` : ""}</div>
                  <div className="mt-3 flex justify-end gap-2">
                    {confirmingId === row.id ? <><button type="button" onClick={() => setConfirmingId(null)} className="rounded-md px-3 text-sm text-zinc-600">Cancel</button><button type="button" onClick={() => void removePoint(row)} disabled={removingId === row.id} className="rounded-md bg-red-300/10 px-3 text-sm font-semibold text-red-300">{removingId === row.id ? "Removing…" : "Confirm remove"}</button></> : <button type="button" onClick={() => setConfirmingId(row.id)} className="inline-flex items-center gap-2 rounded-md px-3 text-sm font-medium text-red-300 hover:bg-red-300/10"><Trash2 className="h-4 w-4" /> Remove</button>}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-court-elevated text-xs text-zinc-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Points</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                <tbody>{visibleRows.map((row) => <tr key={row.id} className="border-t border-court-line"><td className="px-4 py-3 font-medium text-white">{row.studentName}</td><td className="px-4 py-3 text-zinc-600">{row.activity}</td><td className="px-4 py-3 text-zinc-500">{formatDate(row.submittedAt)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{formatNumber(row.points)}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="max-w-64 px-4 py-3 text-zinc-500">{row.notes ?? "—"}</td><td className="px-4 py-3 text-right">{confirmingId === row.id ? <span className="inline-flex items-center gap-2"><button type="button" onClick={() => setConfirmingId(null)} className="rounded-md px-3 text-xs text-zinc-600">Cancel</button><button type="button" onClick={() => void removePoint(row)} disabled={removingId === row.id} className="rounded-md bg-red-300/10 px-3 text-xs font-semibold text-red-300">{removingId === row.id ? "Removing…" : "Confirm"}</button></span> : <button type="button" onClick={() => setConfirmingId(row.id)} className="inline-flex items-center gap-2 rounded-md px-3 text-xs font-medium text-red-300 hover:bg-red-300/10"><Trash2 className="h-4 w-4" /> Remove</button>}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

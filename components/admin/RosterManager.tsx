"use client";

import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReadinessBadge } from "@/components/ReadinessBadge";

interface RosterMember {
  id: string;
  name: string;
  readiness: number;
  status: "Needs data" | "Developing" | "On track" | "Ready";
}

interface RosterGroup {
  id: string;
  label: string;
  designation?: string;
  readiness: number;
  members: RosterMember[];
}

interface RosterManagerProps {
  rosters: RosterGroup[];
}

function DraggableMember({ member, groupId, groups, onMove }: { member: RosterMember; groupId: string; groups: RosterGroup[]; onMove: (memberId: string, targetGroupId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: member.id });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div ref={setNodeRef} style={style} className={`min-w-0 rounded-md border border-court-line bg-court-elevated p-3 shadow-sm transition ${isDragging ? "opacity-60" : "hover:border-cyan-400/60"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" {...listeners} {...attributes} className="hidden h-10 w-8 shrink-0 cursor-grab place-items-center rounded-md text-zinc-500 hover:bg-court-panel hover:text-white md:grid" aria-label={`Move ${member.name}`}>
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{member.name}</div><div className="text-xs text-zinc-500">{member.status}</div></div>
        <ReadinessBadge value={member.readiness} status={member.status} size="sm" />
      </div>
      <label className="mt-3 grid min-w-0 gap-1 text-xs font-medium text-zinc-500 md:hidden">
        Move to
        <select value={groupId} onChange={(event) => onMove(member.id, event.target.value)} className="w-full min-w-0 rounded-md border border-court-line bg-court-panel px-3 text-sm text-white">
          {groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
        </select>
      </label>
    </div>
  );
}

function TeamDropColumn({ group, groups, onMove, onRemove }: { group: RosterGroup; groups: RosterGroup[]; onMove: (memberId: string, targetGroupId: string) => void; onRemove: (group: RosterGroup) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const isC = group.designation?.toUpperCase() === "C";

  return (
    <section ref={setNodeRef} className={`min-w-0 rounded-md border bg-court-panel p-4 transition ${isOver ? "border-cyan-400" : "border-court-line"}`}>
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0"><div className="break-words text-sm font-semibold text-white">{group.label}</div><div className="mt-1 text-xs text-zinc-500">{group.members.length} members</div></div>
        <div className="flex shrink-0 items-center gap-2">
          <ReadinessBadge value={group.readiness} size="sm" />
          {isC ? <button type="button" onClick={() => onRemove(group)} className="grid h-10 w-10 place-items-center rounded-md text-red-300 hover:bg-red-300/10" aria-label="Remove C Team"><Trash2 className="h-4 w-4" /></button> : null}
        </div>
      </div>
      <div className="space-y-2">
        {group.members.length ? group.members.map((member) => <DraggableMember key={member.id} member={member} groupId={group.id} groups={groups} onMove={onMove} />) : <div className="rounded-md border border-dashed border-court-line p-5 text-center text-sm text-zinc-500">No students assigned</div>}
      </div>
    </section>
  );
}

export function RosterManager({ rosters }: RosterManagerProps) {
  const router = useRouter();
  const [groups, setGroups] = useState(rosters);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<RosterGroup | null>(null);

  function findGroupByMember(memberId: string) {
    return groups.find((group) => group.members.some((member) => member.id === memberId));
  }

  function moveMember(memberId: string, targetGroupId: string) {
    const sourceGroup = findGroupByMember(memberId);
    const targetGroup = groups.find((group) => group.id === targetGroupId);
    if (!sourceGroup || !targetGroup || sourceGroup.id === targetGroup.id) return;
    const member = sourceGroup.members.find((entry) => entry.id === memberId);
    if (!member) return;

    setGroups((current) => current.map((group) => group.id === sourceGroup.id
      ? { ...group, members: group.members.filter((entry) => entry.id !== memberId) }
      : group.id === targetGroup.id
        ? { ...group, members: [...group.members, member] }
        : group));
    setMessage(`${member.name} moved to ${targetGroup.label}. Save the roster to apply this change.`);
    setError(null);
  }

  function onDragEnd(event: DragEndEvent) {
    if (event.over) moveMember(String(event.active.id), String(event.over.id));
  }

  async function saveRosters() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/rosters", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groups: groups.map((group) => ({ teamId: group.id, memberIds: group.members.map((member) => member.id) })) })
      });
      const payload = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not save rosters.");
      setMessage(payload.message ?? "Team rosters saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save rosters.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCTeam() {
    if (!teamToRemove) return;
    setRemoving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/rosters", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId: teamToRemove.id })
      });
      const payload = await response.json() as { ok?: boolean; persisted?: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not remove C Team.");
      const removedId = teamToRemove.id;
      const removedMembers = teamToRemove.members;
      setGroups((current) => current.filter((group) => group.id !== removedId).map((group) => group.id === "unassigned" ? { ...group, members: [...group.members, ...removedMembers] } : group));
      setTeamToRemove(null);
      setMessage(payload.message ?? "C Team removed.");
      if (payload.persisted !== false) router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove C Team.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border border-court-line bg-court-panel p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-xl font-semibold text-white">Roster editor</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Use the Move to selector on mobile or drag handles on larger screens, then save. C Team can be removed and restored from the audit log.</p></div>
        <button type="button" onClick={() => void saveRosters()} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-cyan-200 md:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save roster
        </button>
      </div>
      {message ? <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300" role="status">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300" role="alert">{error}</div> : null}

      <DndContext onDragEnd={onDragEnd}>
        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          {groups.map((group) => <TeamDropColumn key={group.id} group={group} groups={groups} onMove={moveMember} onRemove={setTeamToRemove} />)}
        </div>
      </DndContext>

      {teamToRemove ? (
        <div className="app-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="remove-c-team-heading">
          <div className="w-full max-w-md rounded-md border border-court-line bg-court-panel p-5 shadow-panel">
            <h2 id="remove-c-team-heading" className="text-xl font-semibold text-white">Remove C Team?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Its {teamToRemove.members.length} members will become unassigned. Tournament history remains intact, and an admin can restore the team and roster from the audit log.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setTeamToRemove(null)} disabled={removing} className="rounded-md border border-court-line px-4 text-sm font-medium text-zinc-600">Cancel</button>
              <button type="button" onClick={() => void removeCTeam()} disabled={removing} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-400 px-4 text-sm font-semibold text-black"><Trash2 className="h-4 w-4" /> {removing ? "Removing…" : "Remove C Team"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

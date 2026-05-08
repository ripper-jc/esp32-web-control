import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useDevices } from "../context/DeviceContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import type { PinGroup } from "../lib/types";

export default function PinGroups() {
  const { devices, pinValues } = useDevices();
  const { addToast } = useToast();
  const [groups, setGroups] = useState<PinGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<{ deviceId: string; pin: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const allOutputPins: { deviceId: string; deviceName: string; pin: string; label: string }[] = [];
  devices.forEach((d) => {
    if (d.pins) Object.keys(d.pins).forEach((pin) => {
      if (d.pins![pin].mode === "output") allOutputPins.push({ deviceId: d.deviceId, deviceName: d.name || d.deviceId, pin, label: d.pins![pin].label });
    });
  });

  const fetchGroups = useCallback(async () => {
    try { setGroups(await apiFetch<PinGroup[]>("/api/pin-groups")); } catch (_) {}
    setLoading(false);
  }, []);
  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async () => {
    if (!name.trim() || members.length === 0) return;
    try {
      const g = await apiFetch<PinGroup>("/api/pin-groups", { method: "POST", body: JSON.stringify({ name, members }) });
      setGroups((prev) => [...prev, g]); setName(""); setMembers([]); setShowCreate(false);
      addToast("success", "Group created");
    } catch (e) { addToast("error", (e as Error).message); }
  };

  const handleToggle = async (groupId: string, value: number) => {
    try {
      await apiFetch(`/api/pin-groups/${groupId}/toggle`, { method: "POST", body: JSON.stringify({ value }) });
      addToast("success", value ? "Group turned ON" : "Group turned OFF");
    } catch (e) { addToast("error", (e as Error).message); }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try { await apiFetch(`/api/pin-groups/${deleteTarget.id}`, { method: "DELETE" }); setGroups((prev) => prev.filter((g) => g.groupId !== deleteTarget.id)); addToast("success", "Group deleted"); } catch (_) {}
    setDeleteTarget(null);
  }, [deleteTarget, addToast]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="animate-fade-up">
      <ConfirmDialog open={!!deleteTarget} title="Delete Group" message={`Delete "${deleteTarget?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Pin Groups</h1>
        <button className={showCreate ? "btn-secondary" : "btn-primary"} onClick={() => setShowCreate((p) => !p)}>{showCreate ? "Cancel" : "New Group"}</button>
      </div>

      {showCreate && (
        <div className="card mb-8">
          <input className="input-field w-full mb-4" placeholder="Group name (e.g. All Bedroom Lights)" value={name} onChange={(e) => setName(e.target.value)} />
          <h3 className="text-sm font-semibold text-white mb-3">Members</h3>
          {members.map((m, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <select className="input-field flex-1" value={`${m.deviceId}:${m.pin}`} onChange={(e) => { const [d, p] = e.target.value.split(":"); setMembers((prev) => prev.map((mm, j) => j === i ? { deviceId: d, pin: p } : mm)); }}>
                {allOutputPins.map((p) => <option key={`${p.deviceId}:${p.pin}`} value={`${p.deviceId}:${p.pin}`}>{p.deviceName} — {p.label}</option>)}
              </select>
              <button className="text-red-400 text-xs hover:underline" onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button className="btn-secondary text-xs" onClick={() => { if (allOutputPins.length > 0) setMembers((prev) => [...prev, { deviceId: allOutputPins[0].deviceId, pin: allOutputPins[0].pin }]); }}>Add member</button>
            <button className="btn-primary text-xs" onClick={handleCreate}>Create Group</button>
          </div>
        </div>
      )}

      {groups.length === 0 && !showCreate && (
        <div className="card text-center py-12"><p className="text-gray-500">No pin groups yet. Group pins across devices to toggle together.</p></div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups.map((g) => {
          const onCount = g.members.filter((m) => {
            const val = pinValues.get(`${m.deviceId}:${m.pin}`);
            const device = devices.find((d) => d.deviceId === m.deviceId);
            const lastVal = device?.pins?.[m.pin]?.lastValue ?? 0;
            return (val ?? lastVal) !== 0;
          }).length;
          const allOn = onCount === g.members.length;
          const someOn = onCount > 0 && onCount < g.members.length;
          return (
          <div key={g.groupId} className="card">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{g.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allOn ? "bg-brand-600/20 text-brand-400" : someOn ? "bg-yellow-500/15 text-yellow-400" : "bg-surface-300 text-gray-500"}`}>
                {allOn ? "All ON" : someOn ? `${onCount}/${g.members.length} ON` : "All OFF"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{g.members.length} pin{g.members.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <button className="btn-primary text-xs flex-1" onClick={() => handleToggle(g.groupId, 1)}>All ON</button>
              <button className="btn-secondary text-xs flex-1" onClick={() => handleToggle(g.groupId, 0)}>All OFF</button>
              <button className="text-red-400 text-xs hover:underline px-2" onClick={() => setDeleteTarget({ id: g.groupId, name: g.name })}>Delete</button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

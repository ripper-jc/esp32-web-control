import { useState } from "react";
import { useDevices } from "../context/DeviceContext";
import ConfirmDialog from "../components/ConfirmDialog";
import type { SceneAction } from "../lib/types";

export default function Scenes() {
  const { scenes, devices, createScene, deleteScene, executeScene } = useDevices();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [actions, setActions] = useState<SceneAction[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const allPins: { deviceId: string; deviceName: string; pin: string; label: string }[] = [];
  devices.forEach((d) => {
    if (d.pins) Object.keys(d.pins).forEach((pin) => {
      if (d.pins![pin].mode === "output") allPins.push({ deviceId: d.deviceId, deviceName: d.name || d.deviceId, pin, label: d.pins![pin].label });
    });
  });

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createScene({ name: name.trim(), icon: icon || "play", actions });
    setName(""); setIcon(""); setActions([]); setShowCreate(false);
  };

  return (
    <div className="animate-fade-up">
      <ConfirmDialog open={!!deleteTarget} title="Delete Scene" message={`Delete "${deleteTarget?.name}"?`}
        onConfirm={async () => { if (deleteTarget) { await deleteScene(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Scenes</h1>
        <button className={showCreate ? "btn-secondary" : "btn-primary"} onClick={() => setShowCreate((p) => !p)}>
          {showCreate ? "Cancel" : "New Scene"}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-8">
          <div className="flex gap-3 mb-5 flex-wrap">
            <input className="input-field flex-1" placeholder="Scene name" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setShowCreate(false)} />
            <input className="input-field w-24" placeholder="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-3">Actions</h3>
          {actions.map((action, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 flex-wrap">
              <select className="input-field" value={`${action.deviceId}:${action.pin}`} onChange={(e) => {
                const [dId, p] = e.target.value.split(":"); setActions((prev) => prev.map((a, j) => j === i ? { ...a, deviceId: dId, pin: p } : a));
              }}>
                {allPins.map((p) => <option key={`${p.deviceId}:${p.pin}`} value={`${p.deviceId}:${p.pin}`}>{p.deviceName} — {p.label} (GPIO{p.pin})</option>)}
              </select>
              <select className="input-field w-20" value={action.value} onChange={(e) => setActions((prev) => prev.map((a, j) => j === i ? { ...a, value: Number(e.target.value) } : a))}>
                <option value={1}>ON</option><option value={0}>OFF</option>
              </select>
              <button className="text-red-400 text-xs hover:underline" onClick={() => setActions((prev) => prev.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button className="btn-secondary text-xs" onClick={() => { if (allPins.length > 0) setActions((prev) => [...prev, { deviceId: allPins[0].deviceId, pin: allPins[0].pin, value: 1 }]); }}>Add action</button>
            <button className="btn-primary text-xs" onClick={handleCreate}>Create Scene</button>
          </div>
        </div>
      )}

      {scenes.length === 0 && !showCreate && (
        <div className="card text-center py-12"><p className="text-gray-500 mb-2">No scenes created yet</p><p className="text-sm text-gray-600">Create one to control multiple devices at once.</p></div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {scenes.map((scene) => (
          <div key={scene.sceneId} className="card-hover flex flex-col">
            <h3 className="font-semibold text-white mb-1">{scene.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{scene.actions.length} action{scene.actions.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2 mt-auto">
              <button className="btn-primary text-xs flex-1" onClick={() => executeScene(scene.sceneId)}>Run</button>
              <button className="text-red-400 text-xs hover:underline px-2" onClick={() => setDeleteTarget({ id: scene.sceneId, name: scene.name })}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../context/DeviceContext";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Settings() {
  const { userEmail, logout } = useAuth();
  const { rooms, createRoom, renameRoom, deleteRoom, wsConnected, devices, onlineDeviceIds } = useDevices();

  const [weatherCity, setWeatherCity] = useState(localStorage.getItem("weatherCity") || "");
  const [newRoomName, setNewRoomName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ roomId: string; name: string } | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || creatingRoom) return;
    setCreatingRoom(true);
    try { await createRoom(newRoomName.trim()); setNewRoomName(""); } finally { setCreatingRoom(false); }
  };
  const handleSaveRoomEdit = async (roomId: string) => { if (!editRoomName.trim()) return; await renameRoom(roomId, editRoomName.trim()); setEditingRoomId(null); };
  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) { await deleteRoom(deleteTarget.roomId); setDeleteTarget(null); }
  }, [deleteTarget, deleteRoom]);

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-white mb-8 tracking-tight">Settings</h1>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Devices in this room will become unassigned.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Account */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h2>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
              <p className="font-medium text-white">{userEmail || "—"}</p>
            </div>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 transition-colors">Sign out</button>
          </div>
        </div>
      </section>

      {/* Connection */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Connection</h2>
        <div className="card space-y-2">
          <div className="flex items-center gap-2.5 text-sm">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-400 shadow-md shadow-green-400/50" : "bg-red-400"}`} />
            <span className="text-gray-300">WebSocket: {wsConnected ? "Connected" : "Disconnected"}</span>
          </div>
          <p className="text-sm text-gray-500">{devices.filter((d) => onlineDeviceIds.has(d.deviceId)).length} of {devices.length} devices online</p>
        </div>
      </section>

      {/* Weather */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Weather</h2>
        <div className="card">
          <p className="text-xs text-gray-500 mb-3">Display name shown on the dashboard for the weather widget.</p>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              placeholder="e.g. Kyiv, Ukraine"
            />
            <button
              className="btn-primary text-xs"
              onClick={() => { localStorage.setItem("weatherCity", weatherCity); }}
            >
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</h2>
        <div className="flex gap-3 flex-wrap">
          <Link to="/pair-device" className="btn-primary text-xs">Pair New Device</Link>
          <Link to="/statistics" className="btn-secondary text-xs">Usage Statistics</Link>
          <Link to="/floor-plan" className="btn-secondary text-xs">Floor Plan</Link>
        </div>
      </section>

      {/* Rooms */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Rooms</h2>
        <div className="card p-0 divide-y divide-white/5">
          {rooms.length === 0 && <p className="px-5 py-8 text-sm text-gray-600 text-center">No rooms yet.</p>}
          {rooms.map((room) => (
            <div key={room.roomId} className="px-5 py-3.5 flex items-center gap-3">
              {editingRoomId === room.roomId ? (
                <>
                  <input className="input-field flex-1" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveRoomEdit(room.roomId); if (e.key === "Escape") setEditingRoomId(null); }} autoFocus />
                  <button className="btn-primary text-xs" onClick={() => handleSaveRoomEdit(room.roomId)}>Save</button>
                  <button className="btn-secondary text-xs" onClick={() => setEditingRoomId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-white">{room.name}</span>
                  <span className="text-xs text-gray-600">{devices.filter((d) => d.roomId === room.roomId).length} devices</span>
                  <button className="text-xs text-gray-500 hover:text-brand-400 transition-colors" onClick={() => { setEditingRoomId(room.roomId); setEditRoomName(room.name); }}>Rename</button>
                  <button className="text-xs text-gray-500 hover:text-red-400 transition-colors" onClick={() => setDeleteTarget({ roomId: room.roomId, name: room.name })}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <input className="input-field flex-1" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="New room name"
            onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()} disabled={creatingRoom} />
          <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50" onClick={handleCreateRoom} disabled={creatingRoom}>
            {creatingRoom ? "Creating..." : "Create"}
          </button>
        </div>
      </section>
    </div>
  );
}

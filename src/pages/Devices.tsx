import { useState } from "react";
import DeviceCard from "../components/DeviceCard";
import { SkeletonCard } from "../components/Skeleton";
import { useDevices } from "../context/DeviceContext";

export default function Devices() {
  const { devices, rooms, onlineDeviceIds, loading, loadError, togglePin, pinValues } = useDevices();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [roomFilter, setRoomFilter] = useState("");
  const [allOffLoading, setAllOffLoading] = useState(false);

  if (loadError) return <p className="text-red-400">{loadError}</p>;

  let filtered = devices;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((d) => d.deviceId.toLowerCase().includes(q) || (d.name || "").toLowerCase().includes(q));
  }
  if (filter === "online") filtered = filtered.filter((d) => onlineDeviceIds.has(d.deviceId));
  if (filter === "offline") filtered = filtered.filter((d) => !onlineDeviceIds.has(d.deviceId));
  if (roomFilter === "__none") filtered = filtered.filter((d) => !d.roomId);
  else if (roomFilter) filtered = filtered.filter((d) => d.roomId === roomFilter);

  const handleAllOff = async () => {
    setAllOffLoading(true);
    filtered.forEach((d) => {
      if (d.pins) {
        Object.keys(d.pins).forEach((pin) => {
          if (d.pins![pin].mode === "output") {
            const key = `${d.deviceId}:${pin}`;
            const val = pinValues.get(key) ?? d.pins![pin].lastValue;
            if (val !== 0) togglePin(d.deviceId, pin, val);
          }
        });
      }
    });
    // togglePin uses a 300ms debounce; wait briefly then clear loading
    setTimeout(() => setAllOffLoading(false), 600);
  };

  const hasOutputPins = filtered.some((d) => d.pins && Object.values(d.pins).some((p) => p.mode === "output"));

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">Devices</h1>
        {hasOutputPins && (
          <button onClick={handleAllOff} disabled={allOffLoading} className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
            {allOffLoading ? "Turning off..." : "All Off"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <input className="input-field flex-1 min-w-[180px]" placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
          <option value="">All rooms</option>
          {rooms.map((r) => <option key={r.roomId} value={r.roomId}>{r.name}</option>)}
          <option value="__none">Unassigned</option>
        </select>
        <div className="flex gap-0.5 bg-surface-100 rounded-xl p-1 border border-white/5">
          {(["all", "online", "offline"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "text-gray-500 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No devices match your filters.</p>
      ) : (
        filtered.map((d) => <DeviceCard key={d.deviceId} device={d} isOnline={onlineDeviceIds.has(d.deviceId)} rooms={rooms} />)
      )}
    </div>
  );
}

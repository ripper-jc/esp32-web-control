import { Link } from "react-router-dom";
import DeviceCard from "../components/DeviceCard";
import { SkeletonCard, SkeletonStat } from "../components/Skeleton";
import { useDevices } from "../context/DeviceContext";

export default function Dashboard() {
  const { devices, rooms, scenes, onlineDeviceIds, recentActivity, weather, loading, loadError, executeScene } = useDevices();

  if (loadError) return <p className="text-red-400">{loadError}</p>;

  const roomIds = new Set(rooms.map((r) => r.roomId));
  const devicesByRoom: Record<string, typeof devices> = {};
  const unassignedDevices: typeof devices = [];
  if (!loading) {
    devices.forEach((d) => {
      if (d.roomId && roomIds.has(d.roomId)) {
        if (!devicesByRoom[d.roomId]) devicesByRoom[d.roomId] = [];
        devicesByRoom[d.roomId].push(d);
      } else {
        unassignedDevices.push(d);
      }
    });
  }

  const onlineCount = devices.filter((d) => onlineDeviceIds.has(d.deviceId)).length;

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-white mb-8 tracking-tight">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}</>
        ) : (
          <>
            <StatCard label="Total Devices" value={devices.length} />
            <StatCard label="Online" value={onlineCount} accent="text-green-400" />
            <StatCard label="Offline" value={devices.length - onlineCount} />
            <StatCard label="Rooms" value={rooms.length} />
          </>
        )}
      </div>

      {/* Weather */}
      {weather && (
        <div className="card mb-10 flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500">{localStorage.getItem("weatherCity") || "Weather"}</p>
            <p className="text-3xl font-bold text-white">{weather.temperature}°C</p>
          </div>
          <div className="text-sm text-gray-400 space-y-0.5">
            <p>Humidity: {weather.humidity}%</p>
            <p>Wind: {weather.windSpeed} km/h</p>
          </div>
        </div>
      )}

      {/* Quick scenes */}
      {scenes.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Quick Scenes</h2>
            <Link to="/scenes" className="text-xs text-gray-500 hover:text-brand-400 transition-colors">View all</Link>
          </div>
          <div className="flex gap-2 flex-wrap">
            {scenes.map((scene) => (
              <button
                key={scene.sceneId}
                onClick={() => executeScene(scene.sceneId)}
                className="bg-surface-100 hover:bg-brand-600/20 border border-white/5 hover:border-brand-500/30 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              >
                {scene.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Room sections */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          {rooms.map((room) => {
            const roomDevices = devicesByRoom[room.roomId] || [];
            return (
              <section key={room.roomId} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">{room.name}</h2>
                  <Link to={`/rooms/${room.roomId}`} className="text-xs text-gray-500 hover:text-brand-400 transition-colors">View all</Link>
                </div>
                {roomDevices.length === 0 ? (
                  <p className="text-sm text-gray-600">No devices in this room.</p>
                ) : (
                  roomDevices.map((d) => <DeviceCard key={d.deviceId} device={d} isOnline={onlineDeviceIds.has(d.deviceId)} rooms={rooms} compact />)
                )}
              </section>
            );
          })}

          {unassignedDevices.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-white mb-4">Unassigned</h2>
              {unassignedDevices.map((d) => <DeviceCard key={d.deviceId} device={d} isOnline={onlineDeviceIds.has(d.deviceId)} rooms={rooms} compact />)}
            </section>
          )}

          {devices.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-2">No devices found</p>
              <p className="text-sm text-gray-600 mb-4">Connect an ESP32 to get started.</p>
              <Link to="/pair-device" className="btn-primary text-sm">Pair a device</Link>
            </div>
          )}
        </>
      )}

      {/* Activity */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="card p-0 divide-y divide-white/5">
            {recentActivity.slice(0, 10).map((event) => (
              <div key={event.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.type === "pinChange" ? "bg-brand-400" : event.type === "deviceStatus" ? "bg-yellow-400" : "bg-purple-400"}`} />
                <span className="text-gray-600 text-xs font-mono w-14 flex-shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-gray-400 truncate">{event.deviceId && `${event.deviceId}: `}{event.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

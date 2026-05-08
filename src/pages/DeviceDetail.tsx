import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DeviceCard from "../components/DeviceCard";
import SensorChart from "../components/SensorChart";
import { SkeletonList } from "../components/Skeleton";
import { useDevices } from "../context/DeviceContext";
import { useToast } from "../components/Toast";
import { apiFetch } from "../lib/api";

type EventLogEntry = {
  deviceId: string;
  timestamp: number;
  eventType: string;
  data: Record<string, unknown>;
};

export default function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { devices, rooms, onlineDeviceIds, deviceDiagnostics, sensorHistory, loading, refetchAll } = useDevices();
  const { addToast } = useToast();
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const fetchEvents = useCallback(async () => {
    if (!deviceId) return;
    setEventsLoading(true);
    try { setEvents(await apiFetch<EventLogEntry[]>(`/api/devices/${deviceId}/events?limit=20`)); } catch (_) {}
    setEventsLoading(false);
  }, [deviceId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const device = devices.find((d) => d.deviceId === deviceId);
  if (!device) {
    return (
      <div className="animate-fade-up">
        <Link to="/devices" className="text-sm text-gray-500 hover:text-brand-400 transition-colors">&larr; Back</Link>
        <p className="text-gray-500 mt-6">Device not found.</p>
      </div>
    );
  }

  const isOnline = onlineDeviceIds.has(device.deviceId);
  const room = rooms.find((r) => r.roomId === device.roomId);
  const diag = deviceDiagnostics.get(device.deviceId);

  const formatUptime = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

  const handleExport = () => {
    const config = { deviceId: device.deviceId, name: device.name, roomId: device.roomId, pins: device.pins };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${device.name || device.deviceId}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Config exported");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const config = JSON.parse(text) as { pins?: Record<string, { label: string; mode: string; category: string }> };
      if (!config.pins) { addToast("error", "Invalid config file"); return; }
      for (const [pin, cfg] of Object.entries(config.pins)) {
        await apiFetch(`/api/devices/${device.deviceId}/pins/${pin}`, { method: "PUT", body: JSON.stringify(cfg) });
      }
      addToast("success", `Imported ${Object.keys(config.pins).length} pins`);
      await refetchAll();
    } catch (err) {
      addToast("error", "Failed to import config");
    }
    e.target.value = "";
  };

  return (
    <div className="animate-fade-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link to="/devices" className="hover:text-brand-400 transition-colors">Devices</Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400">{device.name || device.deviceId}</span>
      </div>

      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">{device.name || device.deviceId}</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-xs">Export Config</button>
          <button onClick={() => importRef.current?.click()} className="btn-secondary text-xs">Import Config</button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8 text-sm text-gray-500">
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400 shadow-md shadow-green-400/50" : "bg-gray-600"}`} />
        {isOnline ? "Online" : "Offline"}
        {room && (
          <>
            <span className="text-gray-700">|</span>
            <Link to={`/rooms/${room.roomId}`} className="text-brand-400 hover:text-brand-300 transition-colors">{room.name}</Link>
          </>
        )}
        <span className="text-gray-700">|</span>
        <span className="font-mono text-gray-600">{device.deviceId}</span>
      </div>

      <DeviceCard device={device} isOnline={isOnline} rooms={rooms} />

      {/* Diagnostics */}
      {diag && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Diagnostics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card"><p className="text-xs text-gray-500 mb-1">Uptime</p><p className="text-lg font-bold text-white">{formatUptime(diag.uptime)}</p></div>
            <div className="card"><p className="text-xs text-gray-500 mb-1">WiFi Signal</p><p className="text-lg font-bold text-white">{diag.rssi} dBm</p></div>
            <div className="card"><p className="text-xs text-gray-500 mb-1">Free Memory</p><p className="text-lg font-bold text-white">{(diag.freeHeap / 1024).toFixed(0)} KB</p></div>
            <div className="card"><p className="text-xs text-gray-500 mb-1">Last Heartbeat</p><p className="text-lg font-bold text-white">{new Date(diag.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
          </div>
        </div>
      )}

      {/* Sensor readings */}
      {device.sensorReadings && Object.keys(device.sensorReadings).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Sensor Readings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(device.sensorReadings).map(([key, val]) => (
              <div key={key} className="card"><p className="text-xs text-gray-500 mb-1">{key}</p><p className="text-xl font-bold text-white">{String(val)}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* Sensor History Charts */}
      {device.sensorReadings && Object.keys(device.sensorReadings).some((k) => typeof device.sensorReadings![k] === "number") && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Sensor Trends</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(device.sensorReadings).filter(([, v]) => typeof v === "number").map(([key]) => {
              const histKey = `${device.deviceId}:${key}`;
              const data = sensorHistory.get(histKey) || [];
              const unit = key.includes("temp") ? "°C" : key.includes("humid") ? "%" : key.includes("pressure") ? " hPa" : "";
              const color = key.includes("temp") ? "#f97316" : key.includes("humid") ? "#3b82f6" : "#6366f1";
              return <SensorChart key={key} data={data} label={key} unit={unit} color={color} />;
            })}
          </div>
        </div>
      )}

      {/* Event History */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Event History</h2>
          <button onClick={fetchEvents} className="text-xs text-gray-500 hover:text-brand-400 transition-colors">Refresh</button>
        </div>
        {eventsLoading ? <SkeletonList rows={4} /> : events.length === 0 ? (
          <div className="card text-center py-8"><p className="text-gray-600 text-sm">No events recorded yet.</p></div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block card p-0 divide-y divide-white/5">
              {events.map((event, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3 text-sm">
                  <EventDot type={event.eventType} />
                  <span className="text-gray-600 text-xs font-mono w-28 flex-shrink-0">
                    {new Date(event.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">{event.eventType}</span>
                  <span className="text-gray-400 truncate text-xs">{formatEventData(event.eventType, event.data)}</span>
                </div>
              ))}
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {events.map((event, i) => (
                <div key={i} className="card py-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <EventDot type={event.eventType} />
                    <span className="text-xs text-gray-500">{event.eventType}</span>
                    <span className="text-xs text-gray-600 ml-auto font-mono">
                      {new Date(event.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{formatEventData(event.eventType, event.data)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EventDot({ type }: { type: string }) {
  const color = type === "pinChange" ? "bg-brand-400" : type === "deviceOnline" ? "bg-green-400" : type === "deviceOffline" ? "bg-red-400" : type === "sceneExecuted" ? "bg-purple-400" : "bg-gray-500";
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />;
}

function formatEventData(type: string, data: Record<string, unknown>): string {
  if (type === "pinChange") return `Pin ${data.pin} → ${data.value ? "ON" : "OFF"}`;
  if (type === "deviceOnline") return "Device came online";
  if (type === "deviceOffline") return "Device went offline";
  if (type === "sceneExecuted") return `Scene "${data.sceneName || data.sceneId}"`;
  return JSON.stringify(data).slice(0, 80);
}

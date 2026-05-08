import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ReadyState } from "react-use-websocket";
import { apiFetch } from "../lib/api";
import type { Device, Room, Scene, WeatherData } from "../lib/types";
import { useAuth } from "./AuthContext";
import { useWS } from "./WebSocketContext";
import { useToast } from "../components/Toast";

type ActivityEvent = {
  id: number;
  timestamp: number;
  type: string;
  deviceId: string;
  message: string;
};

export type DeviceDiagnostics = {
  uptime: number;
  rssi: number;
  freeHeap: number;
  lastSeen: number;
};

type DeviceContextType = {
  devices: Device[];
  rooms: Room[];
  scenes: Scene[];
  pinValues: Map<string, number>;
  onlineDeviceIds: Set<string>;
  deviceDiagnostics: Map<string, DeviceDiagnostics>;
  recentActivity: ActivityEvent[];
  weather: WeatherData | null;
  sensorHistory: Map<string, { timestamp: number; value: number }[]>;
  loading: boolean;
  loadError: string | null;
  wsConnected: boolean;
  refetchAll: () => Promise<void>;
  togglePin: (deviceId: string, pin: string, currentValue: number) => void;
  saveDeviceEdit: (deviceId: string, update: { name?: string; roomId?: string | null }) => Promise<void>;
  addPin: (deviceId: string, pin: string, config: { label: string; mode: string; category: string }) => Promise<void>;
  saveEditPin: (deviceId: string, pin: string, config: { label: string; mode: string; category: string }) => Promise<void>;
  deletePin: (deviceId: string, pin: string) => Promise<void>;
  createRoom: (name: string) => Promise<Room>;
  renameRoom: (roomId: string, name: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  createScene: (scene: Omit<Scene, "sceneId">) => Promise<void>;
  updateScene: (sceneId: string, scene: Partial<Scene>) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  executeScene: (sceneId: string) => Promise<void>;
};

const DeviceContext = createContext<DeviceContextType>(null!);

let activityCounter = 0;

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { sendMessage, lastMessage, readyState, wsConnected } = useWS();
  const { addToast } = useToast();

  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pinValues, setPinValues] = useState<Map<string, number>>(new Map());
  const [onlineDeviceIds, setOnlineDeviceIds] = useState<Set<string>>(new Set());
  const [deviceDiagnostics, setDeviceDiagnostics] = useState<Map<string, DeviceDiagnostics>>(new Map());
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sensorHistory, setSensorHistory] = useState<Map<string, { timestamp: number; value: number }[]>>(new Map());

  const pinToggleTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  const addActivity = useCallback((type: string, deviceId: string, message: string) => {
    setRecentActivity((prev) => [{ id: ++activityCounter, timestamp: Date.now(), type, deviceId, message }, ...prev].slice(0, 30));
  }, []);

  // Fetch all data
  const refetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [devicesData, roomsData] = await Promise.all([
        apiFetch<Device[]>("/api/devices"),
        apiFetch<Room[]>("/api/rooms"),
      ]);
      let scenesData: Scene[] = [];
      try { scenesData = await apiFetch<Scene[]>("/api/scenes"); } catch (_) {}
      setDevices(devicesData);
      setRooms(roomsData);
      setScenes(scenesData);
      setPinValues((prev) => {
        const next = new Map(prev);
        devicesData.forEach((d) => {
          if (d.pins) Object.keys(d.pins).forEach((pin) => {
            const key = `${d.deviceId}:${pin}`;
            if (!next.has(key)) next.set(key, d.pins![pin].lastValue);
          });
        });
        return next;
      });
      setLoadError(null);
    } catch (e) {
      setLoadError(`Failed to load data: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) refetchAll(); }, [isAuthenticated, refetchAll]);

  // Refetch on WebSocket reconnect
  const prevReadyState = useRef(readyState);
  useEffect(() => {
    if (prevReadyState.current !== ReadyState.OPEN && readyState === ReadyState.OPEN) {
      refetchAll();
    }
    prevReadyState.current = readyState;
  }, [readyState, refetchAll]);

  // Ping devices every 30s
  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return;
    const ping = () => sendMessage(JSON.stringify({ action: "request", cmd: "pingDevices" }));
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [readyState, sendMessage]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const parsed = JSON.parse(lastMessage.data) as { action: string; type: string; body: unknown; deviceId?: string };
      if (parsed.action !== "msg") return;

      if (parsed.type === "pinStateChange" && parsed.deviceId) {
        const body = parsed.body as { pin: number | string; value: number };
        setPinValues((prev) => new Map(prev).set(`${parsed.deviceId}:${String(body.pin)}`, body.value));
        addActivity("pinChange", parsed.deviceId, `Pin ${body.pin} → ${body.value ? "ON" : "OFF"}`);
      }

      if (parsed.type === "sensorReadings" && parsed.deviceId) {
        const readings = parsed.body as Record<string, unknown>;
        setDevices((prev) => prev.map((d) => d.deviceId === parsed.deviceId ? { ...d, sensorReadings: readings } : d));
        // Track history for charts
        const now = Date.now();
        setSensorHistory((prev) => {
          const next = new Map(prev);
          Object.entries(readings).forEach(([key, val]) => {
            if (typeof val === "number") {
              const histKey = `${parsed.deviceId}:${key}`;
              const existing = next.get(histKey) || [];
              next.set(histKey, [...existing.slice(-59), { timestamp: now, value: val }]);
            }
          });
          return next;
        });
      }

      if (parsed.type === "weather") {
        setWeather(parsed.body as WeatherData);
      }

      if (parsed.type === "onlineDevices") setOnlineDeviceIds(new Set(parsed.body as string[]));

      if (parsed.type === "deviceStatus") {
        const { deviceId, status } = parsed.body as { deviceId: string; status: string };
        setOnlineDeviceIds((prev) => { const next = new Set(prev); status === "online" ? next.add(deviceId) : next.delete(deviceId); return next; });
        addActivity("deviceStatus", deviceId, status === "online" ? "came online" : "went offline");
      }

      if (parsed.type === "modeChange" && parsed.deviceId) {
        const { mode } = parsed.body as { mode: number };
        setDevices((prev) => prev.map((d) => d.deviceId === parsed.deviceId ? { ...d, mode } : d));
      }

      if (parsed.type === "heartbeat" && parsed.deviceId) {
        const body = parsed.body as { uptime: number; rssi: number; freeHeap: number };
        setDeviceDiagnostics((prev) => new Map(prev).set(parsed.deviceId!, { ...body, lastSeen: Date.now() }));
      }

      if (parsed.type === "alert") {
        const body = parsed.body as { rule: string; message: string };
        addToastRef.current("warning", `${body.rule}: ${body.message}`);
        addActivity("alert", "", `Rule "${body.rule}": ${body.message}`);
      }

      if (parsed.type === "warning") {
        addToastRef.current("warning", typeof parsed.body === "string" ? parsed.body : "Warning from server");
      }
    } catch (_) {}
  }, [lastMessage, addActivity]);

  // --- Mutations ---
  const togglePin = useCallback((deviceId: string, pin: string, currentValue: number) => {
    const key = `${deviceId}:${pin}`;
    const newValue = currentValue !== 0 ? 0 : 1;
    setPinValues((prev) => new Map(prev).set(key, newValue));
    if (pinToggleTimers.current[key]) clearTimeout(pinToggleTimers.current[key]);
    pinToggleTimers.current[key] = setTimeout(() => {
      sendRef.current(JSON.stringify({ action: "msg", type: "cmd", deviceId, body: { type: "digitalWrite", pin: Number(pin), value: newValue } }));
      delete pinToggleTimers.current[key];
    }, 300);
  }, []);

  const saveDeviceEdit = useCallback(async (deviceId: string, update: { name?: string; roomId?: string | null }) => {
    await apiFetch(`/api/devices/${deviceId}`, { method: "PATCH", body: JSON.stringify(update) });
    setDevices((prev) => prev.map((d) => d.deviceId === deviceId ? { ...d, ...(update.name !== undefined ? { name: update.name } : {}), roomId: update.roomId ?? undefined } : d));
    addToastRef.current("success", "Device updated");
  }, []);

  const addPin = useCallback(async (deviceId: string, pin: string, config: { label: string; mode: string; category: string }) => {
    await apiFetch(`/api/devices/${deviceId}/pins/${pin}`, { method: "PUT", body: JSON.stringify(config) });
    setDevices((prev) => prev.map((d) => d.deviceId === deviceId ? { ...d, pins: { ...d.pins, [pin]: { ...config, lastValue: 0 } } } : d));
    addToastRef.current("success", "Pin added");
  }, []);

  const saveEditPin = useCallback(async (deviceId: string, pin: string, config: { label: string; mode: string; category: string }) => {
    await apiFetch(`/api/devices/${deviceId}/pins/${pin}`, { method: "PUT", body: JSON.stringify(config) });
    setDevices((prev) => prev.map((d) => d.deviceId === deviceId && d.pins?.[pin] ? { ...d, pins: { ...d.pins, [pin]: { ...d.pins[pin], ...config } } } : d));
    addToastRef.current("success", "Pin updated");
  }, []);

  const deletePin = useCallback(async (deviceId: string, pin: string) => {
    await apiFetch(`/api/devices/${deviceId}/pins/${pin}`, { method: "DELETE" });
    setDevices((prev) => prev.map((d) => { if (d.deviceId !== deviceId) return d; const pins = { ...d.pins }; delete pins[pin]; return { ...d, pins }; }));
    addToastRef.current("success", "Pin deleted");
  }, []);

  const createRoom = useCallback(async (name: string): Promise<Room> => {
    const r = await apiFetch<Room>("/api/rooms", { method: "POST", body: JSON.stringify({ name }) });
    setRooms((prev) => [...prev, r]);
    addToastRef.current("success", "Room created");
    return r;
  }, []);

  const renameRoom = useCallback(async (roomId: string, name: string) => {
    await apiFetch(`/api/rooms/${roomId}`, { method: "PATCH", body: JSON.stringify({ name }) });
    setRooms((prev) => prev.map((r) => r.roomId === roomId ? { ...r, name } : r));
  }, []);

  const deleteRoom = useCallback(async (roomId: string) => {
    await apiFetch(`/api/rooms/${roomId}`, { method: "DELETE" });
    setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
    setDevices((prev) => prev.map((d) => d.roomId === roomId ? { ...d, roomId: undefined } : d));
    addToastRef.current("success", "Room deleted");
  }, []);

  const createScene = useCallback(async (scene: Omit<Scene, "sceneId">) => {
    try { const s = await apiFetch<Scene>("/api/scenes", { method: "POST", body: JSON.stringify(scene) }); setScenes((prev) => [...prev, s]); addToastRef.current("success", "Scene created"); }
    catch (e) { addToastRef.current("error", (e as Error).message); }
  }, []);

  const updateScene = useCallback(async (sceneId: string, scene: Partial<Scene>) => {
    try { await apiFetch(`/api/scenes/${sceneId}`, { method: "PATCH", body: JSON.stringify(scene) }); setScenes((prev) => prev.map((s) => s.sceneId === sceneId ? { ...s, ...scene } : s)); }
    catch (e) { addToastRef.current("error", (e as Error).message); }
  }, []);

  const deleteScene = useCallback(async (sceneId: string) => {
    try { await apiFetch(`/api/scenes/${sceneId}`, { method: "DELETE" }); setScenes((prev) => prev.filter((s) => s.sceneId !== sceneId)); addToastRef.current("success", "Scene deleted"); }
    catch (e) { addToastRef.current("error", (e as Error).message); }
  }, []);

  const executeScene = useCallback(async (sceneId: string) => {
    try {
      const res = await apiFetch<{ success: boolean; results: { deviceId: string; sent: boolean }[] }>(`/api/scenes/${sceneId}/execute`, { method: "POST" });
      const offline = res.results?.filter((r) => !r.sent).map((r) => r.deviceId);
      if (offline && offline.length > 0) {
        addToastRef.current("warning", `Scene executed — ${offline.length} device(s) offline: ${offline.join(", ")}`);
      } else {
        addToastRef.current("success", "Scene executed");
      }
      addActivity("scene", "", "Scene executed");
    }
    catch (e) { addToastRef.current("error", (e as Error).message); }
  }, [addActivity]);

  return (
    <DeviceContext.Provider value={{
      devices, rooms, scenes, pinValues, onlineDeviceIds, deviceDiagnostics, recentActivity, weather, sensorHistory,
      loading, loadError, wsConnected,
      refetchAll, togglePin, saveDeviceEdit, addPin, saveEditPin, deletePin,
      createRoom, renameRoom, deleteRoom, createScene, updateScene, deleteScene, executeScene,
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  return useContext(DeviceContext);
}

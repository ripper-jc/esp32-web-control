import { memo, useState } from "react";
import { Link } from "react-router-dom";
import type { Device, Room } from "../lib/types";
import { useDevices } from "../context/DeviceContext";

type DeviceCardProps = {
  device: Device;
  isOnline: boolean;
  rooms: Room[];
  compact?: boolean;
};

export default memo(function DeviceCard({ device, isOnline, rooms, compact }: DeviceCardProps) {
  const { pinValues, togglePin, saveDeviceEdit, addPin, saveEditPin, deletePin } = useDevices();
  const pins = device.pins || {};

  const [isEditing, setIsEditing] = useState(false);
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editDeviceRoomId, setEditDeviceRoomId] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingPinKey, setEditingPinKey] = useState<string | null>(null);
  const [editPinData, setEditPinData] = useState({ label: "", mode: "output", category: "other" });
  const [newPin, setNewPin] = useState({ pin: "", label: "", mode: "output", category: "other" });
  const [submitting, setSubmitting] = useState(false);

  const guard = async (fn: () => Promise<void>) => {
    if (submitting) return;
    setSubmitting(true);
    try { await fn(); } finally { setSubmitting(false); }
  };

  const handleSaveDeviceEdit = () => guard(async () => {
    await saveDeviceEdit(device.deviceId, {
      ...(editDeviceName ? { name: editDeviceName } : {}),
      roomId: editDeviceRoomId || null,
    });
    setIsEditing(false);
  });

  const handleSaveEditPin = () => guard(async () => {
    if (!editingPinKey) return;
    const pin = editingPinKey.slice(editingPinKey.indexOf(":") + 1);
    await saveEditPin(device.deviceId, pin, editPinData);
    setEditingPinKey(null);
  });

  const handleAddPin = () => guard(async () => {
    if (!newPin.pin || !newPin.label) return;
    await addPin(device.deviceId, newPin.pin, { label: newPin.label, mode: newPin.mode, category: newPin.category });
    setNewPin({ pin: "", label: "", mode: "output", category: "other" });
  });

  return (
    <div className="card mb-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        {isEditing ? (
          <div className="flex gap-2 items-center flex-wrap">
            <input className="input-field" value={editDeviceName} onChange={(e) => setEditDeviceName(e.target.value)} placeholder="Device name" />
            <select className="input-field" value={editDeviceRoomId} onChange={(e) => setEditDeviceRoomId(e.target.value)}>
              <option value="">No room</option>
              {rooms.map((room) => <option key={room.roomId} value={room.roomId}>{room.name}</option>)}
            </select>
            <button className="btn-primary text-xs" onClick={handleSaveDeviceEdit} disabled={submitting}>Save</button>
            <button className="btn-secondary text-xs" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 shadow-md shadow-green-400/50" : "bg-gray-600"}`} />
            <Link to={`/devices/${device.deviceId}`} className="font-semibold text-white hover:text-brand-400 transition-colors">
              {device.name || device.deviceId}
            </Link>
            {device.name && <span className="text-xs text-gray-600 font-mono">{device.deviceId}</span>}
          </div>
        )}
        {!compact && (
          <div className="flex gap-3">
            {!isEditing && (
              <button
                className="text-xs text-gray-500 hover:text-brand-400 transition-colors"
                onClick={() => { setIsEditing(true); setEditDeviceName(device.name || ""); setEditDeviceRoomId(device.roomId || ""); }}
              >
                Edit
              </button>
            )}
            <button className="text-xs text-gray-500 hover:text-white transition-colors" onClick={() => setIsSettingsOpen((p) => !p)}>
              {isSettingsOpen ? "Close pins" : "Manage pins"}
            </button>
          </div>
        )}
      </div>

      {/* Pin controls */}
      <div className="flex flex-wrap gap-5">
        {Object.keys(pins).length === 0 && <p className="text-sm text-gray-600">No pins configured.</p>}
        {Object.keys(pins).map((pin) => {
          const pinCfg = pins[pin];
          const key = `${device.deviceId}:${pin}`;
          const value = pinValues.get(key) ?? pinCfg.lastValue;
          const isOutput = pinCfg.mode === "output";

          return (
            <div key={pin} className="flex flex-col items-center">
              <p className="text-xs font-medium text-gray-400 mb-2">
                {pinCfg.label}
                <span className="ml-1 text-gray-600">{pin}</span>
              </p>
              {isOutput ? (
                <label className="inline-flex relative items-center cursor-pointer">
                  <input type="checkbox" checked={value !== 0} onChange={() => togglePin(device.deviceId, pin, value)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-brand-600 peer-focus:ring-2 peer-focus:ring-brand-500/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full transition-colors" />
                  <span className="ml-2 text-xs text-gray-400">{value !== 0 ? "On" : "Off"}</span>
                </label>
              ) : (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${value !== 0 ? "bg-green-500/15 text-green-400" : "bg-surface-300 text-gray-500"}`}>
                  {value !== 0 ? "HIGH" : "LOW"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sensor readings */}
      {device.sensorReadings && Object.keys(device.sensorReadings).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(device.sensorReadings).map(([key, val]) => (
            <div key={key} className="text-xs bg-surface-200 px-2.5 py-1.5 rounded-lg border border-white/5">
              <span className="text-gray-500">{key} </span>
              <span className="font-semibold text-white">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pin management */}
      {isSettingsOpen && (
        <div className="mt-5 border-t border-white/5 pt-5">
          <h4 className="text-sm font-semibold mb-3 text-white">Pin Configuration</h4>
          {Object.keys(pins).map((pin) => {
            const pinKey = `${device.deviceId}:${pin}`;
            const isEditingThis = editingPinKey === pinKey;
            return (
              <div key={pin} className="flex items-center gap-2 mb-2 text-sm flex-wrap">
                <span className="font-mono text-gray-600 w-8">P{pin}</span>
                {isEditingThis ? (
                  <>
                    <input className="input-field w-24" value={editPinData.label} onChange={(e) => setEditPinData((p) => ({ ...p, label: e.target.value }))} placeholder="Label" />
                    <select className="input-field" value={editPinData.mode} onChange={(e) => setEditPinData((p) => ({ ...p, mode: e.target.value }))}>
                      <option value="output">output</option><option value="input">input</option><option value="input_pullup">input_pullup</option>
                    </select>
                    <select className="input-field" value={editPinData.category} onChange={(e) => setEditPinData((p) => ({ ...p, category: e.target.value }))}>
                      <option value="light">light</option><option value="fan">fan</option><option value="sensor">sensor</option><option value="door">door</option><option value="pir">PIR motion</option><option value="dht11">DHT11</option><option value="dht22">DHT22</option><option value="bme280">BME280</option><option value="relay">relay</option><option value="other">other</option>
                    </select>
                    <button className="btn-primary text-xs" onClick={handleSaveEditPin} disabled={submitting}>Save</button>
                    <button className="btn-secondary text-xs" onClick={() => setEditingPinKey(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="text-white">{pins[pin].label}</span>
                    <span className="text-gray-600">{pins[pin].mode}</span>
                    <span className="text-gray-600">{pins[pin].category}</span>
                    <button className="text-brand-400 text-xs hover:underline" onClick={() => { setEditingPinKey(pinKey); setEditPinData({ label: pins[pin].label, mode: pins[pin].mode, category: pins[pin].category }); }}>Edit</button>
                    <button className="text-red-400 text-xs hover:underline" onClick={() => deletePin(device.deviceId, pin)}>Delete</button>
                  </>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <input className="input-field w-16" value={newPin.pin} onChange={(e) => setNewPin((p) => ({ ...p, pin: e.target.value }))} placeholder="Pin #" type="number" min="0" max="39" />
            <input className="input-field" value={newPin.label} onChange={(e) => setNewPin((p) => ({ ...p, label: e.target.value }))} placeholder="Label" />
            <select className="input-field" value={newPin.mode} onChange={(e) => setNewPin((p) => ({ ...p, mode: e.target.value }))}>
              <option value="output">output</option><option value="input">input</option><option value="input_pullup">input_pullup</option>
            </select>
            <select className="input-field" value={newPin.category} onChange={(e) => setNewPin((p) => ({ ...p, category: e.target.value }))}>
              <option value="light">light</option><option value="fan">fan</option><option value="sensor">sensor</option><option value="door">door</option><option value="pir">PIR motion</option><option value="dht11">DHT11</option><option value="dht22">DHT22</option><option value="bme280">BME280</option><option value="relay">relay</option><option value="other">other</option>
            </select>
            <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50" onClick={handleAddPin} disabled={submitting}>Add pin</button>
          </div>
        </div>
      )}
    </div>
  );
});

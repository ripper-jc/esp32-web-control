import { useRef, useState } from "react";
import { useDevices } from "../context/DeviceContext";
import { useToast } from "../components/Toast";
import { apiFetch } from "../lib/api";
import DeviceIcon from "../components/DeviceIcon";

export default function FloorPlan() {
  const { devices, onlineDeviceIds, pinValues, togglePin, refetchAll } = useDevices();
  const { addToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgImage, setBgImage] = useState<string>(localStorage.getItem("floorPlanImage") || "");
  const [dragging, setDragging] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 1920;
      const MAX_H = 1080;
      const scale = Math.min(1, MAX_W / img.width, MAX_H / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setBgImage(dataUrl);
      try {
        localStorage.setItem("floorPlanImage", dataUrl);
      } catch (_) {
        addToast("warning", "Image too large to cache — will reset on reload");
      }
    };
    img.src = objectUrl;
  };

  const handleDrop = async (deviceId: string, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    try {
      await apiFetch(`/api/devices/${deviceId}`, { method: "PATCH", body: JSON.stringify({ floorX: Math.round(x), floorY: Math.round(y) }) });
      addToast("success", "Device position saved");
      await refetchAll();
    } catch (_) {
      addToast("error", "Failed to save position");
    }
  };

  const placedDevices = devices.filter((d) => d.floorX !== undefined && d.floorY !== undefined);
  const unplacedDevices = devices.filter((d) => d.floorX === undefined || d.floorY === undefined);

  const getCategories = (d: typeof devices[0]) => d.pins ? Object.values(d.pins).map((p) => p.category) : [];

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">Floor Plan</h1>
        <label className="btn-secondary text-xs cursor-pointer">
          {bgImage ? "Change Image" : "Upload Floor Plan"}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      {/* Floor plan area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] bg-surface-100 border border-white/5 rounded-2xl overflow-hidden mb-8"
        style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (dragging) handleDrop(dragging, e.clientX, e.clientY);
          setDragging(null);
        }}
      >
        {!bgImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 text-sm">Upload a floor plan image, then drag devices onto it</p>
          </div>
        )}

        {placedDevices.map((d) => {
          const isOnline = onlineDeviceIds.has(d.deviceId);
          const hasOutputOn = d.pins && Object.keys(d.pins).some((pin) => {
            if (d.pins![pin].mode !== "output") return false;
            const val = pinValues.get(`${d.deviceId}:${pin}`) ?? d.pins![pin].lastValue;
            return val !== 0;
          });

          return (
            <div
              key={d.deviceId}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group`}
              style={{ left: `${d.floorX}%`, top: `${d.floorY}%` }}
              draggable
              onDragStart={() => setDragging(d.deviceId)}
              onClick={() => {
                // Toggle first output pin
                if (d.pins) {
                  const outPin = Object.keys(d.pins).find((p) => d.pins![p].mode === "output");
                  if (outPin) {
                    const val = pinValues.get(`${d.deviceId}:${outPin}`) ?? d.pins[outPin].lastValue;
                    togglePin(d.deviceId, outPin, val);
                  }
                }
              }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                hasOutputOn ? "bg-brand-600 shadow-lg shadow-brand-600/40" : "bg-surface-200 border border-white/10"
              } ${!isOnline ? "opacity-40" : ""}`}>
                <DeviceIcon categories={getCategories(d)} className="w-5 h-5 text-white" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-black/80 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {d.name || d.deviceId}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unplaced devices */}
      {unplacedDevices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Drag to floor plan</h2>
          <div className="flex flex-wrap gap-2">
            {unplacedDevices.map((d) => (
              <div
                key={d.deviceId}
                draggable
                onDragStart={() => setDragging(d.deviceId)}
                className="card py-2 px-3 cursor-grab flex items-center gap-2 text-sm"
              >
                <DeviceIcon categories={getCategories(d)} className="w-4 h-4 text-gray-400" />
                <span className="text-white">{d.name || d.deviceId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

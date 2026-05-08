import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/Toast";
import { SkeletonList } from "../components/Skeleton";
import type { ScheduleSlot } from "../lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Schedule() {
  const { addToast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleSlot[][]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editingSlot, setEditingSlot] = useState<{ index: number; time: string; temperature: string } | null>(null);
  const [newSlot, setNewSlot] = useState({ time: "", temperature: "" });
  const [nowTemp, setNowTemp] = useState("");

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ schedule: ScheduleSlot[][] }>("/api/schedule");
      setSchedule(data.schedule || []);
    } catch (_) {
      setSchedule(Array.from({ length: 7 }, () => []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const daySlots = schedule[selectedDay] || [];

  const saveDay = async (slots: ScheduleSlot[]) => {
    const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time));
    try {
      await apiFetch(`/api/schedule/weekday/${selectedDay}`, { method: "PUT", body: JSON.stringify({ slots: sorted }) });
      setSchedule((prev) => { const next = [...prev]; while (next.length <= selectedDay) next.push([]); next[selectedDay] = sorted; return next; });
      addToast("success", "Schedule updated");
    } catch (e) { addToast("error", (e as Error).message); }
  };

  const handleAddSlot = async () => {
    if (!newSlot.time || !newSlot.temperature) return;
    const temp = Number(newSlot.temperature);
    if (isNaN(temp) || temp < 80 || temp > 180) { addToast("error", "Temperature must be 80-180°F"); return; }
    if (daySlots.some((s) => s.time === newSlot.time)) { addToast("error", "A slot at this time already exists"); return; }
    await saveDay([...daySlots, { time: newSlot.time, temperature: temp }]);
    setNewSlot({ time: "", temperature: "" });
  };

  const handleDeleteSlot = async (index: number) => { await saveDay(daySlots.filter((_, i) => i !== index)); };

  const handleSaveEdit = async () => {
    if (!editingSlot) return;
    const temp = Number(editingSlot.temperature);
    if (isNaN(temp) || temp < 80 || temp > 180) return;
    await saveDay(daySlots.map((s, i) => i === editingSlot.index ? { time: editingSlot.time, temperature: temp } : s));
    setEditingSlot(null);
  };

  const handleSetNow = async () => {
    const temp = Number(nowTemp);
    if (isNaN(temp) || temp < 80 || temp > 180) { addToast("error", "Temperature must be 80-180°F"); return; }
    try {
      await apiFetch("/api/schedule/now", { method: "PUT", body: JSON.stringify({ temperature: temp }) });
      addToast("success", `Temperature set to ${temp}°F`);
      setNowTemp("");
    } catch (e) { addToast("error", (e as Error).message); }
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-white mb-8 tracking-tight">Schedule</h1>

      {/* Set Now override */}
      <div className="card mb-8">
        <h3 className="text-sm font-semibold text-white mb-3">Temperature Override</h3>
        <p className="text-xs text-gray-500 mb-3">Set temperature immediately on all devices.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="number" className="input-field w-28" placeholder="Temp (°F)" value={nowTemp} onChange={(e) => setNowTemp(e.target.value)} min="80" max="180"
            onKeyDown={(e) => e.key === "Enter" && handleSetNow()} />
          <button className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-yellow-600/20" onClick={handleSetNow}>
            Set Now
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => { setSelectedDay(i); setEditingSlot(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === i ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" : "bg-surface-100 text-gray-500 border border-white/5 hover:text-white"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">{DAYS[selectedDay]}</h2>

      {loading ? <SkeletonList rows={3} /> : (
        <div className="card p-0 divide-y divide-white/5 mb-5">
          {daySlots.length === 0 && <p className="px-5 py-8 text-sm text-gray-600 text-center">No time slots set for this day.</p>}
          {daySlots.map((slot, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4 flex-wrap">
              {editingSlot?.index === i ? (
                <>
                  <input type="time" className="input-field" value={editingSlot.time} onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })} />
                  <input type="number" className="input-field w-20" value={editingSlot.temperature} onChange={(e) => setEditingSlot({ ...editingSlot, temperature: e.target.value })} min="80" max="180"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()} />
                  <span className="text-xs text-gray-600">°F</span>
                  <button className="btn-primary text-xs" onClick={handleSaveEdit}>Save</button>
                  <button className="btn-secondary text-xs" onClick={() => setEditingSlot(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="text-lg font-mono text-white w-16">{slot.time}</span>
                  <span className="text-lg font-bold text-brand-400">{slot.temperature}&deg;F</span>
                  <div className="flex-1" />
                  <button className="text-gray-500 text-xs hover:text-brand-400 transition-colors" onClick={() => setEditingSlot({ index: i, time: slot.time, temperature: String(slot.temperature) })}>Edit</button>
                  <button className="text-gray-500 text-xs hover:text-red-400 transition-colors" onClick={() => handleDeleteSlot(i)}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <input type="time" className="input-field" value={newSlot.time} onChange={(e) => setNewSlot((p) => ({ ...p, time: e.target.value }))} />
        <input type="number" className="input-field w-24" placeholder="Temp (°F)" value={newSlot.temperature} onChange={(e) => setNewSlot((p) => ({ ...p, temperature: e.target.value }))} min="80" max="180"
          onKeyDown={(e) => e.key === "Enter" && handleAddSlot()} />
        <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-green-600/20" onClick={handleAddSlot}>Add slot</button>
      </div>
    </div>
  );
}

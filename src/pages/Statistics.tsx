import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import type { UsageStats } from "../lib/types";
import { SkeletonList } from "../components/Skeleton";

export default function Statistics() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try { setStats(await apiFetch<UsageStats>("/api/stats")); } catch (_) {}
    setLoading(false);
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Statistics</h1>
        <button onClick={fetchStats} className="text-xs text-gray-500 hover:text-brand-400 transition-colors">Refresh</button>
      </div>

      {loading ? <SkeletonList rows={4} /> : !stats || stats.devices.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-500">No statistics available yet.</p></div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 mb-1">Total Events (24h)</p>
              <p className="text-2xl font-bold text-white">{stats.devices.reduce((s, d) => s + d.eventsDay, 0)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 mb-1">Total Events (7d)</p>
              <p className="text-2xl font-bold text-white">{stats.devices.reduce((s, d) => s + d.eventsWeek, 0)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 mb-1">Most Active</p>
              <p className="text-lg font-bold text-brand-400 truncate">
                {stats.devices.sort((a, b) => b.eventsWeek - a.eventsWeek)[0]?.name || "—"}
              </p>
            </div>
          </div>

          {/* Per-device table */}
          <div className="card p-0">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-4 text-xs text-gray-500 font-semibold">
              <span className="flex-1">Device</span>
              <span className="w-16 text-right">Pins</span>
              <span className="w-20 text-right">24h</span>
              <span className="w-20 text-right">7 days</span>
            </div>
            {stats.devices.sort((a, b) => b.eventsWeek - a.eventsWeek).map((d) => (
              <div key={d.deviceId} className="px-5 py-3 border-b border-white/5 last:border-0 flex items-center gap-4 text-sm">
                <span className="flex-1 text-white truncate">{d.name}</span>
                <span className="w-16 text-right text-gray-500">{d.pinCount}</span>
                <span className="w-20 text-right text-gray-400">{d.eventsDay}</span>
                <span className="w-20 text-right text-gray-400">{d.eventsWeek}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

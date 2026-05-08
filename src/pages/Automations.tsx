import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useDevices } from "../context/DeviceContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonList } from "../components/Skeleton";

type RuleTrigger = { type: string; deviceId?: string; pin?: string; comparison?: string; threshold?: number; status?: string; cron?: string; days?: number[]; weatherField?: string; weatherComparison?: string; weatherThreshold?: number };
type RuleCondition = { type: string; after?: string; before?: string };
type RuleAction = { type: string; deviceId?: string; pin?: string; value?: number; message?: string; webhookUrl?: string; sceneId?: string };
type AutomationRule = { ruleId: string; name: string; enabled: boolean; trigger: RuleTrigger; conditions?: RuleCondition[]; actions: RuleAction[] };

export default function Automations() {
  const { devices } = useDevices();
  const { addToast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<RuleTrigger>({ type: "pinValueChange", deviceId: "", pin: "", comparison: "eq", threshold: 1 });
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchRules = useCallback(async () => { try { setRules(await apiFetch<AutomationRule[]>("/api/rules")); } catch (_) {} setLoading(false); }, []);
  useEffect(() => { fetchRules(); }, [fetchRules]);

  const allPins: { deviceId: string; deviceName: string; pin: string; label: string; mode: string }[] = [];
  devices.forEach((d) => { if (d.pins) Object.keys(d.pins).forEach((pin) => { allPins.push({ deviceId: d.deviceId, deviceName: d.name || d.deviceId, pin, label: d.pins![pin].label, mode: d.pins![pin].mode }); }); });

  const handleCreate = async () => {
    if (!name.trim()) return;
    if ((trigger.type === "pinValueChange" || trigger.type === "deviceStatus") && !trigger.deviceId) return;
    try {
      const rule = await apiFetch<AutomationRule>("/api/rules", { method: "POST", body: JSON.stringify({ name, trigger, conditions: conditions.length > 0 ? conditions : undefined, actions }) });
      setRules((prev) => [...prev, rule]);
      setName(""); setTrigger({ type: "pinValueChange", deviceId: "", pin: "", comparison: "eq", threshold: 1 }); setActions([]); setShowCreate(false);
      addToast("success", "Rule created");
    } catch (e) { addToast("error", (e as Error).message); }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try { await apiFetch(`/api/rules/${ruleId}`, { method: "PATCH", body: JSON.stringify({ enabled }) }); setRules((prev) => prev.map((r) => r.ruleId === ruleId ? { ...r, enabled } : r)); } catch (_) {}
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try { await apiFetch(`/api/rules/${deleteTarget.id}`, { method: "DELETE" }); setRules((prev) => prev.filter((r) => r.ruleId !== deleteTarget.id)); addToast("success", "Rule deleted"); } catch (_) {}
    setDeleteTarget(null);
  }, [deleteTarget, addToast]);

  return (
    <div className="animate-fade-up">
      <ConfirmDialog open={!!deleteTarget} title="Delete Rule" message={`Delete rule "${deleteTarget?.name}"?`} onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Automations</h1>
        <button className={showCreate ? "btn-secondary" : "btn-primary"} onClick={() => setShowCreate((p) => !p)}>{showCreate ? "Cancel" : "New Rule"}</button>
      </div>

      {showCreate && (
        <div className="card mb-8">
          <p className="text-xs text-gray-500 mb-4">Rules run automatically: choose a trigger event, optional time conditions, and one or more actions.</p>
          <input className="input-field w-full mb-4" placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setShowCreate(false)} />

          <h3 className="text-sm font-semibold text-white mb-3">When... <span className="font-normal text-gray-500 text-xs">(trigger event)</span></h3>
          <div className="flex gap-2 flex-wrap mb-5">
            <select className="input-field" value={trigger.type} onChange={(e) => setTrigger((t) => ({ ...t, type: e.target.value }))}>
              <option value="pinValueChange">Pin changes</option><option value="deviceStatus">Device status</option><option value="schedule">Time schedule</option><option value="weather">Weather</option>
            </select>
            <select className="input-field" value={trigger.deviceId} onChange={(e) => setTrigger((t) => ({ ...t, deviceId: e.target.value }))}>
              <option value="">Select device</option>
              {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.name || d.deviceId}</option>)}
            </select>
            {trigger.type === "pinValueChange" && (
              <>
                <select className="input-field" value={trigger.pin || ""} onChange={(e) => setTrigger((t) => ({ ...t, pin: e.target.value }))}>
                  <option value="">Select pin</option>
                  {allPins.filter((p) => p.deviceId === trigger.deviceId).map((p) => <option key={p.pin} value={p.pin}>{p.label} (GPIO{p.pin})</option>)}
                </select>
                <select className="input-field" value={trigger.comparison || "eq"} onChange={(e) => setTrigger((t) => ({ ...t, comparison: e.target.value }))}>
                  <option value="eq">equals</option><option value="gt">greater than</option><option value="lt">less than</option>
                </select>
                <input className="input-field w-16" type="number" value={trigger.threshold ?? 1} onChange={(e) => setTrigger((t) => ({ ...t, threshold: Number(e.target.value) }))} />
              </>
            )}
            {trigger.type === "deviceStatus" && (
              <select className="input-field" value={trigger.status || "offline"} onChange={(e) => setTrigger((t) => ({ ...t, status: e.target.value }))}>
                <option value="online">comes online</option><option value="offline">goes offline</option>
              </select>
            )}
            {trigger.type === "schedule" && (
              <>
                <input type="time" className="input-field" value={trigger.cron || ""} onChange={(e) => setTrigger((t) => ({ ...t, cron: e.target.value }))} />
                <span className="text-xs text-gray-500">Days:</span>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                  <label key={d} className="flex items-center gap-1 text-xs text-gray-400">
                    <input type="checkbox" checked={(trigger.days || []).includes(i)} onChange={(e) => {
                      setTrigger((t) => ({ ...t, days: e.target.checked ? [...(t.days || []), i] : (t.days || []).filter((x) => x !== i) }));
                    }} className="rounded" />{d}
                  </label>
                ))}
              </>
            )}
            {trigger.type === "weather" && (
              <>
                <select className="input-field" value={trigger.weatherField || "temperature"} onChange={(e) => setTrigger((t) => ({ ...t, weatherField: e.target.value }))}>
                  <option value="temperature">Temperature</option><option value="humidity">Humidity</option><option value="windSpeed">Wind Speed</option>
                </select>
                <select className="input-field" value={trigger.weatherComparison || "gt"} onChange={(e) => setTrigger((t) => ({ ...t, weatherComparison: e.target.value }))}>
                  <option value="gt">above</option><option value="lt">below</option>
                </select>
                <input type="number" className="input-field w-20" value={trigger.weatherThreshold ?? ""} onChange={(e) => setTrigger((t) => ({ ...t, weatherThreshold: Number(e.target.value) }))} />
                <span className="text-xs text-gray-500">
                  {(trigger.weatherField || "temperature") === "temperature" ? "°C" : (trigger.weatherField === "humidity" ? "%" : "km/h")}
                </span>
              </>
            )}
          </div>

          {/* Conditions */}
          <h3 className="text-sm font-semibold text-white mb-3">Only if... <span className="font-normal text-gray-500 text-xs">(optional time filter)</span></h3>
          {conditions.map((cond, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center flex-wrap">
              <span className="text-xs text-gray-500">Time between</span>
              <input type="time" className="input-field" value={cond.after || ""} onChange={(e) => setConditions((prev) => prev.map((c, j) => j === i ? { ...c, after: e.target.value } : c))} />
              <span className="text-xs text-gray-500">and</span>
              <input type="time" className="input-field" value={cond.before || ""} onChange={(e) => setConditions((prev) => prev.map((c, j) => j === i ? { ...c, before: e.target.value } : c))} />
              <button className="text-red-400 text-xs hover:underline" onClick={() => setConditions((prev) => prev.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button className="text-xs text-gray-500 hover:text-brand-400 transition-colors mb-5" onClick={() => setConditions((prev) => [...prev, { type: "timeRange", after: "08:00", before: "22:00" }])}>+ Add time condition</button>

          <h3 className="text-sm font-semibold text-white mb-3">Then... <span className="font-normal text-gray-500 text-xs">(what to do)</span></h3>
          {actions.map((action, i) => (
            <div key={i} className="flex gap-2 mb-2 flex-wrap items-center">
              <select className="input-field" value={action.type} onChange={(e) => setActions((prev) => prev.map((a, j) => j === i ? { ...a, type: e.target.value } : a))}>
                <option value="setPin">Set pin</option><option value="sendNotification">Notify</option><option value="webhook">Webhook</option><option value="executeScene">Run scene</option>
              </select>
              {action.type === "setPin" && (
                <>
                  <select className="input-field" value={`${action.deviceId || ""}:${action.pin || ""}`} onChange={(e) => { const [dId, p] = e.target.value.split(":"); setActions((prev) => prev.map((a, j) => j === i ? { ...a, deviceId: dId, pin: p } : a)); }}>
                    <option value=":">Select pin</option>
                    {allPins.filter((p) => p.mode === "output").map((p) => <option key={`${p.deviceId}:${p.pin}`} value={`${p.deviceId}:${p.pin}`}>{p.deviceName} — {p.label}</option>)}
                  </select>
                  <select className="input-field w-20" value={action.value ?? 1} onChange={(e) => setActions((prev) => prev.map((a, j) => j === i ? { ...a, value: Number(e.target.value) } : a))}>
                    <option value={1}>ON</option><option value={0}>OFF</option>
                  </select>
                </>
              )}
              {action.type === "sendNotification" && (
                <input className="input-field flex-1" placeholder="Message" value={action.message || ""} onChange={(e) => setActions((prev) => prev.map((a, j) => j === i ? { ...a, message: e.target.value } : a))} />
              )}
              {action.type === "webhook" && (
                <input className="input-field flex-1" placeholder="https://api.telegram.org/..." value={action.webhookUrl || ""} onChange={(e) => setActions((prev) => prev.map((a, j) => j === i ? { ...a, webhookUrl: e.target.value } : a))} />
              )}
              {action.type === "executeScene" && (
                <input className="input-field flex-1" placeholder="Scene ID" value={action.sceneId || ""} onChange={(e) => setActions((prev) => prev.map((a, j) => j === i ? { ...a, sceneId: e.target.value } : a))} />
              )}
              <button className="text-red-400 text-xs hover:underline" onClick={() => setActions((prev) => prev.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button className="btn-secondary text-xs" onClick={() => setActions((prev) => [...prev, { type: "setPin", value: 1 }])}>Add action</button>
            <button className="btn-primary text-xs" onClick={handleCreate}>Create Rule</button>
          </div>
        </div>
      )}

      {loading ? <SkeletonList rows={3} /> : rules.length === 0 && !showCreate ? (
        <div className="card text-center py-12"><p className="text-gray-500 mb-2">No automation rules yet</p><p className="text-sm text-gray-600">Create one to automate your smart house.</p></div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.ruleId} className="card flex items-center gap-4">
              <label className="inline-flex relative items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" checked={rule.enabled} onChange={(e) => toggleRule(rule.ruleId, e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-5 bg-surface-300 peer-checked:bg-brand-600 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${rule.enabled ? "text-white" : "text-gray-600"}`}>{rule.name}</h3>
                <p className="text-xs text-gray-600 truncate">
                  {rule.trigger.type === "pinValueChange" ? `Pin ${rule.trigger.pin} ${rule.trigger.comparison} ${rule.trigger.threshold}` : `Device ${rule.trigger.status}`}
                  {" → "}{rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button className="text-gray-600 text-xs hover:text-red-400 transition-colors flex-shrink-0" onClick={() => setDeleteTarget({ id: rule.ruleId, name: rule.name })}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

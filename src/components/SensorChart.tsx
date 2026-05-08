import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DataPoint = { timestamp: number; value: number };

type Props = {
  data: DataPoint[];
  label: string;
  color?: string;
  unit?: string;
};

export default function SensorChart({ data, label, color = "#6366f1", unit = "" }: Props) {
  const chartData = useMemo(() =>
    data.map((d) => ({
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: d.value,
    })),
  [data]);

  if (chartData.length < 2) {
    return (
      <div className="card">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-600">Waiting for data...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold text-white">{chartData[chartData.length - 1]?.value}{unit}</p>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData}>
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", fontSize: 12 }}
            labelStyle={{ color: "#999" }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

export function ReportsChart({ data }: { data: { period: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        Aucune donnée
      </div>
    );
  }

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.period,
    value: d.total,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${(value ?? 0).toLocaleString("fr-DZ")} DA`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

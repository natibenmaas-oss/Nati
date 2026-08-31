"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SkillHistoryPoint } from "@/lib/scoring/progress-history";

export function ProgressChart({ data }: { data: SkillHistoryPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: string) => new Date(v).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} width={32} />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
          labelFormatter={(v) => new Date(String(v)).toLocaleDateString("he-IL")}
          formatter={(value) => [`${value}%`, "ציון"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--color-chart-1)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--color-chart-1)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MockPoint } from "@/domain/dashboard";

export function TrendChart({ points }: { points: MockPoint[] }) {
  const data = points.map((point, index) => ({
    name: `${index + 1}`,
    score: point.netScore,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--line)" />
          <XAxis dataKey="name" stroke="var(--muted)" />
          <YAxis stroke="var(--muted)" />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

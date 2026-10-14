"use client";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Point = { label: string; pct: number; title: string };

/** Прогресс сызығы: түстер CSS токендерінен (қараңғы режимде де оқылады). */
export function GradesChart({ data }: { data: Point[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div role="img" aria-label={`Прогресс сызығы: ${data.length} баға, соңғысы ${data[data.length - 1]?.pct ?? 0}%`} className="h-64 w-full">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--line)" />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--line)" />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }}
              labelStyle={{ color: "var(--ink-muted)" }} itemStyle={{ color: "var(--ink)" }}
              formatter={(v) => [`${v}%`, "Нәтиже"]} labelFormatter={(_, p) => (p?.[0]?.payload as Point | undefined)?.title ?? ""} />
            <Line type="monotone" dataKey="pct" stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--brand)", stroke: "var(--surface)" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

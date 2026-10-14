"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Bucket = { bucket: string; students: number };

/** Бағалар таралуы: түстер тек CSS токендерінен (жарық/қараңғы режимде оқылады). */
export function GradeChart({ data }: { data: Bucket[] }) {
  const total = data.reduce((s, d) => s + d.students, 0);
  return (
    <figure>
      <div role="img" aria-label={`Бағалар таралуы: ${data.map((d) => `${d.bucket}% - ${d.students} оқушы`).join("; ")}`} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} unit="%" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "var(--brand-soft)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", fontSize: 13 }}
              labelStyle={{ color: "var(--ink)" }} itemStyle={{ color: "var(--ink)" }}
              labelFormatter={(l) => `${l}%`} formatter={(v) => [String(v), "Оқушы"]}
            />
            <Bar dataKey="students" name="Оқушы" fill="var(--brand)" radius={[6, 6, 0, 0]} maxBarSize={72} label={{ position: "top", fill: "var(--ink)", fontSize: 12 }} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-1 text-xs text-ink-muted">Оқушылардың орташа балы (%) бойынша аралықтар. Барлығы: {total} оқушы.</figcaption>
    </figure>
  );
}

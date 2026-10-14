"use client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ActivityPoint = { day: string; submissions: number; active_students: number };

const short = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;

/** Белсенділік графигі (жіберілген жұмыс пен белсенді оқушы). Түстер CSS айнымалылары: қараңғы режимде де оқылады. */
export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const total = data.reduce((a, d) => a + d.submissions, 0);
  return (
    <figure className="qc-chart m-0">
      <style>{`.qc-chart{--c1:#2563eb;--c2:#c2410c}.dark .qc-chart{--c1:#60a5fa;--c2:#fbbf24}`}</style>
      <div role="img" aria-label={`Соңғы ${data.length} күндегі белсенділік графигі: барлығы ${total} жіберілген жұмыс`} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis dataKey="day" tickFormatter={short} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--line)" interval="preserveStartEnd" minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--line)" />
            <Tooltip
              labelFormatter={(l) => short(String(l))}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }}
              labelStyle={{ color: "var(--ink)" }} itemStyle={{ color: "var(--ink)" }} />
            <Legend wrapperStyle={{ color: "var(--ink)", fontSize: 12 }} />
            <Line type="monotone" dataKey="submissions" name="Жіберілген жұмыс" stroke="var(--c1)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="active_students" name="Белсенді оқушы" stroke="var(--c2)" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

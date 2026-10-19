"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "@/lib/i18n/client";

export type Bucket = { bucket: string; students: number };

/** Бағалар таралуы: түстер тек CSS токендерінен (жарық/қараңғы режимде оқылады). */
export function GradeChart({ data }: { data: Bucket[] }) { const t = useT();
  const total = data.reduce((s, d) => s + d.students, 0);
  return (
    <figure>
      <div role="img" aria-label={t("Бағалар таралуы: {join}", { join: data.map((d) => t("{bucket}% - {students} оқушы", { bucket: d.bucket, students: d.students })).join("; ") })} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} unit="%" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "var(--brand-soft)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", fontSize: 13 }}
              labelStyle={{ color: "var(--ink)" }} itemStyle={{ color: "var(--ink)" }}
              labelFormatter={(l) => `${l}%`} formatter={(v) => [String(v), t("Оқушы")]}
            />
            <Bar dataKey="students" name={t("Оқушы")} fill="var(--brand)" radius={[6, 6, 0, 0]} maxBarSize={72} label={{ position: "top", fill: "var(--ink)", fontSize: 12 }} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-1 text-xs text-ink-muted">{t("Оқушылардың орташа балы (%) бойынша аралықтар. Барлығы: {total} оқушы.", { total })}</figcaption>
    </figure>
  );
}

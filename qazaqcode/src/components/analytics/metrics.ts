// Аналитика есептері (таза функциялар, дерекқорсыз тестілеуге болады).
export const SUPPORT_AVG_BELOW = 50;
export const SUPPORT_COMPLETION_BELOW = 50;

export type SupportInput = { assigned: number; submitted: number; avg_pct: number | null };

/** Қолдау керек оқушы себептері: орташа % < 50 немесе тапсырмаларының < 50% орындаған. Бос тізім = қолдау қажет емес. */
export function supportReasons(s: SupportInput): string[] {
  const out: string[] = [];
  if (s.avg_pct != null && s.avg_pct < SUPPORT_AVG_BELOW) out.push(`орташа нәтиже ${Math.round(s.avg_pct)}%`);
  if (s.assigned > 0) {
    const done = Math.round((s.submitted / s.assigned) * 100);
    if (done < SUPPORT_COMPLETION_BELOW) out.push(`тапсырмалардың ${done}% ғана орындалған`);
  }
  return out;
}

export type ProgressRow = { status: string; best_pct: number | null; time_spent: number; last_activity: string | null };
export type ProgressSummary = { total: number; done: number; completionPct: number | null; avgPct: number | null; seconds: number; last: string | null };

export function summarizeProgress(rows: ProgressRow[]): ProgressSummary {
  const total = rows.length;
  const done = rows.filter((r) => r.status === "graded" || r.status === "submitted").length;
  const pcts = rows.map((r) => r.best_pct).filter((v): v is number => v != null);
  const last = rows.map((r) => r.last_activity).filter((v): v is string => !!v).sort().pop() ?? null;
  return {
    total, done,
    completionPct: total ? Math.round((done / total) * 100) : null,
    avgPct: pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : null,
    seconds: rows.reduce((a, r) => a + (r.time_spent || 0), 0),
    last,
  };
}

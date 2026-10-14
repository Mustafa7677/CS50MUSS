import { withUser } from "@/lib/db";

export type MyAssignment = {
  assignment_id: string; title: string; kind: string; difficulty: string; max_score: string; deadline: string | null;
  classroom_id: string; classroom_name: string; status: string; best_score: string | null; attempts_used: string; max_attempts: number | null;
};

export const FILTERS = ["not_started", "in_progress", "submitted", "under_review", "graded", "overdue"] as const;

export const myAssignments = (userId: string) =>
  withUser(userId, (q) => q<MyAssignment>("select * from public.my_assignments()"));

export const isOverdue = (deadline: string | null, now = Date.now()) => !!deadline && new Date(deadline).getTime() < now;

/** Ең үздік баллдардың орташа пайызы (әр тапсырма бойынша бір баға, ұйым аналитикасымен бірдей әдіс). */
export function avgPct(rows: MyAssignment[]): number | null {
  const v = rows.filter((r) => r.best_score != null && Number(r.max_score) > 0).map((r) => (Number(r.best_score) / Number(r.max_score)) * 100);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

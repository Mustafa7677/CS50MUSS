import { notFound } from "next/navigation";
import { withUser } from "@/lib/db";
import type { Ctx } from "@/lib/context";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);
/** Жарамсыз id -> 404 (дерекқорға жарамсыз uuid жібермейміз) */
export function uuidOr404(s: string): string { if (!isUuid(s)) notFound(); return s; }

export type ClassRow = {
  id: string; org_id: string; teacher_id: string; name: string; academic_year: string; subject: string; description: string | null;
  student_limit: number | null; join_code: string; join_enabled: boolean; status: "active" | "archived"; created_at: string;
};

/** Сыныпты RLS арқылы оқиды: басқа ұстаздың сыныбы табылмайды -> 404. */
export async function loadClass(ctx: Ctx, id: string): Promise<ClassRow> {
  uuidOr404(id);
  const rows = await withUser(ctx.userId, (q) => q<ClassRow>("select * from public.classrooms where id = $1", [id]));
  const c = rows[0];
  if (!c) notFound();
  const isAdmin = ctx.memberships.some((m) => m.org_id === c.org_id && m.role === "school_admin");
  if (c.teacher_id !== ctx.userId && !isAdmin) notFound();
  return c;
}

export const toNum = (v: unknown) => (v == null ? 0 : Number(v));
export const pctOf = (score: unknown, max: unknown) => (Number(max) > 0 ? (Number(score) / Number(max)) * 100 : 0);

export const KINDS = ["python", "sql", "javascript", "html_css", "quiz", "file", "project"] as const;
export type Kind = (typeof KINDS)[number];
export const CODE_KINDS: readonly string[] = ["python", "sql", "javascript", "html_css", "project", "file"];

"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

export type SaveDraftInput = { assignmentId: string; code: string | null; answers: Record<string, number>; seconds: number };
export type SubmitResult = { status: "graded" | "submitted"; score?: number; max_score?: number; passed?: number; total?: number };

const saveSchema = z.object({
  assignmentId: z.string().uuid(),
  code: z.string().max(100_000).nullable(),
  answers: z.record(z.string().uuid(), z.number().int().min(0).max(20)),
  seconds: z.number().int().min(0).max(1_000_000),
});

async function uid() {
  const u = await currentUserId();
  if (!u) throw new AppError("unauthenticated");
  return u;
}

/** Авто сақтау: бір ашық жоба (draft). Қате болса клиент кодты өзінде сақтап, қайталайды. */
export async function saveDraftAction(input: SaveDraftInput): Promise<ActionResult<{ submissionId: string }>> {
  try {
    const u = await uid();
    const p = saveSchema.parse(input);
    await rateLimit("save_draft", 240, 5 * 60_000, u);
    const rows = await withUser(u, (q) =>
      q<{ id: string }>("select public.save_draft($1, $2, $3::jsonb, $4) as id", [p.assignmentId, p.code, JSON.stringify(p.answers), p.seconds]));
    return { ok: true, data: { submissionId: rows[0].id } };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("validation")) };
    return { ok: false, error: errorMessage(e) };
  }
}

/** Жұмысты жіберу. Тест болса бірден бағаланады. */
export async function submitAssignmentAction(submissionId: string, assignmentId: string): Promise<ActionResult<SubmitResult>> {
  try {
    const u = await uid();
    const id = z.string().uuid().parse(submissionId);
    const aid = z.string().uuid().parse(assignmentId);
    await rateLimit("submit", 60, 10 * 60_000, u);
    const rows = await withUser(u, (q) => q<{ r: SubmitResult }>("select public.submit_assignment($1) as r", [id]));
    revalidatePath("/student", "layout");
    revalidatePath(`/student/assignments/${aid}`);
    return { ok: true, data: rows[0].r, message: "Жұмыс жіберілді." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("validation")) };
    return { ok: false, error: errorMessage(e) };
  }
}

/** Сабақты аяқтады деп белгілеу (қайталауға қауіпсіз: on conflict do nothing). */
export async function completeLessonAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const u = await uid();
    const p = z.object({ lessonId: z.string().uuid(), courseId: z.string().uuid() }).parse({ lessonId: f.get("lessonId"), courseId: f.get("courseId") });
    await rateLimit("complete_lesson", 120, 5 * 60_000, u);
    await withUser(u, (q) => q("select public.complete_lesson($1)", [p.lessonId]));
    revalidatePath(`/student/courses/${p.courseId}`);
    revalidatePath("/student/courses");
    revalidatePath("/student");
    return { ok: true, message: "Сабақ аяқталды деп белгіленді." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("validation")) };
    return { ok: false, error: errorMessage(e) };
  }
}

"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withUser } from "@/lib/db";
import { requireStaff } from "@/lib/context";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

const UUID = (t: TFn) => z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, t("Идентификатор дұрыс емес."));
const str = (f: FormData, k: string) => String(f.get(k) ?? "");
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const CYR = /[а-яәіңғүұқөһё]/i;

function fail(e: unknown): ActionResult {
  if (e instanceof z.ZodError) {
    const m = e.issues[0]?.message ?? "";
    return { ok: false, error: CYR.test(m) ? m : errorMessage(new AppError("validation")) };
  }
  return { ok: false, error: errorMessage(e) };
}
/** Үнсіз (void) әрекеттерде қатені бетке ?err= арқылы қайтарамыз. */
function bounce(path: string, e: unknown): never {
  const r = fail(e);
  redirect(`${path}${path.includes("?") ? "&" : "?"}err=${encodeURIComponent(r.ok ? "" : r.error)}`);
}

const optInt = (min: number, max: number, msg: string) =>
  z.string().trim().regex(/^\d*$/, msg).transform((v) => (v === "" ? null : Number(v))).refine((v) => v === null || (v >= min && v <= max), msg);

const classFields = (t: TFn) => ({
  name: z.string().trim().min(1, t("Сынып атауын енгізіңіз.")).max(120, t("Атау тым ұзын.")),
  year: z.string().trim().min(4, t("Оқу жылы кемінде 4 символ (мысалы 2025-2026).")).max(20, t("Оқу жылы тым ұзын.")),
  subject: z.string().trim().min(1, t("Пәнді енгізіңіз.")).max(120, t("Пән атауы тым ұзын.")),
  description: z.string().trim().max(1000, t("Сипаттама 1000 символдан аспауы тиіс.")),
  limit: optInt(1, 500, t("Оқушы лимиті 1-ден 500-ге дейін.")),
});
const classSchema = (t: TFn) => z.object(classFields(t));
const readClass = (f: FormData, t: TFn) => classSchema(t).parse({
  name: str(f, "name"), year: str(f, "year"), subject: str(f, "subject"), description: str(f, "description"), limit: str(f, "limit"),
});

// ---------- Сыныптар ----------
export async function createClassAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  let id: string;
  try {
    const p = readClass(f, t);
    id = (await withUser(ctx.userId, (q) => q<{ id: string }>("select public.create_classroom($1,$2,$3,$4,$5,$6) as id",
      [ctx.active.org_id, p.name, p.year, p.subject, p.description || null, p.limit])))[0].id;
  } catch (e) { return fail(e); }
  revalidatePath("/teacher");
  redirect(`/teacher/classes/${id}?tab=join&ok=created`);
}

export async function updateClassAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  try {
    const classId = UUID(t).parse(str(f, "class_id"));
    const p = readClass(f, t);
    await withUser(ctx.userId, (q) => q("select public.update_classroom($1,$2,$3,$4,$5,$6,$7,$8)",
      [classId, p.name, p.year, p.subject, p.description || null, p.limit, bool(f, "join_enabled"), bool(f, "archived")]));
    revalidatePath(`/teacher/classes/${classId}`); revalidatePath("/teacher");
    return { ok: true, message: t("Сынып баптаулары сақталды.") };
  } catch (e) { return fail(e); }
}

export async function toggleJoinAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  const back = `/teacher/classes/${str(f, "class_id")}?tab=join`;
  try {
    const classId = UUID(t).parse(str(f, "class_id"));
    const enable = str(f, "enable") === "true";
    await withUser(ctx.userId, async (q) => {
      const c = (await q<any>("select * from public.classrooms where id = $1", [classId]))[0];
      if (!c) throw new AppError("not_found");
      await q("select public.update_classroom($1,$2,$3,$4,$5,$6,$7,$8)",
        [classId, c.name, c.academic_year, c.subject, c.description, c.student_limit, enable, c.status === "archived"]);
    });
    revalidatePath(`/teacher/classes/${classId}`);
  } catch (e) { bounce(back, e); }
  redirect(back);
}

export async function regenerateCodeAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  const back = `/teacher/classes/${str(f, "class_id")}?tab=join`;
  try {
    const classId = UUID(t).parse(str(f, "class_id"));
    await withUser(ctx.userId, (q) => q("select public.regenerate_join_code($1)", [classId]));
    revalidatePath(`/teacher/classes/${classId}`);
  } catch (e) { bounce(back, e); }
  redirect(`${back}&ok=code`);
}

export async function removeStudentAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  const back = `/teacher/classes/${str(f, "class_id")}`;
  try {
    const classId = UUID(t).parse(str(f, "class_id"));
    const studentId = UUID(t).parse(str(f, "student_id"));
    await withUser(ctx.userId, (q) => q("select public.remove_student($1,$2)", [classId, studentId]));
    revalidatePath(back); revalidatePath("/teacher");
  } catch (e) { bounce(back, e); }
  redirect(`${back}?ok=removed`);
}

// ---------- Тапсырмалар ----------
const KIND = z.enum(["python", "sql", "javascript", "html_css", "quiz", "file", "project"]);
const assignmentSchema = (t: TFn) => z.object({
  id: UUID(t).nullish(),
  title: z.string().trim().min(2, t("Тақырып кемінде 2 символ болуы тиіс.")).max(200, t("Тақырып тым ұзын.")),
  description: z.string().max(20000, t("Сипаттама тым ұзын.")),
  kind: KIND,
  difficulty: z.enum(["easy", "medium", "hard"]),
  max_score: z.number({ message: t("Максималды балл сан болуы тиіс.") }).gt(0, t("Максималды балл 0-ден үлкен болуы тиіс.")).max(1000, t("Максималды балл 1000-нан аспауы тиіс.")),
  starter_code: z.string().max(20000, t("Бастапқы код тым ұзын.")),
  max_attempts: z.number().int(t("Әрекет лимиті бүтін сан.")).min(1, t("Әрекет лимиті 1-ден 100-ге дейін.")).max(100, t("Әрекет лимиті 1-ден 100-ге дейін.")).nullable(),
  deadline: z.string().datetime({ offset: true, message: t("Мерзім пішімі қате.") }).nullable(),
  allow_late: z.boolean(),
  hints: z.array(z.string().trim().max(500, t("Кеңес тым ұзын."))).max(20, t("Кеңестер саны 20-дан аспауы тиіс.")),
  questions: z.array(z.object({
    prompt: z.string().trim().min(1, t("Әр сұрақтың мәтіні болуы тиіс.")).max(2000, t("Сұрақ мәтіні тым ұзын.")),
    options: z.array(z.string().trim().min(1, t("Жауап нұсқалары бос болмауы тиіс.")).max(500, t("Нұсқа тым ұзын."))).min(2, t("Әр сұрақта кемінде 2 нұсқа болуы тиіс.")).max(8, t("Нұсқа саны 8-ден аспауы тиіс.")),
    correct_index: z.number().int().min(0),
    explanation: z.string().trim().max(2000, t("Түсіндірме тым ұзын.")),
    points: z.number({ message: t("Сұрақ ұпайы сан болуы тиіс.") }).gt(0, t("Сұрақ ұпайы 0-ден үлкен болуы тиіс.")).max(1000),
  }).refine((q) => q.correct_index < q.options.length, t("Әр сұраққа дұрыс жауапты белгілеңіз."))).max(100, t("Сұрақ саны 100-ден аспауы тиіс.")),
  test_cases: z.array(z.object({
    input: z.string().max(5000, t("Кіріс деректері тым ұзын.")),
    expected_output: z.string().max(5000, t("Күтілетін шығыс тым ұзын.")),
    is_hidden: z.boolean(),
    points: z.number({ message: t("Тест ұпайы сан болуы тиіс.") }).min(0, t("Тест ұпайы теріс болмауы тиіс.")).max(1000),
  })).max(50, t("Тест жағдайлары саны 50-ден аспауы тиіс.")),
  class_ids: z.array(UUID(t)).max(100),
});

/** Тапсырманы сақтау (+ сыныптар, + қажет болса жариялау) - бір транзакцияда: жартылай нәтиже қалмайды. */
export async function saveAssignmentAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  const publish = str(f, "intent") === "publish";
  let id: string; let isNew: boolean;
  try {
    let raw: unknown;
    try { raw = JSON.parse(str(f, "payload")); } catch { throw new AppError("validation"); }
    const p = assignmentSchema(t).parse(raw);
    isNew = !p.id;
    if (publish && p.kind === "quiz" && p.questions.length === 0) throw new AppError("quiz_empty");
    id = await withUser(ctx.userId, async (q) => {
      const locked = p.id ? (await q<{ x: boolean }>("select exists (select 1 from public.submissions where assignment_id = $1) as x", [p.id]))[0].x : false;
      const body: Record<string, unknown> = {
        id: p.id ?? undefined, org_id: ctx.active.org_id, title: p.title, description: p.description, kind: p.kind, difficulty: p.difficulty,
        max_score: p.max_score, starter_code: p.kind === "quiz" ? "" : p.starter_code, max_attempts: p.max_attempts, deadline: p.deadline,
        allow_late: p.allow_late, hints: p.hints.filter((h) => h.length > 0),
      };
      if (!locked) {
        body.questions = p.kind === "quiz" ? p.questions.map((x) => ({ ...x })) : [];
        body.test_cases = p.kind === "quiz" ? [] : p.test_cases;
      }
      const aid = (await q<{ id: string }>("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify(body)]))[0].id;
      await q("select public.set_assignment_targets($1,$2::uuid[])", [aid, p.class_ids]);
      if (publish) await q("select public.set_assignment_status($1,'published')", [aid]);
      return aid;
    });
  } catch (e) { return fail(e); }
  revalidatePath("/teacher/assignments"); revalidatePath("/teacher");
  if (publish) redirect("/teacher/assignments?ok=published");
  if (isNew) redirect(`/teacher/assignments/${id}/edit?ok=saved`);
  revalidatePath(`/teacher/assignments/${id}/edit`);
  return { ok: true, message: t("Тапсырма сақталды.") };
}

async function setStatus(f: FormData, status: "draft" | "archived", back: string) { const t = await getT();
  const ctx = await requireStaff();
  try {
    const id = UUID(t).parse(str(f, "assignment_id"));
    await withUser(ctx.userId, (q) => q("select public.set_assignment_status($1,$2)", [id, status]));
    revalidatePath("/teacher/assignments"); revalidatePath(`/teacher/assignments/${id}/edit`); revalidatePath("/teacher");
  } catch (e) { bounce(back, e); }
}
export async function archiveAssignmentAction(f: FormData): Promise<void> {
  await setStatus(f, "archived", str(f, "back") || "/teacher/assignments");
  redirect("/teacher/assignments?ok=archived");
}
export async function restoreAssignmentAction(f: FormData): Promise<void> {
  const id = str(f, "assignment_id");
  await setStatus(f, "draft", `/teacher/assignments/${id}/edit`);
  redirect(`/teacher/assignments/${id}/edit?ok=restored`);
}

export async function duplicateAssignmentAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  const back = str(f, "back") || "/teacher/assignments";
  let nid: string;
  try {
    const id = UUID(t).parse(str(f, "assignment_id"));
    nid = await withUser(ctx.userId, async (q) => {
      const a = (await q<any>("select * from public.assignments where id = $1", [id]))[0];
      if (!a) throw new AppError("not_found");
      const qs = await q<any>(
        `select q.prompt, q.options, q.points, k.correct_index, k.explanation from public.assignment_questions q
         left join public.assignment_answer_keys k on k.question_id = q.id where q.assignment_id = $1 order by q.position`, [id]);
      const tcs = await q<any>("select input, expected_output, is_hidden, points from public.assignment_test_cases where assignment_id = $1 order by position", [id]);
      const title = t("{title} (көшірме)", { title: a.title }).slice(0, 200);
      const body = {
        org_id: a.org_id, title, description: a.description, kind: a.kind, difficulty: a.difficulty, max_score: a.max_score, starter_code: a.starter_code ?? "",
        max_attempts: a.max_attempts, deadline: a.deadline, allow_late: a.allow_late, hints: a.hints,
        questions: qs.map((x) => ({ prompt: x.prompt, options: x.options, points: x.points, correct_index: x.correct_index ?? 0, explanation: x.explanation ?? "" })),
        test_cases: tcs,
      };
      return (await q<{ id: string }>("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify(body)]))[0].id;
    });
  } catch (e) { bounce(back, e); }
  revalidatePath("/teacher/assignments");
  redirect(`/teacher/assignments/${nid}/edit?ok=duplicated`);
}

// ---------- Тексеру ----------
export async function beginReviewAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  const id = str(f, "submission_id");
  const back = `/teacher/submissions/${id}`;
  try {
    await withUser(ctx.userId, (q) => q("select public.begin_review($1)", [UUID(t).parse(id)]));
    revalidatePath(back); revalidatePath("/teacher/review");
  } catch (e) { bounce(back, e); }
  redirect(back);
}

export async function gradeSubmissionAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  try {
    const id = UUID(t).parse(str(f, "submission_id"));
    const raw = str(f, "score").trim().replace(",", ".");
    if (raw === "" || !isFinite(Number(raw))) throw new AppError("invalid_score");
    const score = Number(raw);
    const feedback = z.string().max(4000, t("Пікір 4000 символдан аспауы тиіс.")).parse(str(f, "feedback"));
    await withUser(ctx.userId, (q) => q("select public.grade_submission($1,$2,$3)", [id, score, feedback]));
    revalidatePath(`/teacher/submissions/${id}`); revalidatePath("/teacher/review"); revalidatePath("/teacher");
    return { ok: true, message: t("Баға сақталды.") };
  } catch (e) { return fail(e); }
}

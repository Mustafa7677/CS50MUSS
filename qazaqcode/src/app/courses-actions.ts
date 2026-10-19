"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withUser } from "@/lib/db";
import { requireStaff } from "@/lib/context";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { loadTree } from "@/components/course-builder/data";
import { courseBase, type Area, type TreeModule } from "@/components/course-builder/types";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

// Курс конструкторының ортақ server actions (мұғалім: /teacher/courses, әкімші: /school/courses).
// Құқықты дерекқор тексереді (can_manage_course); бұл жерде тек валидация мен қазақша қателер.

const UUID = (t: TFn) => z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, t("Идентификатор дұрыс емес."));
const AREA = z.enum(["teacher", "school"]);
const str = (f: FormData, k: string) => String(f.get(k) ?? "");
const CYR = /[а-яәіңғүұқөһё]/i;

/** Уақытша fallback: src/lib/errors.ts-те жоқ кодтар үшін (invalid_input). */
const FALLBACK = (t: TFn): Record<string, string> => ({
  invalid_input: t("Енгізілген деректер дұрыс емес: атауларды (1-160 символ) тексеріңіз."),
  course_empty: t("Курсқа кемінде бір сабақ қосыңыз."),
  no_targets: t("Алдымен курсты кемінде бір сыныпқа бекітіңіз."),
  invalid_block: t("Сабақ блогы дұрыс емес (https сілтемесі немесе тіл түрін тексеріңіз)."),
  too_large: t("Мазмұн тым үлкен: модуль, сабақ, блок саны не мәтін көлемі шектен асты."),
});
function fail(e: unknown, t: TFn): { ok: false; error: string } {
  if (e instanceof z.ZodError) {
    const m = e.issues[0]?.message ?? "";
    return { ok: false, error: CYR.test(m) ? m : errorMessage(new AppError("validation")) };
  }
  const raw = (e as { message?: string })?.message ?? "";
  if (!(e instanceof AppError) && FALLBACK(t)[raw]) return { ok: false, error: FALLBACK(t)[raw] };
  return { ok: false, error: errorMessage(e) };
}
function bounce(path: string, e: unknown, t: TFn): never {
  const r = fail(e, t);
  redirect(`${path}${path.includes("?") ? "&" : "?"}err=${encodeURIComponent(r.error)}`);
}
function touch(area: Area, id?: string) {
  revalidatePath(courseBase(area));
  if (id) revalidatePath(`${courseBase(area)}/${id}`);
}

// ---------- Курс жасау ----------
const infoSchema = (t: TFn) => z.object({
  title: z.string().trim().min(1, t("Курс атауын енгізіңіз.")).max(160, t("Атау 160 символдан аспауы тиіс.")),
  description: z.string().trim().max(2000, t("Сипаттама 2000 символдан аспауы тиіс.")),
});

export async function createCourseAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  let id: string; let area: Area;
  try {
    area = AREA.parse(str(f, "area"));
    const p = infoSchema(t).parse({ title: str(f, "title"), description: str(f, "description") });
    id = (await withUser(ctx.userId, (q) => q<{ id: string }>("select public.create_course($1,$2,$3) as id", [ctx.active.org_id, p.title, p.description || null])))[0].id;
  } catch (e) { return fail(e, t); }
  touch(area);
  redirect(`${courseBase(area)}/${id}?ok=created`);
}

export async function updateCourseInfoAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  try {
    const area = AREA.parse(str(f, "area"));
    const id = UUID(t).parse(str(f, "course_id"));
    const p = infoSchema(t).parse({ title: str(f, "title"), description: str(f, "description") });
    await withUser(ctx.userId, (q) => q("select public.update_course_info($1,$2,$3)", [id, p.title, p.description || null]));
    touch(area, id);
    return { ok: true, message: t("Курс баптаулары сақталды.") };
  } catch (e) { return fail(e, t); }
}

export async function setCourseTargetsAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireStaff();
  try {
    const area = AREA.parse(str(f, "area"));
    const id = UUID(t).parse(str(f, "course_id"));
    const classes = z.array(UUID(t)).max(200).parse(f.getAll("class_ids").map(String));
    await withUser(ctx.userId, (q) => q("select public.set_course_targets($1,$2::uuid[])", [id, classes]));
    touch(area, id);
    return { ok: true, message: classes.length ? t("Курс таңдалған сыныптарға бекітілді.") : t("Сыныптарға бекіту алынды.") };
  } catch (e) { return fail(e, t); }
}

// ---------- Күй, көшірме (void: нәтиже ?ok= / ?err= арқылы) ----------
const STATUS = z.enum(["draft", "published", "archived"]);
const OK_FOR: Record<string, string> = { draft: "draft", published: "published", archived: "archived" };

export async function setCourseStatusAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  let area: Area = "teacher"; let id = ""; let to = "course";
  try {
    area = AREA.parse(str(f, "area"));
    id = UUID(t).parse(str(f, "course_id"));
    to = str(f, "to") === "list" ? "list" : "course";
  } catch { redirect("/"); }
  const back = to === "list" ? courseBase(area) : `${courseBase(area)}/${id}?tab=settings`;
  let status: string;
  try {
    status = STATUS.parse(str(f, "status"));
    await withUser(ctx.userId, (q) => q("select public.set_course_status($1,$2::public.course_status)", [id, status]));
    touch(area, id);
  } catch (e) { bounce(back, e, t); }
  redirect(`${back}${back.includes("?") ? "&" : "?"}ok=${OK_FOR[status]}`);
}

export async function duplicateCourseAction(f: FormData): Promise<void> { const t = await getT();
  const ctx = await requireStaff();
  let area: Area = "teacher"; let id = "";
  try { area = AREA.parse(str(f, "area")); id = UUID(t).parse(str(f, "course_id")); } catch { redirect("/"); }
  let nid: string;
  try {
    nid = (await withUser(ctx.userId, (q) => q<{ id: string }>("select public.duplicate_course($1) as id", [id])))[0].id;
  } catch (e) { bounce(courseBase(area), e, t); }
  touch(area);
  redirect(`${courseBase(area)}/${nid}?ok=duplicated`);
}

// ---------- Құрылымды сақтау (клиент компоненттен шақырылады) ----------
const block = (t: TFn) => z.object({
  type: z.enum(["text", "code", "image", "video", "note"], { message: t("Блок түрі дұрыс емес.") }),
  content: z.string().max(20000, t("Блок мазмұны 20000 символдан аспауы тиіс.")),
  language: z.enum(["python", "sql", "javascript", "html", "css", "text"], { message: t("Бағдарламалау тілі дұрыс емес.") }).optional(),
  caption: z.string().max(200, t("Атау/сипаттама 200 символдан аспауы тиіс.")).optional(),
}).superRefine((b, ctx) => {
  if ((b.type === "image" || b.type === "video") && !/^https:\/\/[^\s<>"']+$/i.test(b.content)) {
    ctx.addIssue({ code: "custom", message: t("{v} сілтемесі https:// деп басталуы тиіс.", { v: b.type === "image" ? t("Сурет") : t("Видео") }) });
  }
});
const title = (t: TFn) => z.string().trim().min(1, t("Модуль мен сабақ атаулары бос болмауы тиіс.")).max(160, t("Атау 160 символдан аспауы тиіс."));
const lesson = (t: TFn) => z.object({
  id: UUID(t).optional(),
  title: title(t),
  assignment_id: UUID(t).nullish(),
  blocks: z.array(block(t)).max(60, t("Бір сабақта 60 блоктан артық болмауы тиіс.")),
});
const structure = (t: TFn) => z.object({
  modules: z.array(z.object({ id: UUID(t).optional(), title: title(t), lessons: z.array(lesson(t)) })).max(50, t("Модуль саны 50-ден аспауы тиіс.")),
}).refine((s) => s.modules.reduce((n, m) => n + m.lessons.length, 0) <= 500, t("Сабақ саны 500-ден аспауы тиіс."));

export async function saveCourseStructureAction(courseId: string, area: Area, payload: unknown): Promise<ActionResult<TreeModule[]>> { const t = await getT();
  const ctx = await requireStaff();
  try {
    const id = UUID(t).parse(courseId);
    const a = AREA.parse(area);
    const s = structure(t).parse(payload);
    const tree = await withUser(ctx.userId, async (q) => {
      await q("select public.save_course_structure($1,$2::jsonb)", [id, JSON.stringify(s)]);
      return loadTree(q, id);
    });
    touch(a, id);
    return { ok: true, data: tree, message: t("Курс құрылымы сақталды.") };
  } catch (e) { return fail(e, t); }
}

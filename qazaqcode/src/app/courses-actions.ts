"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withUser } from "@/lib/db";
import { requireStaff } from "@/lib/context";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { loadTree } from "@/components/course-builder/data";
import { courseBase, type Area, type TreeModule } from "@/components/course-builder/types";

// Курс конструкторының ортақ server actions (мұғалім: /teacher/courses, әкімші: /school/courses).
// Құқықты дерекқор тексереді (can_manage_course); бұл жерде тек валидация мен қазақша қателер.

const UUID = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Идентификатор дұрыс емес.");
const AREA = z.enum(["teacher", "school"]);
const str = (f: FormData, k: string) => String(f.get(k) ?? "");
const CYR = /[а-яәіңғүұқөһё]/i;

/** Уақытша fallback: src/lib/errors.ts-те жоқ кодтар үшін (invalid_input). */
const FALLBACK: Record<string, string> = {
  invalid_input: "Енгізілген деректер дұрыс емес: атауларды (1-160 символ) тексеріңіз.",
  course_empty: "Курсқа кемінде бір сабақ қосыңыз.",
  no_targets: "Алдымен курсты кемінде бір сыныпқа бекітіңіз.",
  invalid_block: "Сабақ блогы дұрыс емес (https сілтемесі немесе тіл түрін тексеріңіз).",
  too_large: "Мазмұн тым үлкен: модуль, сабақ, блок саны не мәтін көлемі шектен асты.",
};
function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof z.ZodError) {
    const m = e.issues[0]?.message ?? "";
    return { ok: false, error: CYR.test(m) ? m : errorMessage(new AppError("validation")) };
  }
  const raw = (e as { message?: string })?.message ?? "";
  if (!(e instanceof AppError) && FALLBACK[raw]) return { ok: false, error: FALLBACK[raw] };
  return { ok: false, error: errorMessage(e) };
}
function bounce(path: string, e: unknown): never {
  const r = fail(e);
  redirect(`${path}${path.includes("?") ? "&" : "?"}err=${encodeURIComponent(r.error)}`);
}
function touch(area: Area, id?: string) {
  revalidatePath(courseBase(area));
  if (id) revalidatePath(`${courseBase(area)}/${id}`);
}

// ---------- Курс жасау ----------
const infoSchema = z.object({
  title: z.string().trim().min(1, "Курс атауын енгізіңіз.").max(160, "Атау 160 символдан аспауы тиіс."),
  description: z.string().trim().max(2000, "Сипаттама 2000 символдан аспауы тиіс."),
});

export async function createCourseAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireStaff();
  let id: string; let area: Area;
  try {
    area = AREA.parse(str(f, "area"));
    const p = infoSchema.parse({ title: str(f, "title"), description: str(f, "description") });
    id = (await withUser(ctx.userId, (q) => q<{ id: string }>("select public.create_course($1,$2,$3) as id", [ctx.active.org_id, p.title, p.description || null])))[0].id;
  } catch (e) { return fail(e); }
  touch(area);
  redirect(`${courseBase(area)}/${id}?ok=created`);
}

export async function updateCourseInfoAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireStaff();
  try {
    const area = AREA.parse(str(f, "area"));
    const id = UUID.parse(str(f, "course_id"));
    const p = infoSchema.parse({ title: str(f, "title"), description: str(f, "description") });
    await withUser(ctx.userId, (q) => q("select public.update_course_info($1,$2,$3)", [id, p.title, p.description || null]));
    touch(area, id);
    return { ok: true, message: "Курс баптаулары сақталды." };
  } catch (e) { return fail(e); }
}

export async function setCourseTargetsAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireStaff();
  try {
    const area = AREA.parse(str(f, "area"));
    const id = UUID.parse(str(f, "course_id"));
    const classes = z.array(UUID).max(200).parse(f.getAll("class_ids").map(String));
    await withUser(ctx.userId, (q) => q("select public.set_course_targets($1,$2::uuid[])", [id, classes]));
    touch(area, id);
    return { ok: true, message: classes.length ? "Курс таңдалған сыныптарға бекітілді." : "Сыныптарға бекіту алынды." };
  } catch (e) { return fail(e); }
}

// ---------- Күй, көшірме (void: нәтиже ?ok= / ?err= арқылы) ----------
const STATUS = z.enum(["draft", "published", "archived"]);
const OK_FOR: Record<string, string> = { draft: "draft", published: "published", archived: "archived" };

export async function setCourseStatusAction(f: FormData): Promise<void> {
  const ctx = await requireStaff();
  let area: Area = "teacher"; let id = ""; let to = "course";
  try {
    area = AREA.parse(str(f, "area"));
    id = UUID.parse(str(f, "course_id"));
    to = str(f, "to") === "list" ? "list" : "course";
  } catch { redirect("/"); }
  const back = to === "list" ? courseBase(area) : `${courseBase(area)}/${id}`;
  let status: string;
  try {
    status = STATUS.parse(str(f, "status"));
    await withUser(ctx.userId, (q) => q("select public.set_course_status($1,$2::public.course_status)", [id, status]));
    touch(area, id);
  } catch (e) { bounce(back, e); }
  redirect(`${back}?ok=${OK_FOR[status]}`);
}

export async function duplicateCourseAction(f: FormData): Promise<void> {
  const ctx = await requireStaff();
  let area: Area = "teacher"; let id = "";
  try { area = AREA.parse(str(f, "area")); id = UUID.parse(str(f, "course_id")); } catch { redirect("/"); }
  let nid: string;
  try {
    nid = (await withUser(ctx.userId, (q) => q<{ id: string }>("select public.duplicate_course($1) as id", [id])))[0].id;
  } catch (e) { bounce(courseBase(area), e); }
  touch(area);
  redirect(`${courseBase(area)}/${nid}?ok=duplicated`);
}

// ---------- Құрылымды сақтау (клиент компоненттен шақырылады) ----------
const block = z.object({
  type: z.enum(["text", "code", "image", "video", "note"], { message: "Блок түрі дұрыс емес." }),
  content: z.string().max(20000, "Блок мазмұны 20000 символдан аспауы тиіс."),
  language: z.enum(["python", "sql", "javascript", "html", "css", "text"], { message: "Бағдарламалау тілі дұрыс емес." }).optional(),
  caption: z.string().max(200, "Атау/сипаттама 200 символдан аспауы тиіс.").optional(),
}).superRefine((b, ctx) => {
  if ((b.type === "image" || b.type === "video") && !/^https:\/\/[^\s<>"']+$/i.test(b.content)) {
    ctx.addIssue({ code: "custom", message: `${b.type === "image" ? "Сурет" : "Видео"} сілтемесі https:// деп басталуы тиіс.` });
  }
});
const title = z.string().trim().min(1, "Модуль мен сабақ атаулары бос болмауы тиіс.").max(160, "Атау 160 символдан аспауы тиіс.");
const lesson = z.object({
  id: UUID.optional(),
  title,
  assignment_id: UUID.nullish(),
  blocks: z.array(block).max(60, "Бір сабақта 60 блоктан артық болмауы тиіс."),
});
const structure = z.object({
  modules: z.array(z.object({ id: UUID.optional(), title, lessons: z.array(lesson) })).max(50, "Модуль саны 50-ден аспауы тиіс."),
}).refine((s) => s.modules.reduce((n, m) => n + m.lessons.length, 0) <= 500, "Сабақ саны 500-ден аспауы тиіс.");

export async function saveCourseStructureAction(courseId: string, area: Area, payload: unknown): Promise<ActionResult<TreeModule[]>> {
  const ctx = await requireStaff();
  try {
    const id = UUID.parse(courseId);
    const a = AREA.parse(area);
    const s = structure.parse(payload);
    const tree = await withUser(ctx.userId, async (q) => {
      await q("select public.save_course_structure($1,$2::jsonb)", [id, JSON.stringify(s)]);
      return loadTree(q, id);
    });
    touch(a, id);
    return { ok: true, data: tree, message: "Курс құрылымы сақталды." };
  } catch (e) { return fail(e); }
}

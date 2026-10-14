import { z } from "zod";
import { getContext } from "@/lib/context";
import { withUser } from "@/lib/db";
import { AppError, errorCode, errorMessage } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { ruleAdvisor } from "@/lib/ai/advisor";
import { MAX_QUESTION, stripControl, type AssignmentCtx, type Lesson } from "@/lib/ai/match";

// Көмекші (ережелі кеңесші): сыртқы сервис шақырылмайды, әңгіме сақталмайды. Контекст: ТЕК сұрақ, тапсырма атауы/сипаттамасы/түрі,
// оқушының өз коды және оқушы көре алатын сабақ атаулары. Жауап кілті, жасырын тесттер, аты/e-mail модульге берілмейді.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const body = z.object({
  text: z.string().max(5000).optional().default(""),
  topicId: z.string().regex(/^[a-z0-9-]{1,40}$/).nullish(),
  assignmentId: UUID.nullish(),
});

const STATUS: Record<string, number> = { unauthenticated: 401, forbidden: 403, ai_disabled: 403, not_found: 404, ai_too_long: 413, rate_limited: 429, validation: 400, invalid_input: 400 };
const json = (status: number, data: unknown) => Response.json(data, { status, headers: { "cache-control": "no-store" } });
const fail = (e: unknown) => {
  const code = errorCode(e);
  return json(STATUS[code] ?? 500, { ok: false, code, error: errorMessage(e) });
};

export async function POST(req: Request): Promise<Response> {
  try {
    const ctx = await getContext();
    if (!ctx) throw new AppError("unauthenticated");
    const m = (ctx.active?.role === "student" ? ctx.active : null) ?? ctx.memberships.find((x) => x.role === "student");
    if (!m) throw new AppError("forbidden");
    await rateLimit("ai_chat", 30, 60_000, ctx.userId);

    if (Number(req.headers.get("content-length") ?? 0) > 20_000) throw new AppError("ai_too_long");
    let raw: unknown;
    try { raw = await req.json(); } catch { throw new AppError("validation"); }
    const p = body.safeParse(raw);
    if (!p.success) throw new AppError("validation");
    const question = stripControl(p.data.text).trim();
    if ([...question].length > MAX_QUESTION) throw new AppError("ai_too_long");
    if (!question && !p.data.topicId) throw new AppError("invalid_input");

    // RLS: оқушы тек өзіне көрінетін тапсырма/сабақ/кодты көреді
    const data = await withUser(ctx.userId, async (q) => {
      const [st] = await q<{ s: boolean }>("select public.ai_status($1) as s", [m.org_id]);
      if (!st?.s) throw new AppError("ai_disabled");
      let assignment: AssignmentCtx | null = null; let code: string | null = null;
      if (p.data.assignmentId) {
        const [a] = await q<AssignmentCtx>("select title, description, kind::text as kind from public.assignments where id = $1 and org_id = $2", [p.data.assignmentId, m.org_id]);
        if (!a) throw new AppError("not_found");
        assignment = { title: a.title, description: a.description, kind: a.kind };
        const [s] = await q<{ code: string | null }>(
          "select code from public.submissions where assignment_id = $1 and student_id = auth.uid() order by (status = 'draft') desc, updated_at desc limit 1", [p.data.assignmentId]);
        code = s?.code ?? null;
      }
      const lessons = await q<{ id: string; course_id: string; title: string; course_title: string }>(
        `select l.id, l.course_id, l.title, c.title as course_title from public.lessons l join public.courses c on c.id = l.course_id
          where l.org_id = $1 and c.status = 'published' order by l.position limit 500`, [m.org_id]);
      const L: Lesson[] = lessons.map((l) => ({ id: l.id, courseId: l.course_id, title: l.title, courseTitle: l.course_title }));
      return { assignment, code, lessons: L };
    });

    const card = await ruleAdvisor.answer({ question, topicId: p.data.topicId ?? null, ...data });
    return json(200, { ok: true, card });
  } catch (e) {
    return fail(e);
  }
}

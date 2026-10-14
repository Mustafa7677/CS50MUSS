import type { Q } from "@/lib/db";
import type { TreeModule } from "./types";

/** Курстың модуль/сабақ ағашын оқиды (RLS арқылы). */
export async function loadTree(q: Q, courseId: string): Promise<TreeModule[]> {
  const mods = await q<{ id: string; title: string }>("select id, title from public.course_modules where course_id = $1 order by position", [courseId]);
  const les = await q<{ id: string; module_id: string; title: string; blocks: any; assignment_id: string | null }>(
    "select id, module_id, title, blocks, assignment_id from public.lessons where course_id = $1 order by position", [courseId]);
  return mods.map((m) => ({
    id: m.id, title: m.title,
    lessons: les.filter((l) => l.module_id === m.id).map((l) => ({ id: l.id, title: l.title, assignment_id: l.assignment_id, blocks: Array.isArray(l.blocks) ? l.blocks : [] })),
  }));
}

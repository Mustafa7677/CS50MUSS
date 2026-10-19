import { withUser } from "@/lib/db";
import { errorCode } from "@/lib/errors";
import type { ProgressRow } from "./metrics";
import { getT } from "@/lib/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StudentProgressRow = ProgressRow & {
  assignment_id: string; title: string; kind: string; classroom_name: string; deadline: string | null; attempts: number;
};
export type StudentCardData = { id: string; fullName: string; classes: { id: string; name: string }[]; rows: StudentProgressRow[] };

/**
 * Оқушы карточкасының деректері. Құқықты дерекқор шешеді (student_progress -> 'forbidden', RLS).
 * null = табылмады не құқық жоқ (шақырушы notFound() жасайды). `classId` берілсе, оқушы сол сыныпта болуы тиіс.
 */
export async function loadStudentCard(userId: string, studentId: string, opts: { classId?: string } = {}): Promise<StudentCardData | null> { const t = await getT();
  if (!UUID_RE.test(studentId) || (opts.classId && !UUID_RE.test(opts.classId))) return null;
  try {
    const d = await withUser(userId, async (q) => {
      const rows = await q<any>(
        `select assignment_id, title, kind::text as kind, classroom_name, deadline::text as deadline, status, best_pct::float8 as best_pct,
                attempts::int as attempts, time_spent::int as time_spent, last_activity::text as last_activity
           from public.student_progress($1)`, [studentId]);
      const prof = await q<{ full_name: string | null }>("select full_name from public.profiles where id = $1", [studentId]);
      const classes = await q<{ id: string; name: string }>(
        `select c.id, c.name from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id
          where cs.student_id = $1 and cs.status = 'active' order by c.name`, [studentId]);
      return { rows, prof: prof[0], classes };
    });
    if (!d.prof || d.classes.length === 0) return null;
    if (opts.classId && !d.classes.some((c) => c.id === opts.classId)) return null;
    // Мұғалімге тек өзі көре алатын сыныптар көрінеді (RLS), сондықтан басқа сыныптардың тапсырмалары кестеден шығарылады.
    const names = new Set(d.classes.map((c) => c.name));
    return { id: studentId, fullName: d.prof.full_name ?? t("Аты көрінбейді"), classes: d.classes, rows: d.rows.filter((r: StudentProgressRow) => names.has(r.classroom_name)) };
  } catch (e) {
    if (errorCode(e) === "forbidden") return null;
    throw e;
  }
}

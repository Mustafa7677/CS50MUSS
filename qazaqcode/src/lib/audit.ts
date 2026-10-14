import { withUser } from "./db";

export type ExportKind = "school_report" | "class_report" | "class_csv" | "school_csv";

/**
 * Жеке деректің экспорты (есеп/CSV) аудит журналына жазылады (public.audit_export, құқықты дерекқор тексереді).
 * `orgId` не `classId` беріледі (класс ұйымы дерекқордан алынады). Сәтсіз болса қате шығады: журналсыз экспорт берілмейді.
 */
export async function auditExport(userId: string, kind: ExportKind, target: { orgId?: string; classId?: string }): Promise<void> {
  await withUser(userId, async (q) => {
    if (target.classId) {
      const r = await q("select public.audit_export(c.org_id, $2, c.id::text) from public.classrooms c where c.id = $1", [target.classId, kind]);
      if (!r.length) throw new Error("forbidden");
    } else {
      await q("select public.audit_export($1, $2, null)", [target.orgId, kind]);
    }
  });
}

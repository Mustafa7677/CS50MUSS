import { PageHeader } from "@/components/ui";
import { AssignmentForm } from "@/components/teacher/AssignmentForm";
import { requireStaff } from "@/lib/context";
import { saveAssignmentAction } from "../../actions";
import { isUuid, loadClassOptions } from "../../_data";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Жаңа тапсырма") }; }
export const dynamic = "force-dynamic";

export default async function NewAssignment({ searchParams }: { searchParams: Promise<{ class?: string }> }) { const t = await getT();
  const sp = await searchParams;
  const ctx = await requireStaff();
  const classes = await loadClassOptions(ctx);
  const pre = isUuid(sp.class) && classes.some((c) => c.id === sp.class) ? [sp.class] : [];
  return (
    <>
      <PageHeader title={t("Жаңа тапсырма")} subtitle={t("Тапсырманы жобаға сақтаңыз немесе бірден сыныптарға жариялаңыз.")} />
      <AssignmentForm action={saveAssignmentAction} classes={classes} locked={false}
        init={{ id: null, title: "", description: "", kind: "python", difficulty: "easy", max_score: 100, starter_code: "", max_attempts: null, deadline: null, allow_late: false, hints: [], status: "new", questions: [], test_cases: [], class_ids: pre }} />
    </>
  );
}

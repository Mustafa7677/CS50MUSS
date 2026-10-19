import { notFound } from "next/navigation";
import { StudentCard } from "@/components/analytics/StudentCard";
import { loadStudentCard } from "@/components/analytics/loadStudent";
import { requireStaff } from "@/lib/context";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const t = await getT(); return { title: t("Оқушы карточкасы") }; }

export default async function TeacherStudentPage({ params }: { params: Promise<{ id: string; studentId: string }> }) { const t = await getT();
  const { id, studentId } = await params;
  const ctx = await requireStaff();
  const data = await loadStudentCard(ctx.userId, studentId, { classId: id });
  if (!data) notFound();
  return <StudentCard data={data} back={{ href: `/teacher/classes/${id}`, label: t("Сыныпқа оралу") }} />;
}

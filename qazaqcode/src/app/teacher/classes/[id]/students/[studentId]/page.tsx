import { notFound } from "next/navigation";
import { StudentCard } from "@/components/analytics/StudentCard";
import { loadStudentCard } from "@/components/analytics/loadStudent";
import { requireStaff } from "@/lib/context";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Оқушы карточкасы" }; }

export default async function TeacherStudentPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await params;
  const ctx = await requireStaff();
  const data = await loadStudentCard(ctx.userId, studentId, { classId: id });
  if (!data) notFound();
  return <StudentCard data={data} back={{ href: `/teacher/classes/${id}`, label: "Сыныпқа оралу" }} />;
}

import { notFound } from "next/navigation";
import { StudentCard } from "@/components/analytics/StudentCard";
import { loadStudentCard } from "@/components/analytics/loadStudent";
import { requireSchoolAdmin } from "@/lib/context";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Оқушы карточкасы" }; }

export default async function SchoolStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const ctx = await requireSchoolAdmin();
  const data = await loadStudentCard(ctx.userId, studentId);
  if (!data) notFound();
  return <StudentCard data={data} back={{ href: "/school/students", label: "Барлық оқушылар" }} />;
}

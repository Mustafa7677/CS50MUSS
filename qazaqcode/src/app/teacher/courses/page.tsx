import { CourseListPage } from "@/components/course-builder/pages";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Курстар") }; }
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; ok?: string; err?: string }> }) {
  return <CourseListPage area="teacher" searchParams={await searchParams} />;
}

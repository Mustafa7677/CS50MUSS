import { CourseListPage } from "@/components/course-builder/pages";

export const metadata = { title: "Курстар" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; ok?: string; err?: string }> }) {
  return <CourseListPage area="school" searchParams={await searchParams} />;
}

import { CoursePage } from "@/components/course-builder/pages";

export const metadata = { title: "Курс" };
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; ok?: string; err?: string }> }) {
  return <CoursePage area="school" id={(await params).id} searchParams={await searchParams} />;
}

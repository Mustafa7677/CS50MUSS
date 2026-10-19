import { CoursePage } from "@/components/course-builder/pages";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Курс") }; }
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; ok?: string; err?: string }> }) {
  return <CoursePage area="teacher" id={(await params).id} searchParams={await searchParams} />;
}

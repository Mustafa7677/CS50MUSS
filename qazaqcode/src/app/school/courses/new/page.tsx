import { NewCoursePage } from "@/components/course-builder/pages";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Жаңа курс") }; }
export const dynamic = "force-dynamic";

export default async function Page() {
  return <NewCoursePage area="school" />;
}

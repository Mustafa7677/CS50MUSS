import { NewCoursePage } from "@/components/course-builder/pages";

export const metadata = { title: "Жаңа курс" };
export const dynamic = "force-dynamic";

export default async function Page() {
  return <NewCoursePage area="school" />;
}

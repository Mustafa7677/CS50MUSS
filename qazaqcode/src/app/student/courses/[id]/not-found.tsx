import Link from "next/link";
import { getT } from "@/lib/i18n";

export default async function CourseNotFound() { const t = await getT();
  return (
    <div className="card px-6 py-12 text-center" data-testid="not-found">
      <p className="text-4xl font-bold text-brand">404</p>
      <p className="mt-2 text-lg font-semibold">{t("Курс табылмады")}</p>
      <p className="mt-1 text-sm text-ink-muted">{t("Курс жоқ, жарияланбаған не сіздің сыныбыңызға берілмеген.")}</p>
      <Link href="/student/courses" className="btn-primary mt-5 no-underline">{t("Курстарға оралу")}</Link>
    </div>
  );
}

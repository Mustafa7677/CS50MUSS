import Link from "next/link";
import { getT } from "@/lib/i18n";

export default async function StudentNotFound() { const t = await getT();
  return (
    <div className="card px-6 py-12 text-center" data-testid="not-found">
      <p className="text-4xl font-bold text-brand">404</p>
      <p className="mt-2 text-lg font-semibold">{t("Бет табылмады")}</p>
      <p className="mt-1 text-sm text-ink-muted">{t("Тапсырма жоқ немесе ол сіздің сыныбыңызға берілмеген.")}</p>
      <Link href="/student/assignments" className="btn-primary mt-5">{t("Тапсырмаларыма оралу")}</Link>
    </div>
  );
}

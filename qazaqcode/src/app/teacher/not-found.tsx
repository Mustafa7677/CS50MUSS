import Link from "next/link";
import { getT } from "@/lib/i18n";

export default async function TeacherNotFound() { const t = await getT();
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold">{t("Бет табылмады")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("Мұндай сынып, тапсырма не жұмыс жоқ немесе оған қолжетімділігіңіз жоқ.")}</p>
      <Link href="/teacher" className="btn-primary mt-5">{t("Сыныптарыма оралу")}</Link>
    </div>
  );
}

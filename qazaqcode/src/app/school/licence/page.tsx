import Link from "next/link";
import { EmptyState, PageHeader, Section, StatusBadge } from "@/components/ui";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { LICENSE_STATE_LABEL, PLAN_LABEL, fmtDate } from "@/lib/format";
import { UsageMeter } from "./UsageMeter";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Лицензия") }; }
export const dynamic = "force-dynamic";

type Usage = {
  plan: string; state: string; status: string; valid_from: string; valid_until: string; days_left: number;
  max_students: number; max_teachers: number; students: string; teachers: string; notes: string | null;
};

export default async function LicencePage() { const t = await getT();
  const ctx = await requireSchoolAdmin();
  const rows = await withUser(ctx.userId, (q) => q<Usage>(
    "select plan, state, status, valid_from::text, valid_until::text, days_left, max_students, max_teachers, students, teachers, notes from public.licence_usage($1)", [ctx.active.org_id]));
  const u = rows[0];
  if (!u) {
    return (
      <>
        <PageHeader title={t("Лицензия")} actions={<Link className="btn-primary" href="/school/licence/order" data-testid="renew-licence">{t("Лицензияны жаңарту")}</Link>} />
        <EmptyState title={t("Лицензия табылмады")} text={t("Ұйымға лицензия берілмеген. Платформа әкімшісіне хабарласыңыз.")} />
      </>
    );
  }
  const expired = u.state !== "active";
  const near = !expired && u.days_left <= 30;
  const days = u.days_left;
  return (
    <>
      <PageHeader title={t("Лицензия")} subtitle={t("Пакет, мерзім және лимиттердің қолданылуы. Ұзарту не лимитті өзгерту үшін тапсырыс беріңіз: платформа әкімшісі шот береді, төлем расталған соң лицензия жаңарады.")} actions={<Link className="btn-primary" href="/school/licence/order" data-testid="renew-licence">{t("Лицензияны жаңарту")}</Link>} />

      <section className="card p-5" data-testid="licence-summary" aria-label={t("Лицензия күйі")}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold" data-testid="licence-plan">{t(PLAN_LABEL[u.plan] ?? u.plan)}</span>
          <StatusBadge status={u.state === "active" ? "active" : u.state} label={t(LICENSE_STATE_LABEL[u.state] ?? u.state)} />
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-ink-muted">{t("Басталған күн")}</dt><dd className="font-semibold">{fmtDate(u.valid_from)}</dd></div>
          <div><dt className="text-ink-muted">{t("Мерзімі (дейін)")}</dt><dd className="font-semibold" data-testid="licence-until">{fmtDate(u.valid_until)}</dd></div>
          <div>
            <dt className="text-ink-muted">{t("Қалған уақыт")}</dt>
            <dd className={`font-semibold ${expired ? "text-red-600" : near ? "text-amber-600" : ""}`} data-testid="licence-days">
              {u.state === "expired" || days < 0 ? t("{abs} күн бұрын аяқталған", { abs: Math.abs(days) }) : days === 0 ? t("бүгін аяқталады") : t("{days} күн", { days })}
            </dd>
          </div>
        </dl>
        {u.notes && <p className="mt-3 text-sm text-ink-muted">{t("Ескертпе:")}{" "}{u.notes}</p>}
        {expired && (
          <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
            {t("Лицензия {v}. Жаңа сынып, тапсырма және курс жасау шектелген; деректер сақталған,", { v: u.state === "expired" ? t("мерзімі өтті") : t("белсенді емес") })}{" "}<Link href="/school/export" className="underline">{t("экспорт")}</Link>{" "}{t("қолжетімді.")}
          </p>
        )}
        {near && (
          <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            {t("Лицензия мерзімі {v} аяқталады. Үзіліссіз жұмыс үшін алдын ала ұзартыңыз.", { v: days === 0 ? t("бүгін") : t("{days} күннен кейін", { days }) })}
          </p>
        )}
      </section>

      <Section title={t("Лимиттердің қолданылуы")}>
        <div className="grid gap-4 md:grid-cols-2">
          <UsageMeter id="students" title={t("Оқушылар")} used={Number(u.students)} max={u.max_students} />
          <UsageMeter id="teachers" title={t("Мұғалімдер")} used={Number(u.teachers)} max={u.max_teachers} />
        </div>
      </Section>

      <Section title={t("Лицензия мерзімі біткенде не болады")}>
        <ul className="card list-disc space-y-2 p-5 pl-9 text-sm">
          <li><strong>{t("Деректер өшірілмейді:")}</strong>{" "}{t("сыныптар, тапсырмалар, жұмыстар, бағалар мен курстар сақталады.")}</li>
          <li><strong>{t("Оқуға және экспорттауға болады:")}</strong>{" "}{t("есептерді жүктеп алу жалғасады.")}</li>
          <li>{t("Оқушылар бұрын берілген тапсырмаларды мерзімі бойынша тапсыра алады.")}</li>
          <li><strong>{t("Шектеледі:")}</strong>{" "}{t("жаңа сынып, тапсырма, курс жариялау, жаңа мұғалім шақыру және оқушылардың жаңа қосылуы.")}</li>
          <li>{t("Лицензия ұзартылған соң шектеулер бірден алынады.")}</li>
        </ul>
      </Section>
    </>
  );
}

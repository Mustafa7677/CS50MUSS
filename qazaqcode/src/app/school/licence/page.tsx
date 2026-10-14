import Link from "next/link";
import { EmptyState, PageHeader, Section, StatusBadge } from "@/components/ui";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { LICENSE_STATE_LABEL, PLAN_LABEL, fmtDate } from "@/lib/format";
import { UsageMeter } from "./UsageMeter";

export const metadata = { title: "Лицензия" };
export const dynamic = "force-dynamic";

type Usage = {
  plan: string; state: string; status: string; valid_from: string; valid_until: string; days_left: number;
  max_students: number; max_teachers: number; students: string; teachers: string; notes: string | null;
};

export default async function LicencePage() {
  const ctx = await requireSchoolAdmin();
  const rows = await withUser(ctx.userId, (q) => q<Usage>(
    "select plan, state, status, valid_from::text, valid_until::text, days_left, max_students, max_teachers, students, teachers, notes from public.licence_usage($1)", [ctx.active.org_id]));
  const u = rows[0];
  if (!u) {
    return (
      <>
        <PageHeader title="Лицензия" />
        <EmptyState title="Лицензия табылмады" text="Ұйымға лицензия берілмеген. Платформа әкімшісіне хабарласыңыз." />
      </>
    );
  }
  const expired = u.state !== "active";
  const near = !expired && u.days_left <= 30;
  const days = u.days_left;
  return (
    <>
      <PageHeader title="Лицензия" subtitle="Пакет, мерзім және лимиттердің қолданылуы. Лицензияны платформа әкімшісі басқарады: ұзарту не лимитті өзгерту үшін оған хабарласыңыз." />

      <section className="card p-5" data-testid="licence-summary" aria-label="Лицензия күйі">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold" data-testid="licence-plan">{PLAN_LABEL[u.plan] ?? u.plan}</span>
          <StatusBadge status={u.state === "active" ? "active" : u.state} label={LICENSE_STATE_LABEL[u.state] ?? u.state} />
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-ink-muted">Басталған күн</dt><dd className="font-semibold">{fmtDate(u.valid_from)}</dd></div>
          <div><dt className="text-ink-muted">Мерзімі (дейін)</dt><dd className="font-semibold" data-testid="licence-until">{fmtDate(u.valid_until)}</dd></div>
          <div>
            <dt className="text-ink-muted">Қалған уақыт</dt>
            <dd className={`font-semibold ${expired ? "text-red-600" : near ? "text-amber-600" : ""}`} data-testid="licence-days">
              {u.state === "expired" || days < 0 ? `${Math.abs(days)} күн бұрын аяқталған` : days === 0 ? "бүгін аяқталады" : `${days} күн`}
            </dd>
          </div>
        </dl>
        {u.notes && <p className="mt-3 text-sm text-ink-muted">Ескертпе: {u.notes}</p>}
        {expired && (
          <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
            Лицензия {u.state === "expired" ? "мерзімі өтті" : "белсенді емес"}. Жаңа сынып, тапсырма және курс жасау шектелген; деректер сақталған, <Link href="/school/export" className="underline">экспорт</Link> қолжетімді.
          </p>
        )}
        {near && (
          <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            Лицензия мерзімі {days === 0 ? "бүгін" : `${days} күннен кейін`} аяқталады. Үзіліссіз жұмыс үшін алдын ала ұзартыңыз.
          </p>
        )}
      </section>

      <Section title="Лимиттердің қолданылуы">
        <div className="grid gap-4 md:grid-cols-2">
          <UsageMeter id="students" title="Оқушылар" used={Number(u.students)} max={u.max_students} />
          <UsageMeter id="teachers" title="Мұғалімдер" used={Number(u.teachers)} max={u.max_teachers} />
        </div>
      </Section>

      <Section title="Лицензия мерзімі біткенде не болады">
        <ul className="card list-disc space-y-2 p-5 pl-9 text-sm">
          <li><strong>Деректер өшірілмейді:</strong> сыныптар, тапсырмалар, жұмыстар, бағалар мен курстар сақталады.</li>
          <li><strong>Оқуға және экспорттауға болады:</strong> есептерді жүктеп алу жалғасады.</li>
          <li>Оқушылар бұрын берілген тапсырмаларды мерзімі бойынша тапсыра алады.</li>
          <li><strong>Шектеледі:</strong> жаңа сынып, тапсырма, курс жариялау, жаңа мұғалім шақыру және оқушылардың жаңа қосылуы.</li>
          <li>Лицензия ұзартылған соң шектеулер бірден алынады.</li>
        </ul>
      </Section>
    </>
  );
}

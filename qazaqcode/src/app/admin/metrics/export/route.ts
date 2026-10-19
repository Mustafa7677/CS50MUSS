import { getContext } from "@/lib/context";
import { almatyToday, auditMetricsExport, platformKpis, platformOrgHealth } from "@/lib/metrics/queries";
import { FUNNEL_LABEL } from "@/components/metrics/Charts";
import { rateLimit } from "@/lib/rate-limit";
import { errorCode } from "@/lib/errors";
import { csvResponse } from "@/app/school/csv";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
const TABLES = ["daily", "funnel", "retention_orgs", "retention_students", "health"] as const;
type T = (typeof TABLES)[number];

/** Метрика CSV: тек SUPER ADMIN, тек жиынтық (жеке деректі жоқ). csvCell мәтіннің алдына ' қойып формула енгізуден қорғайды. Экспорт аудитке жазылады. */
export async function GET(req: Request) { const t = await getT();
  const ctx = await getContext();
  if (!ctx) return new Response(t("Жүйеге кіріңіз"), { status: 401 });
  if (!ctx.isPlatformAdmin) return new Response(t("Рұқсат жоқ"), { status: 403 });
  const u = new URL(req.url);
  const tt = (u.searchParams.get("t") ?? "daily") as T;
  if (!TABLES.includes(tt)) return new Response(t("t параметрі дұрыс емес"), { status: 400 });
  const days = [7, 30, 90].includes(Number(u.searchParams.get("days"))) ? Number(u.searchParams.get("days")) : 30;
  const demo = u.searchParams.get("demo") === "1";
  try {
    await rateLimit("metrics-csv", 20, 60_000, ctx.userId);
    await auditMetricsExport(ctx.userId, null, "platform_csv");      // журналсыз экспорт берілмейді
    const file = (n: string) => `metrika-${n}-${almatyToday()}${demo ? "-demo" : ""}.csv`;
    if (tt === "health") {
      const rows = await platformOrgHealth(ctx.userId, 28, demo);
      return csvResponse(file(tt), [t("Ұйым"), t("ДЕМО"), t("Лицензия"), t("Оқушы"), t("Белсенді оқушы"), t("Белсенді үлес %"), t("Күтілетін орындау"), t("Орындалған"), t("Орындау %"), t("Уақтылылық %"), t("Лимит қолдану (құрамдас) %"), t("Ұпай"), t("Күй"), t("Шағын n")],
        rows.map((o) => [o.org_name, o.is_demo ? t("ДЕМО") : "", o.license_state, o.students, o.active_students, pct(o.components.active_share), o.expected, o.completed, pct(o.components.completion), pct(o.components.timeliness), pct(o.components.seats), o.score ?? "", o.band, o.small_n ? t("иә") : t("жоқ")]));
    }
    const k = await platformKpis(ctx.userId, days, demo);
    if (tt === "daily") return csvResponse(file(tt), [t("Күні"), "DAU", t("DAU оқушы"), t("DAU мұғалім"), t("DAU әкімші"), "WAU", "MAU"], k.daily.map((d) => [d.day, d.dau, d.student, d.teacher, d.school_admin, d.wau, d.mau]));
    if (tt === "funnel") return csvResponse(file(tt), [t("Қадам"), t("Саны")], k.funnel.map((s) => [FUNNEL_LABEL[s.key], s.count]));
    const cohorts = tt === "retention_orgs" ? k.retention_orgs : k.retention_students;
    return csvResponse(file(tt), [t("Когорт (апта басы)"), t("Көлемі"), ...Array.from({ length: k.weeks }, (_, i) => t("Апта +{i}", { i }))],
      cohorts.map((c) => [c.cohort, c.size, ...Array.from({ length: k.weeks }, (_, i) => c.active[i] ?? "")]));
  } catch (e) {
    const code = errorCode(e);
    if (code === "rate_limited") return new Response(t("Тым жиі сұраныс"), { status: 429 });
    if (code === "forbidden") return new Response(t("Рұқсат жоқ"), { status: 403 });
    return new Response(t("Қате болды"), { status: 500 });
  }
}
const pct = (v: number | null) => (v == null ? "" : Math.round(v * 1000) / 10);
